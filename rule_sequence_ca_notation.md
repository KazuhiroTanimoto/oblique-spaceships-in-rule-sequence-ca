# Rule Sequence CA Notation Specification

Explanatory prose and CA notation records: CC BY 4.0, Kazuhiro Tanimoto. Executable code examples: CC0 1.0 Universal. See [LICENSE](LICENSE) for the scope and full license texts.

## 1. Purpose

This notation is intended to represent cellular automata using:

- one or more outer-totalistic rules,
- an explicit sequence describing the temporal order in which those rules are applied,
- and an optional compact initial configuration.

The design goals are:

- **human-readable**
- **machine-readable**
- **compact**
- easy to copy, store, publish, and parse
- compatible in spirit with familiar `B/S/C` notation

---

## 2. Rule notation

Each rule is written in the following form:

```text
B<birth>/S<survival>/C<states>
```

Example:

```text
B34/S12/C3
```

means:

- Birth when the number of active neighbors is 3 or 4
- Survival when the number of active neighbors is 1 or 2
- Total number of cell states = 3

Another example:

```text
B2/S0345/C6
```

means:

- Birth at neighbor count 2
- Survival at neighbor counts 0, 3, 4, or 5
- Total number of states = 6

An empty condition is allowed.

Example:

```text
B2/S/C5
```

means:

- Birth at neighbor count 2
- No survival condition
- Total number of states = 5

---

## 3. Multiple rules

Multiple rules are listed in order and separated by commas.

Example:

```text
B34/S12/C3, B24/S1/C4, B3/S234/C5, B2/S0345/C6
```

Rules are assigned identifiers according to their order:

```text
1 = B34/S12/C3
2 = B24/S1/C4
3 = B3/S234/C5
4 = B2/S0345/C6
```

---

## 4. Rule sequence

The order in which rules are applied over time is written after `Seq`.

Example:

```text
B34/S12/C3, B24/S1/C4, B3/S234/C5, B2/S0345/C6; Seq 1234
```

This means:

```text
Rule 1 → Rule 2 → Rule 3 → Rule 4 → repeat
```

The sequence repeats periodically unless otherwise specified.

Example:

```text
Seq 11122344
```

means:

```text
1 → 1 → 1 → 2 → 2 → 3 → 4 → 4 → repeat
```

A single-rule cellular automaton is represented by defining one rule and using `Seq 1`:

```text
B36/S1245/C3; Seq 1
```

The sequence repeats rule 1 every generation, with no rule switching. Both explicit `Init` patterns and `Init Random` forms can be used with `Seq 1`. For example, Conway's Game of Life with a 20% random initial configuration is:

```text
B3/S23/C2; Seq 1; Init Random 20%
```

---


## 5. Canonicalization of rules and sequences

Normalize the rule list and `Seq` before publication or comparison. This operation is independent of `Init`: it does not minimize initial structures, spatial orientation, displacement or period. The reference implementation is [rule_sequence_canonical.py](rule_sequence_canonical.py).

### 5.1 Publication order

1. Parse the subrules and the literal sequence into rule references. Sort and deduplicate the digits in B and S.
2. Compute the canonical C of every used subrule from the full cyclic sequence, using Section 11.5.
3. Merge subrules that are identical after normalization and remove unused rule definitions.
4. Assign identifiers in the order of first use in `Seq` and rewrite every sequence position with its new identifier.

Normalize state counts before merging: reducing redundant C values can make previously different rule definitions identical.

### 5.2 First-use identifiers

Rule identifiers are labels. Reorder the definitions so that the first rule used becomes Rule 1, the next previously unseen rule becomes Rule 2, and so on. For example:

```text
B2/S/C5, B1/S2/C5, B3/S/C5; Seq 312312
-> B3/S/C5, B2/S/C5, B1/S2/C5; Seq 123123
```

The rule definitions have moved with their identifiers, so the initial temporal phase and every applied transition function are preserved.

### 5.3 Duplicate subrules

