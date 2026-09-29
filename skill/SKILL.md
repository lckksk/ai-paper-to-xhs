---
name: jiedu-lunwen
description: 解读 AI 论文与厂商博客，产出可直接发布的小红书发布物：成稿、事实核对清单、3:4 配图卡片、台账回填。只要用户给出 arXiv / Hugging Face Papers / 厂商博客的链接或论文 PDF，要求「解读这篇论文」「写成小红书笔记」「出卡片/配图」，或要求按 sources.md 跑每周选题-成稿流水线，都使用本 skill——即使用户没有明说「小红书」或「发布」。
---

# 解读论文 → 小红书发布物

把一篇 AI 论文/博客变成可直接发布的小红书笔记。工作区根目录是本 skill 所在项目的根目录（含 sources.md、templates/、topics.xlsx、posts/）。

## 输入

用户会给其中之一：

- 论文链接（arXiv abs 页 / Hugging Face papers 页）
- 厂商博客链接
- 本地 PDF 路径
- 没有具体输入、要求「跑本周选题」：读 `weekly/<当前周次>/原材料/`（周六定时任务已采集好）与 `topics.xlsx`，按 `sources.md` §四 排序规则自动选题；当周无原材料时，先按 `sources.md` §三 手动采集

## 产出（固定目录结构）

```
posts/<年份>-Wxx/<今日日期>-<选题短名>/     # 周目录与 weekly/ 的周次对齐
├── 正文.md          标题 + 正文 + 标签 + 配图清单
├── 事实核对.md      每条可核实陈述 → 原文出处（用户发布前人工终审用）
├── 卡片.js / 卡片源文件.pptx
└── 封面卡.png / 内容卡1-*.png / 内容卡2-*.png   1242×1656 (3:4)
```

## 流程

1. **抓全文**：网页优先用 `web_reader`；arXiv 论文抓 HTML 全文版 `https://arxiv.org/html/<id>`（比摘要多出方法细节和小节定位）；本地 PDF 直接用 Read。只读摘要不算「深度解读」——每个数字都要能定位到小节。抓到的全文转存为 `weekly/<周次>/原材料/论文全文/<短名>-arxiv<id>.md`（带 `sources.md` §五 的元数据头），解读与存档用同一份材料。
2. **先写 事实核对.md 再写成稿**：正文里每个数字/论断一行，标注论文位置，核对状态列留 `[ ]` 给用户。写成稿时若发现某陈述找不到原文依据，删掉而不是模糊化。
3. **成稿**：读 `templates/小红书笔记模板.md`（正文骨架、深度要求与硬约束以它为准）。成稿后执行去 AI 味工序：读已安装的 humanize-writing skill（`~/.agents/skills/humanize-writing/SKILL.md`）按其 8 遍流程逐遍过稿，配合 `references/中文AI味清单.md`（中文专属词表）；再对照 `references/对标打法.md`（四位对标博主的技法卡）自查开场、比喻密度与反方意见。写完必须实测字数：`python scripts/count_body.py <正文.md 路径>`，超了就删，不注水。
4. **做卡片**：读 `references/卡片规范.md`；把 `assets/卡片模板.js` 复制为 `posts/.../卡片.js`，只替换三页的文字内容与数据，保持版式常量、调色板、字号体系不变。运行 `NODE_PATH="$(npm root -g)" node 卡片.js` 生成 `卡片源文件.pptx`。
5. **渲染**：`python scripts/render_cards.py 卡片源文件.pptx .` → 三张 1242×1656 PNG。
6. **视觉审查**：把三张 PNG 交给 `presentations:visual-judge` 子代理审版式（溢出/对比度/对齐），不通过的项改 卡片.js 后重渲再审。
7. **回填台账**：`topics.xlsx` 候选清单该行状态 → `已成稿`；「发布记录」加一行，发布链接与数据留空给用户发布后回填。
8. **交付提醒**：明确告诉用户先过一遍 `事实核对.md` 再发布，发布时按平台要求勾选 AIGC 声明。终审通过前不要替用户发布。

## 红线

- 引号里的数字必须能在原文中指出位置；找不到就不写。热度数据（点赞/榜名）是抓取时点快照，交付时注明。
- 不搬运他人解读图；卡片图内文字每张 ≤40 字。
- 事实核对清单是流程的一部分，不是可选项——学术内容翻车成本远高于少发一篇。
- 成稿后按 humanize-writing 8 遍流程 + `references/中文AI味清单.md` 自查：装口语小标题、说教金句结尾、段段 emoji、悬念空钩标题，出现即整段重写——这是用户明确点过的雷区，不要微调糊弄。

## 按需运行模式（用户触发）

定时任务已于 2026-09-26 取消，由用户在对话中启动（如「跑今天」「跑最近一周」「解读这篇」）。采集窗口 = 上次采集的次日至今（看最近一次采集日志或台账日期，默认回溯 ≤7 天）；每次运行成稿 2~3 篇（按 sources.md §四 排序取前几名，供用户挑选发布），用户点名选题不受限。全程不向用户提问；无法推进的异常（如全文抓不到）写入当周采集日志并跳到下一篇候选。**终审与发布永远由用户人工完成**，交付物默认停在待终审状态。

## 迁移与复现

整套系统（skill + 规范 + 迁移脚本）可打包迁往新机器：

- **打包**：`python .agents/skills/jiedu-lunwen/scripts/export_bundle.py` → `migration/jiedu-lunwen-bundle-<日期>/`（skill + humanize-writing + 工作区种子 + 数据存档 + README）及同名 zip；`--no-data` 可只打系统不打数据
- **恢复**：解压后依次运行 `python skill/scripts/setup_env.py --fix`（环境自检/装依赖）和 `python skill/scripts/bootstrap_workspace.py <新工作区路径>`（初始化工作区并安装两个 skill）
- **数据迁移**：旧机 `weekly/`、`posts/`、`topics.xlsx` 拷到新工作区同名位置即可
- 迁移后在新工作区照常使用本 skill；工作区种子里的 sources.md 是打包时点的版本，可继续维护
