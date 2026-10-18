#!/usr/bin/env python3
"""Vocabulary recycling audit for one LingoFlow level.

Input: a text file with one block per scene, in learning order:

    ## 01 Hello!
    Hello! | Hi! Good morning! | ...

(one scene title line starting with "## ", then the English lines of that scene,
separated by "|" or newlines). Use mcp__lingoflow__get_scene to collect them.

Prints: unique words, new words per scene, words seen in only one/two scenes
(at risk of being forgotten) and the most recycled words.

Usage: python3 -I scripts/content/vocab_audit.py starter.txt [--names extra,names]
"""
import argparse
import collections
import re

DEFAULT_NAMES = {
    "tom", "sara", "ali", "nina", "alex", "sofia", "emma", "sam", "max", "baker",
    "toronto", "vancouver", "rome", "shiraz", "tehran", "tabriz", "texas", "london",
    "moscow", "york",
}


def tokens(text):
    text = text.lower().replace("’", "'")
    text = re.sub(r"\b[a-z](-[a-z])+\b", " ", text)  # spelled letters: B-A-K-E-R
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--names", default="", help="comma-separated extra proper names to ignore")
    args = ap.parse_args()
    names = DEFAULT_NAMES | {n.strip().lower() for n in args.names.split(",") if n.strip()}

    scenes, cur = [], None
    with open(args.file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("## "):
                cur = {"title": line[3:], "text": ""}
                scenes.append(cur)
            elif line and cur is not None:
                cur["text"] += " " + line

    count = collections.Counter()
    in_scenes = collections.defaultdict(set)
    first = {}
    rows = []
    for i, s in enumerate(scenes, 1):
        ws = [w for w in tokens(s["text"]) if w not in names]
        new = set()
        for w in ws:
            count[w] += 1
            in_scenes[w].add(i)
            if w not in first:
                first[w] = i
                new.add(w)
        rows.append((i, s["title"], len(new), len(ws)))

    print(f"scenes: {len(scenes)}  unique words: {len(count)}  tokens: {sum(count.values())}\n")
    print("NEW WORDS PER SCENE (target <= ~10 after the first scenes)")
    for i, title, n, total in rows:
        flag = "  <-- heavy" if n > 12 and i > 2 else ""
        print(f"{i:02d} {title[:34]:34s} new={n:3d} tokens={total}{flag}")

    once = sorted(w for w in count if len(in_scenes[w]) == 1)
    twice = sorted(w for w in count if len(in_scenes[w]) == 2)
    print(f"\nin only 1 scene: {len(once)} ({100 * len(once) // max(len(count), 1)}%)")
    print(f"in 2 scenes: {len(twice)}")
    print(f"in >= 4 scenes: {sum(1 for w in count if len(in_scenes[w]) >= 4)}")
    print("\nONLY ONE SCENE (word:scene):")
    print(", ".join(f"{w}:{first[w]}" for w in once))
    print("\nTWO SCENES:")
    print(", ".join(twice))
    top = sorted(count, key=lambda w: -len(in_scenes[w]))[:60]
    print("\nMOST RECYCLED (word:#scenes):")
    print(", ".join(f"{w}:{len(in_scenes[w])}" for w in top))


if __name__ == "__main__":
    main()
