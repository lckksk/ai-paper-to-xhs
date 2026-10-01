# -*- coding: utf-8 -*-
"""统计小红书正文.md 的标题/正文字数并做敏感词扫描

发布硬约束：标题≤20 字符，正文含标签≤1000 字符。
扫描三类风险词（极限词/承诺夸大/引流），命中输出上下文供人工复核。

用法: python count_body.py <正文.md>
"""
import re
import sys


# (类别, [词或正则])；命中只代表「需复核」，极限词有原文归因时可保留
RISK_PATTERNS = [
    ("极限词", [
        r"最[强快大小牛猛狠好优先进聪明靠谱]",
        r"第一(?!次|篇|步|个|句|时间|人称|部分|章|节|行|页|条|批|波|轮|期|天|印象|反应|性原则)",
        r"唯一", r"绝对", r"100%", r"百分百", r"秒杀", r"秒了", r"吊打",
        r"完爆", r"碾压", r"史上最", r"全网最", r"遥遥领先", r"断层第一",
    ]),
    ("承诺夸大", [r"保证", r"稳赚", r"必涨", r"永久有效", r"零风险", r"包会", r"一看就会"]),
    ("引流", [r"加微信", r"加我", r"私信", r"vx号?", r"v信", r"扫码", r"二维码", r"评论区留"]),
]


def scan(text):
    """返回 [(类别, 命中词, 所在行)]，按出现顺序。"""
    hits = []
    for line in text.splitlines():
        for cat, patterns in RISK_PATTERNS:
            for p in patterns:
                for m in re.finditer(p, line, re.I):
                    frag = line[max(0, m.start() - 12):m.end() + 12].strip()
                    hits.append((cat, m.group(0), frag))
    return hits


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

    hits = scan(m.group(1))
    if not hits:
        print("敏感词扫描: ✓ 未命中")
        return
    print(f"敏感词扫描: ⚠️ {len(hits)} 处命中（逐条判断：原文归因可保留，自评极限词改写成具体事实）")
    for cat, word, frag in hits:
        print(f"  [{cat}] {word}  …{frag}…")


if __name__ == "__main__":
    main()