Retain one copy of each identical normalized subrule and rewrite `Seq` to reference it. For example:

```text
B2/S/C5, B1/S2/C5, B1/S2/C5; Seq 123
-> B2/S/C5, B1/S2/C5; Seq 122
```

After merging, assign identifiers in first-use order again. The number of generations in the program remains unchanged.

### 5.4 Literal temporal program

Repeated appearances specify how many generations a rule is applied. `Seq 1222` must not become `Seq 12`, because these are different temporal programs.

Keep the starting phase and every sequence position. Do not rotate `Seq`, and do not shorten even a repeated block such as `123123` to `123`; the publication convention retains the literal program.

### 5.5 Sorted birth and survival conditions

Sort the neighbor-count digits in B and S and remove repeated digits:

```text
B22/S4304/C5; Seq 1
-> B2/S034/C5; Seq 1
```

Neighbor-count order and duplicate conditions do not change the transition rule.

---

## 6. One-character identifiers

To keep rule identifiers and state values compact, one-character symbols are used.

The symbol mapping is:

```text
1-9  = 1-9
A-Z  = 10-35
a-z  = 36-61
```

Therefore, a single character can represent values from **1 to 61**.

This mapping is case-sensitive.

Examples:

```text
A = 10
Z = 35
a = 36
z = 61
```

This same encoding may be used for:

- rule identifiers in `Seq`
- cell-state identifiers in the initial configuration

Thus, up to **61 distinct rules** can be referenced directly in a compact sequence.

Example:

```text
Seq 12ABaz
```

means:

```text
1 → 2 → 10 → 11 → 36 → 61
```

---

## 7. Initial configuration

The initial configuration is written after `Init`.

Two forms are supported:

1. an explicit cell-state pattern
2. a random binary initial configuration with a specified density

### 7.1 Explicit pattern

Basic form:

```text
Init <row>/<row>/<row>/...
```

Each row is written from left to right, and rows are listed from top to bottom.

#### State symbols

For the initial configuration:

```text
0    = state 0
1-9  = states 1-9
A-Z  = states 10-35
a-z  = states 36-61
```

Example:

```text
Init 0100/2340/0050
```

represents:

```text
0 1 0 0
2 3 4 0
0 0 5 0
```

Another example:

```text
Init 01A/aZz
```

represents:

```text
0  1 10
36 35 61
```

The initial width and height are inferred from the row data, so explicit `x=` and `y=` values are not required.

---


### 7.2 Random binary initial configuration

A random initial configuration may be specified by giving the probability that each cell starts in state 1.

Two equivalent forms are supported:

```text
Init Random 20%
```

and:

```text
Init Random(0.2)
```

Both mean:

```text
state 1 with probability 0.2
state 0 with probability 0.8
```

The decimal form uses a value in the range:

```text
0.0 <= density <= 1.0
```

The percentage form uses the equivalent range:

```text
0% <= density <= 100%
```

Examples:

```text
Init Random 5%
Init Random(0.05)
```

are equivalent.

Likewise:

```text
Init Random 50%
Init Random(0.5)
```

are equivalent.

`Random` refers specifically to a **binary random initial configuration using states 0 and 1 only**.

States 2 and above are not generated by this form, even when one or more subrules have `C > 2`.

The random density is independent of the canonical state-count calculation described later in this specification.

If strict reproducibility is required, an implementation may optionally support a random seed separately, but the seed is not part of the core `Init Random(...)` syntax.

## 8. Explicit cell representation

Write one state symbol or bracketed integer per cell. Repeated cells are written individually:

```text
Init 000001/00111/0000000
```

State 0 is written as `0`. Dot notation and run-length shorthand are not supported.

---

## 9. Extended numeric notation

The one-character notation directly supports values from 0 to 61 for states and from 1 to 61 for rule identifiers.

If larger values are needed, bracket notation may be used:

```text
[62]
[127]
[255]
```

For example:

```text
Init 01[62]/[127]00
```

This allows arbitrary non-negative state numbers while preserving the one-character notation for common cases.

