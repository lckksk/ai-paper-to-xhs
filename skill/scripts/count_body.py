# -*- coding: utf-8 -*-
"""统计小红书正文.md 的正文与标题字数（发布硬约束：标题≤20，正文含标签≤1000）

用法: python count_body.py <正文.md>
"""
import re
import sys


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    text = open(sys.argv[1], encoding="utf-8").read()

    m = re.search(r"## 标题[^\n]*\n\n?([^\n]+)", text)
    title = m.group(1).strip() if m else ""
    print(f"标题: {len(title)} 字（上限 20）{'  ⚠️ 超限' if len(title) > 20 else '  ✓'}")

    m = re.search(r"## 正文[^\n]*\n(.*?)\n## 配图", text, re.S)
    if not m:
        sys.exit("未找到「## 正文 …」到「## 配图」之间的段落")
    body = re.sub(r"\s", "", m.group(1))
    print(f"正文(含标签): {len(body)} 字（上限 1000）{'  ⚠️ 超限，删减不注水' if len(body) > 1000 else '  ✓'}")


if __name__ == "__main__":
    main()
