import sys
import unittest
from pathlib import Path

ARCHIVE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ARCHIVE))
from rule_sequence_canonical import canonicalize


class NormalizationTests(unittest.TestCase):
    def test_documented_examples(self):
        cases = [
            (["B22/S4304/C5"], "1", ["B2/S034/C5"], "1"),
            (["B2/S/C5", "B1/S3/C8"], "12", ["B2/S/C5", "B1/S3/C6"], "12"),
            (["B2/S/C4", "B1/S3/C8"], "1222", ["B2/S/C4", "B1/S3/C7"], "1222"),
            (["B2/S/C5", "B1/S2/C5", "B1/S2/C5"], "123", ["B2/S/C5", "B1/S2/C5"], "122"),
            (["B2/S/C5", "B1/S2/C5", "B3/S/C5"], "312312", ["B3/S/C5", "B2/S/C5", "B1/S2/C5"], "123123"),
            (["B2/S/C5", "B1/S2/C5"], "222", ["B1/S2/C5"], "111"),
        ]
        for rules, sequence, expected_rules, expected_sequence in cases:
            with self.subTest(sequence=sequence, rules=rules):
                self.assertEqual(canonicalize(rules, sequence), (expected_rules, expected_sequence))

    def test_every_published_expression_is_canonical_and_idempotent(self):
        lines = (ARCHIVE / "oblique_list.txt").read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(lines), 4802)
        for number, line in enumerate(lines, 1):
            rules_text, sequence_text, _ = line.split(";")
            rules = [rule.strip() for rule in rules_text.split(",")]
            sequence = sequence_text.strip().removeprefix("Seq ")
            normalized = canonicalize(rules, sequence)
            self.assertEqual(normalized, (rules, sequence), f"Entry {number}")
            self.assertEqual(canonicalize(*normalized), normalized)


if __name__ == "__main__":
    unittest.main()