Likewise, if more than 61 rules are required, bracket notation may be used inside `Seq`:

```text
Seq 12[62][63]
```

---

## 10. Complete example

```text
B34/S12/C3, B24/S1/C4, B3/S234/C5, B2/S0345/C6; Seq 1234; Init 0100/2340/0050
```

This defines:

```text
Rule 1 = B34/S12/C3
Rule 2 = B24/S1/C4
Rule 3 = B3/S234/C5
Rule 4 = B2/S0345/C6

Sequence:
1 → 2 → 3 → 4 → repeat

Initial configuration:
0 1 0 0
2 3 4 0
0 0 5 0
```

---


## 11. State handling when switching between rules with different `C`

When the rule sequence switches between rules with different state counts, cell states are **not remapped in advance**.

Instead, each generation is evaluated directly using the `C` value of the rule selected for that generation.

For a rule with `C = N`, its normal state range is:

```text
0, 1, 2, ..., N-1
```

The update behavior is:

```text
state 0:
    becomes state 1 if the birth condition is satisfied;
    otherwise remains 0.

state 1:
    remains state 1 if the survival condition is satisfied;
    otherwise becomes state 2 when C > 2,
    or state 0 when C = 2.

state >= 2:
    becomes state + 1 if state + 1 < C;
    otherwise becomes state 0.
```

Only cells in **state 1** are counted as active neighbors.

### 11.1 Switching to a rule with more states

If a cell is already in a refractory state and the next rule has a larger `C`, its refractory progression can continue into the larger state range.

Example:

```text
current state = 2
next rule = .../C6
```

produces:

```text
2 → 3
```

because `3 < 6`.

Thus, switching to a rule with more states can extend the remaining refractory lifetime of an existing cell.

### 11.2 Switching to a rule with fewer states

If the current state cannot advance within the state range of the newly selected rule, it returns to state 0 on that update.

Example:

```text
current state = 5
next rule = .../C4
```

produces:

```text
5 → 0
```

because `5 + 1 < 4` is false.

Likewise:

```text
current state = 3
next rule = .../C4

3 → 0
```

There is therefore no explicit modulo conversion, clamping, or pre-switch remapping. The numeric state is retained until the next update, and the newly selected rule determines its next state.

### 11.3 Strictly alternating two-rule systems

For two rules applied in strict alternation:

```text
Seq 12
```

or an equivalent cyclic phase, if their state counts differ, the larger state count does not necessarily produce additional reachable states.

Let:

```text
C_small < C_large
```

Because the larger-`C` rule is applied only once before the smaller-`C` rule is applied again, the effective state count is:

```text
C_effective = min(C_large, C_small + 1)
```

Therefore:

```text
C5 / C8
```

under strict alternation has the same state-transition behavior as:

```text
C5 / C6
```

The additional states allowed by `C8` are never reached before the `C5` rule is applied again and forces the refractory progression back to state 0.

The displayed colors may still differ in an implementation that derives its color scale from the maximum declared `C`, even when the cellular dynamics are identical.

For canonical rule recording, the larger state count in a strictly alternating two-rule system should therefore be reduced to at most:

```text
C_small + 1
```

Example:

```text
B2/S/C5, B1/S3/C8; Seq 12
-> B2/S/C5, B1/S3/C6; Seq 12
```

### 11.4 Two-rule periodic sequences with repeated applications

For a two-rule periodic sequence, the effective state range depends not only on the two `C` values but also on how many consecutive times the larger-`C` rule is applied before the smaller-`C` rule is encountered again.

Suppose:

```text
Rule 1: C4
Rule 2: C8
Seq 11222
```

Consider a cell that fails the survival condition during the first application of Rule 1.

Its refractory progression can be:

```text
Rule 1: 1 → 2
Rule 1: 2 → 3
Rule 2: 3 → 4
Rule 2: 4 → 5
Rule 2: 5 → 6
Rule 1: 6 → 0
```

