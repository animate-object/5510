#! /usr/bin/env python3

import sys
from typing import List

USAGE = (
    "Usage: merge_word_lists.py <word_list1> <word_list2> [<output_word_list>]"
    + "\n\tIf <output_word_list> is not provided, print A - B"
)


def load_word_list(path) -> List[str]:
    """We support two word list formats
    1. One word per line
    2. Comma separated words in a single line
    """
    with open(path, "r") as f:
        lines = f.readlines()
        if len(lines) == 1:
            return lines[0].split(",")
        else:
            return [
                line.strip()
                for line in lines
                if line.strip() != "" and not line.startswith("#")
            ]


def merge_lists(
    base_list_path: str,
    merge_list_path: str,
    output_list_path: str = None,
    delimiter: str = ",",
) -> None:
    print("Merging word lists...")
    base_list = set(load_word_list(base_list_path))
    merge_list = set(load_word_list(merge_list_path))
    print(f"Base list has {len(base_list)} words")
    print(f"Merge list has {len(merge_list)} words")

    new_words = sorted(merge_list - base_list)

    print(f"Will add {len(new_words)} new words to the base list:")
    for word in new_words:
        print(f"\t- {word}")
    print()

    if output_list_path:
        merged = sorted(base_list.union(merge_list))
        with open(output_list_path, "w") as f:
            f.write(delimiter.join(merged))


def main():
    args = sys.argv[1:]

    if len(args) not in [2, 3]:
        print(USAGE)
        sys.exit(1)

    base_list_path = args[0]
    merge_list_path = args[1]
    output_list_path = args[2] if len(args) == 3 else None
    merge_lists(base_list_path, merge_list_path, output_list_path)


if __name__ == "__main__":
    main()
