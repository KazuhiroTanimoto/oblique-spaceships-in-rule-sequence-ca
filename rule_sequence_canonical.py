"""Canonical labels and state counts, preserving the literal temporal program."""
import re

SYMBOLS = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'


def canonicalize(rules, sequence):
    parts = [re.fullmatch(r'B([0-8]*)/S([0-8]*)/C(\d+)', rule).groups() for rule in rules]
    tokens = re.findall(r'\[\d+\]|[1-9A-Za-z]', sequence)
    assert ''.join(tokens) == sequence and tokens
    indices = [int(token[1:-1])-1 if token.startswith('[') else SYMBOLS.index(token) for token in tokens]
    assert all(0 <= index < len(rules) for index in indices)
    counts = [int(part[2]) for part in parts]
    assert min(counts) >= 2
    # A phase's reachable maximum evolves as min(C-1, previous maximum+1).
    # Start at the largest declared range and find the periodic phase bounds.
    maximum = max(counts[index] for index in indices)-1
    while True:
        incoming = []
        for index in indices:
            incoming.append(maximum)
            maximum = min(counts[index]-1, maximum+1)
        if maximum == incoming[0]:
            break
    minimum = [max((min(count, incoming[phase]+2) for phase,index in enumerate(indices) if index == slot), default=2)
               for slot,count in enumerate(counts)]
    normalized = [f'B{"".join(sorted(set(b)))}/S{"".join(sorted(set(s)))}/C{count}'
                  for (b,s,_),count in zip(parts,minimum)]
    ordered, schedule = [], []
    for index in indices:
        rule = normalized[index]
        if rule not in ordered:
            ordered.append(rule)
        number = ordered.index(rule)+1
        schedule.append(SYMBOLS[number-1] if number <= 61 else f'[{number}]')
    return ordered, ''.join(schedule)


def expression(rules, sequence):
    normalized, schedule = canonicalize(rules, sequence)
    return ', '.join(normalized) + '; Seq ' + schedule