Although Rule 2 is declared as `C8`, state 7 is never reached in this trajectory because the sequence returns to the `C4` rule first.

For a run in which the larger-`C` rule is applied `r` consecutive times before returning to the smaller-`C` rule, the effective state count is bounded by:

```text
C_effective = min(C_large, C_small + r)
```

where:

- `C_small` is the smaller declared state count,
- `C_large` is the larger declared state count,
- `r` is the number of consecutive applications of the larger-`C` rule before the sequence returns to the smaller-`C` rule.

For the example above:

```text
C_small = 4
C_large = 8
r = 3

C_effective = min(8, 4 + 3) = 7
```

so the highest reachable refractory state in this progression is state 6. A complete normalization example is:

```text
B2/S/C4, B1/S3/C8; Seq 1222
-> B2/S/C4, B1/S3/C7; Seq 1222
```

If a periodic sequence contains runs of different lengths, use the longest cyclic run of the larger-`C` rule when describing the global upper bound:

```text
C_effective,max = min(C_large, C_small + r_max)
```

This rule applies specifically to a periodic system composed of **two subrules with different state counts**. Systems with three or more different state counts can require analysis of the full cyclic sequence rather than a single pairwise formula.

### 11.5 General canonical state-count definition

The canonical state count should be defined from the periodic rule sequence itself, independently of any particular initial configuration.

Let `M_p` be the incoming maximum state at phase p in the periodic state-range envelope. For the rule used at that phase:

```text
M_(p+1) = min(C_p - 1, M_p + 1)
```

Start at the largest C used by the sequence minus one. Repeat full cycles until the incoming bound at the start of a cycle is unchanged. Record the incoming bound at each phase of that fixed cycle.

At phase p, the minimum C that preserves the transitions within that incoming envelope is:

```text
C_p^min = min(C_p, M_p + 2)
```

Then, for each subrule `R_i`, define its canonical state count as:

```text
C_i^canonical = max over all phases p with R(p) = R_i of C_p^min
```

Equivalently:

\[
C_i^{\mathrm{canonical}}
=
\max_{p:\,R(p)=R_i} C_p^{\min}
\]

This definition works uniformly for periodic systems with any number of subrules.

The calculation includes runs that cross the sequence's end/start boundary. It is a rule-sequence state-range normalization, rather than a reduction based on the states observed in one selected spaceship. The two-rule formulas in Sections 11.3 and 11.4 are shortcuts derived from this general definition.

### 11.6 Independence from the initial configuration

Canonical state counts are defined **without reference to `Init`**.

The rule set and `Seq` define the dynamical system. `Init` is only an initial condition supplied to that system and must not change the canonical rule representation.

Therefore:

```text
Rules + Seq
```

must always produce the same canonical state counts regardless of which valid initial configuration is later used.

An initial configuration is valid only if every state it contains is representable by the canonical rule system.

In other words, `Init` must not contain a state outside the canonical state range.

If an initial configuration contains such a state, that `Init` is invalid for the canonical representation; the canonical state counts are not expanded to accommodate it.

This keeps the canonical rule notation independent of pattern-specific choices.

Canonical C reduction preserves updates within the periodic state-range envelope. It does not promise equivalent transients for arbitrary initial states outside that envelope. The archived demo parser preserves supplied numeric states and does not calculate or enforce this publication normalization.

Different initial structures may share canonical `Rules + Seq`. Retain their separate records when their complete `Rules + Seq + Init` expressions differ. Removing identical complete expressions is a separate list-deduplication operation. Normalization neither proves novelty nor establishes whether a structure emerges from a random initial configuration.

### 11.7 Consequence for canonicalization

State counts should not be kept larger than the periodic rule sequence can actually use.

For each subrule:

1. Analyze every phase at which that subrule appears.
2. Determine the minimum state count needed at each such phase.
3. Assign the subrule the maximum of those phase-wise minima.
4. Reduce any larger declared `C` to that canonical value.

This normalization preserves the rule-sequence dynamics while removing dynamically redundant states.

