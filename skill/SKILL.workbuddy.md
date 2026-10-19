---
name: jiedu-lunwen
description: 解读 AI 论文与厂商博客，产出可直接发布的小红书发布物：成稿、事实核对清单、3:4 配图卡片、台账回填。只要用户给出 arXiv / Hugging Face Papers / 厂商博客的链接或论文 PDF，要求「解读这篇论文」「写成小红书笔记」「出卡片/配图」，或要求按 sources.md 跑每周选题-成稿流水线，都使用本 skill——即使用户没有明说「小红书」或「发布」。
---

# 解读论文 → 小红书发布物

把一篇 AI 论文/博客变成可直接发布的小红书笔记。工作区根目录是本 skill 所在项目的根目录（含 sources.md、templates/、topics.xlsx、posts/）。

> **WorkBuddy 适配说明**（原版面向 ZCode）：
> - 原文提到的 `web_reader` / `browser-use` → 本环境用 `WebFetch` + `WebSearch` 替代。
> - humanize-writing 路径：`~/.workbuddy/skills/humanize-writing/SKILL.md`。
> - 卡片渲染依赖 `pptxgenjs`（Node 全局）+ `LibreOffice`（`soffice`）。若本机未装，可产出 `卡片.js` 但无法自动转 PNG，需手动在装有 LibreOffice 的机器上 `python scripts/render_cards.py 卡片源文件.pptx .` 渲染。

## 输入

用户会给其中之一：

- 论文链接（arXiv abs 页 / Hugging Face papers 页）
- 厂商博客链接
- 本地 PDF 路径
- 没有具体输入、要求「跑本周选题」：读 `weekly/<当前周次>/原材料/`（定时任务已采集好）与 `topics.xlsx`，按 `sources.md` §四 排序规则自动选题；当周无原材料时，先按 `sources.md` §三 手动采集

## 产出（固定目录结构）

```
posts/<年份>-Wxx/<今日日期>-<选题短名>/     # 周目录与 weekly/ 的周次对齐
├── 正文.md          标题 + 正文 + 标签 + 配图清单
├── 事实核对.md      每条可核实陈述 → 原文出处（用户发布前人工终审用）
├── 卡片.js / 卡片源文件.pptx
└── 封面卡.png / 内容卡1-*.png / 内容卡2-*.png   1242×1656 (3:4)
```

## 流程

1. **抓全文**：网页优先用 `WebFetch`（或 `WebSearch` 定位）；arXiv 论文抓 HTML 全文版 `https://arxiv.org/html/<id>`（比摘要多出方法细节和小节定位）；本地 PDF 直接用 Read。只读摘要不算「深度解读」——每个数字都要能定位到小节。抓到的全文转存为 `weekly/<周次>/原材料/论文全文/<短名>-arxiv<id>.md`（带 `sources.md` §五 的元数据头），解读与存档用同一份材料。
2. **先写 事实核对.md 再写成稿**：正文里每个数字/论断一行，标注论文位置，核对状态列留 `[ ]` 给用户。写成稿时若发现某陈述找不到原文依据，删掉而不是模糊化。
3. **成稿**：读 `templates/小红书笔记模板.md`（正文骨架、深度要求与硬约束以它为准）；**文风基准（2026-10-14 起）**：读 `references/文风参考-清熙体.md`，按其 7 节拍 + 8 条执行清单写（类比开场、动词化小标题、一句一段、硬核数字精确到个位、不鸡汤收口）。成稿后执行去 AI 味工序：读已安装的 humanize-writing skill（`~/.workbuddy/skills/humanize-writing/SKILL.md`）按其 8 遍流程逐遍过稿，配合 `references/中文AI味清单.md`（中文专属词表）。写完必须实测字数：`python scripts/count_body.py <正文.md 路径>`，超了就删，不注水。
4. **做卡片**：读 `references/卡片规范.md`；把 `assets/卡片模板.js` 复制为 `posts/.../卡片.js`，只替换三页的文字内容与数据，保持版式常量、调色板、字号体系不变。运行 `NODE_PATH="$(npm root -g)" node 卡片.js` 生成 `卡片源文件.pptx`。
5. **渲染**：`python scripts/render_cards.py 卡片源文件.pptx .` → 三张 1242×1656 PNG（需 LibreOffice）。
6. **视觉审查**：把三张 PNG 交给视觉审查（人工或子代理）审版式（溢出/对比度/对齐），不通过的项改 卡片.js 后重渲再审。
7. **回填台账**：`topics.xlsx` 候选清单该行状态 → `已成稿`；「发布记录」加一行，发布链接与数据留空给用户发布后回填。
8. **交付提醒**：明确告诉用户先过一遍 `事实核对.md` 再发布，发布时按平台要求勾选 AIGC 声明。终审通过前不要替用户发布。

## 成稿形态路由（先选形态，再动手）

| 形态 | 规范 | 适用 |
|---|---|---|
| 图文卡片笔记 | `references/卡片规范.md` + `references/热点帖与合集帖成稿规范.md` | 新闻、榜单、单点事实、每周合集；默认形态 |
| 知识短片（无旁白视频） | `references/视频成稿规范-vibe知识短片.md` | 讲**一个机制/原理**，且能在屏上"演"出来（写→跑→报错→改这类动作链） |

做视频时的三条硬约束（2026-10-19 定）：
- **不配音**——用户明确否决 AI 配音（"语音效果很差"），一律纯配乐 + 字幕 + 动效
- **母版 1080×1440**，小红书与抖音通用；不为迁就 9:16 把横向内容压成缝
- 一条片子只讲一个转折；能在屏上叫出名字的实物优先于抽象点线圈；成稿目录同时产出 `正文.md`（小红书）与 `发布文案-抖音.md`

## 红线

- 引号里的数字必须能在原文中指出位置；找不到就不写。热度数据（点赞/榜名）是抓取时点快照，交付时注明。
- 不搬运他人解读图；卡片图内文字每张 ≤40 字。
- 事实核对清单是流程的一部分，不是可选项——学术内容翻车成本远高于少发一篇。
- 成稿后按 humanize-writing 8 遍流程 + `references/中文AI味清单.md` 自查：装口语小标题、说教金句结尾、段段 emoji、悬念空钩标题，出现即整段重写——这是用户明确点过的雷区，不要微调糊弄。

## 按需运行模式（用户触发）

采集窗口 = 上次采集的次日至今（看最近一次采集日志或台账日期，默认回溯 ≤7 天）；每次运行成稿 2~3 篇（按 sources.md §四 排序取前几名，供用户挑选发布），用户点名选题不受限。全程不向用户提问；无法推进的异常（如全文抓不到）写入当周采集日志并跳到下一篇候选。**终审与发布永远由用户人工完成**，交付物默认停在待终审状态。

## 迁移与复现

整套系统（skill + 规范 + 迁移脚本）可打包迁往新机器：

- **打包**：`python ~/.workbuddy/skills/jiedu-lunwen/scripts/export_bundle.py` → `migration/jiedu-lunwen-bundle-<日期>/`
- **恢复**：解压后依次运行 `python skill/scripts/setup_env.py --fix`（环境自检/装依赖）和 `python skill/scripts/bootstrap_workspace.py <新工作区路径>`
- **数据迁移**：旧机 `weekly/`、`posts/`、`topics.xlsx` 拷到新工作区同名位置即可