A visualization may still derive colors from the originally declared maximum `C`, so visual appearance can differ even when the canonicalized cellular dynamics are identical.

---

## 12. Parsing rules

A parser should interpret the notation in the following order:

1. Split the full expression at semicolons.
2. Parse the comma-separated rule definitions.
3. Parse `Seq` as the repeated temporal rule sequence, retaining its starting phase and every generation.
4. Sort and deduplicate B/S digits, and normalize dynamically redundant state counts using the general phase-wise definition in Section 11.5.
5. Remove unused subrules and merge identical normalized subrules, rewriting `Seq` accordingly.
6. Renumber the retained subrules in first-use order in `Seq`.
7. Parse `Init` either as an explicit cell-state grid or as a random binary initial condition.
8. Accept `Init Random 20%` and `Init Random(0.2)` as equivalent density specifications.
9. For random initialization, generate only states 0 and 1 according to the specified density.
10. Read each explicit cell separately; use `0` for state 0 and reject dot notation and repetition shorthand.
11. Treat uppercase and lowercase letters as distinct symbols.
12. Expand bracketed integers such as `[62]` when present.
13. Verify that every explicitly specified state used by `Init` lies within the canonical state range; otherwise reject the initial configuration as invalid.

Whitespace may be ignored around separators.

For example, these are equivalent:

```text
B34/S12/C3,B24/S1/C4;Seq 12;Init 01/12
```

```text
B34/S12/C3, B24/S1/C4; Seq 12; Init 01/12
```

---

## 13. Recommended canonical form

For publication and machine exchange, the recommended canonical form is:

```text
<rule 1>, <rule 2>, ...; Seq <sequence>; Init <pattern>
```

Example:

```text
B34/S12/C3, B24/S1/C4, B3/S234/C5, B2/S0345/C6; Seq 1234; Init 0100/2340/0050
```

A random initial condition may also be specified:

```text
B34/S12/C3, B24/S1/C4; Seq 12; Init Random(0.2)
```

or equivalently:

```text
B34/S12/C3, B24/S1/C4; Seq 12; Init Random 20%
```

If no initial configuration is being specified, `Init` may be omitted:

```text
B34/S12/C3, B24/S1/C4, B3/S234/C5, B2/S0345/C6; Seq 1234
```

---

## 14. Design summary

The notation separates three concepts cleanly:

```text
Rules = spatial transition rules
Seq   = temporal program
Init  = initial condition
```

This makes the notation suitable for rule-switching cellular automata while remaining compact enough for use in:

- research notes
- GitHub repositories
- web pages
- datasets
- filenames or identifiers
- automated search and simulation pipelines

## 15. Implementation profile in this archive

The Python publication normalizer implements condition sorting, general cyclic C normalization, duplicate merging, unused-rule removal and first-use numbering. It does not process `Init`. Both the normalizer and the browser demos support single-rule systems expressed with one rule and `Seq 1`.

The browser demos replay the supplied rules without automatic canonicalization. They implement explicit initial patterns with `0` for empty cells, bracketed numeric identifiers and both random binary initial forms in Section 7.2. Random density may range from 0 to 1 inclusive (0% to 100%); only states 0 and 1 are generated. Reset creates a fresh random board at the specified density, or restores the recorded structure for an explicit pattern. Edited rules, sequence and palette are retained.

The demos do not validate the canonical state-range requirement in Section 11.6. Supplied numeric states are preserved until the next rule update, and both initialization modes use Float64 state storage. These distinctions describe the implemented subset and do not change the notation specification.

## 16. Python usage

```python
from rule_sequence_canonical import canonicalize, expression

rules, sequence = canonicalize(["B2/S/C5", "B1/S3/C8"], "12")
assert rules == ["B2/S/C5", "B1/S3/C6"]
assert sequence == "12"

print(expression(["B2/S/C4", "B1/S3/C8"], "1222"))
# B2/S/C4, B1/S3/C7; Seq 1222
```
