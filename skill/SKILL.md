---
name: lunjian
description: 【论见】解读 AI 论文与厂商博客，产出可直接发布的小红书发布物：成稿、事实核对清单、3:4 配图卡片、台账回填。只要用户给出 arXiv / Hugging Face Papers / 厂商博客的链接或论文 PDF，要求「解读这篇论文」「写成小红书笔记」「出卡片/配图」，或要求按 sources.md 跑每周选题-成稿流水线，或用户说「跑论见」「启动论见」「论见今天」/「论见这篇」，都使用本 skill——即使用户没有明说「小红书」或「发布」。
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
├── 卡片.js / 卡片.html / cards/*.png
└── 封面卡.png / 内容卡1-*.png / 内容卡2-*.png   1242×1656 (3:4)
```

## 流程

1. **抓全文**：网页优先用 `web_reader`；arXiv 论文抓 HTML 全文版 `https://arxiv.org/html/<id>`（比摘要多出方法细节和小节定位）；本地 PDF 直接用 Read。只读摘要不算「深度解读」——每个数字都要能定位到小节。抓到的全文转存为 `weekly/<周次>/原材料/论文全文/<短名>-arxiv<id>.md`（带 `sources.md` §五 的元数据头），解读与存档用同一份材料。
2. **先写 事实核对.md 再写成稿**：正文里每个数字/论断一行，标注论文位置，核对状态列留 `[ ]` 给用户。写成稿时若发现某陈述找不到原文依据，删掉而不是模糊化。
3. **成稿**：读 `templates/小红书笔记模板.md`（正文骨架、深度要求与硬约束以它为准）；**文风基准（2026-10-14 起）**：读 `references/文风参考-清熙体.md`，按其 7 节拍 + 8 条执行清单写（类比开场、动词化小标题、一句一段、硬核数字精确到个位、不鸡汤收口）。成稿后执行去 AI 味工序：读已安装的 humanize-writing skill（`~/.agents/skills/humanize-writing/SKILL.md`）按其 8 遍流程逐遍过稿，配合 `references/中文AI味清单.md`（中文专属词表）；再对照 `references/对标打法.md`（四位对标博主的技法卡）自查开场、比喻密度与反方意见。写完必须实测字数并跑敏感词扫描：`python scripts/count_body.py <正文.md 路径>`（输出标题/正文字数 + 极限词/引流词命中清单），超了就删，极限词按 `references/发布前检查清单.md` 处理（原文归因可保留、自评改具体事实），其他命中项按清单逐条过。
4. **抓真实素材（必做，2026-10-20 起）**：读 `references/真实素材规范.md`，在成稿目录写 `shots-task.json`，跑 `scripts/fetch_shots.js` 抓真实页面截图到 `shots/`（热点帖 ≥2 张、合集帖每篇 1 张；封面卡必须有真实主视觉）。抓不到一手页面就退到官方物料/权威媒体，都没有就不上图——**不许 AI 编图或手搓假界面**。
5. **做卡片（HTML 引擎，2026-10-21 起）**：读 `references/卡片视觉规范.md`。引擎在 `assets/卡片-HTML/`：
   - `cards.js` 出 HTML（四个主题 editorial / stage / notebook / instrument，组件 cover / toc / paper / content / compare / tail）
   - `render.js` 用 Playwright 逐张截图 + 自动查缺图与越界
   参考实现：合集帖抄 `posts/2026-W42/周刊-2026-10-18-本周AI前沿TOP7/卡片-编辑风.js`（全套 10 张）。
   主题默认：**周日周刊全套 editorial；每日热点封面 stage + 内页 editorial；社会话题内页 notebook；技术硬题材整篇 instrument**。
   命令：`NODE_PATH=C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules "C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" 卡片.js`
   ⚠️ 换版式时**不许顺手改文案**——截图、标题、数字必须锁在同一个数据对象里，改一个看另外两个。
6. **渲染**：`NODE_PATH=C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules "C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" "E:/自媒体运营/ai-paper-to-xhs/skill/assets/卡片-HTML/render.js" --html 卡片.html --out .` → 每张 2484×3312 PNG，并打印缺图/越界告警（`文字被裁 10–40px` 是中文行高溢出的误报，超 40px 再当真）。
7. **视觉审查**：逐张 Read 看一遍（自检查不了「标题和图配错」）。同时看四件事：文字越界 / 截图是否被裁掉关键信息 / 底部是否贴边 / 留白断层是否 >300px 且没填。不合格改 `卡片.js` 后重渲。
8. **回填台账**：`topics.xlsx` 候选清单该行状态 → `已成稿`；「发布记录」加一行，发布链接与数据留空给用户发布后回填。
9. **交付提醒**：明确告诉用户先过一遍 `事实核对.md` 再发布，发布时按平台要求勾选 AIGC 声明。终审通过前不要替用户发布。

## 成稿形态路由（先选形态，再动手）

| 形态 | 规范 | 适用 |
|---|---|---|
| 图文卡片笔记 | `references/卡片规范.md` + `references/热点帖与合集帖成稿规范.md` | 新闻、榜单、单点事实、每周合集；默认形态 |
| 知识短片（无旁白视频） | `references/视频成稿规范-vibe知识短片.md` | 讲**一个机制/原理**，且能在屏上"演"出来（写→跑→报错→改这类动作链） |
| 账号拆解 | 已安装 skill `xhs-account-teardown` | 对标账号分析（仅公开数据、只读） |

做视频时的三条硬约束（2026-10-19 定）：
- **不配音**——用户明确否决 AI 配音（"语音效果很差"），一律纯配乐 + 字幕 + 动效
- **母版 1080×1440**，两平台通用；不为迁就 9:16 把横向内容压成缝
- 一条片子只讲一个转折；能在屏上叫出名字的实物优先于抽象点线圈

## 红线

- 引号里的数字必须能在原文中指出位置；找不到就不写。热度数据（点赞/榜名）是抓取时点快照，交付时注明。
- 不搬运他人解读图；卡片图内文字每张 ≤40 字。
- 事实核对清单是流程的一部分，不是可选项——学术内容翻车成本远高于少发一篇。
- 成稿后按 humanize-writing 8 遍流程 + `references/中文AI味清单.md` 自查：装口语小标题、说教金句结尾、段段 emoji、悬念空钩标题，出现即整段重写——这是用户明确点过的雷区，不要微调糊弄。

## 按需运行模式（用户触发）

定时任务已于 2026-09-26 取消，由用户在对话中启动（如「跑今天」「跑最近一周」「解读这篇」）。采集窗口 = 上次采集的次日至今（看最近一次采集日志或台账日期，默认回溯 ≤7 天）；每次运行成稿 2~3 篇（按 sources.md §四 排序取前几名，供用户挑选发布），用户点名选题不受限。全程不向用户提问；无法推进的异常（如全文抓不到）写入当周采集日志并跳到下一篇候选。**终审与发布永远由用户人工完成**，交付物默认停在待终审状态。

## 站内视角（选题与深读增强）

若 xiaohongshu MCP 已部署并登录（工具名前缀 `mcp__xiaohongshu`，部署手册见
`research/小红书自动化调研/调研拆解-xiaohongshu-mcp.md`）：

- **站内雷达**：选题阶段用 `search_feeds`（关键词 + 最多点赞 + 一周内）看 AI 赛道站内爆款，标题/封面/结构与公众号对标互补；候选评级时作为热度佐证
- **评论共鸣挖掘**：深读阶段对已有讨论热度的选题用 `get_feed_detail` 抓 10+ 条评论，按八类共鸣触发点（痛点/身份认同/焦虑解决/价值观/反差/可复制/分享欲/好奇）提炼进开场钩子。硬门槛：可用评论 <10 条时该维度标「未获取」，不硬写
- 未部署或未登录：跳过本节，在采集日志注明「站内视角不可用」

## 复盘（用户回报发布数据后）

按 `references/复盘框架.md` 执行：统一互动率口径（ER =（赞+评+藏）/浏览）、Top/Bottom
逐篇五维归因（选题/形式/钩子/时间/互动引导）、基准线只与自己历史均值比、不满 72h 不进
Bottom 榜、样本 <15 篇标注「方向性信号」。输出 Do More / Do Less / 下一组实验 / Stop
Doing + 唯一优先级；结论写入台账发布记录「复盘」列。

## 迁移与复现

整套系统（skill + 规范 + 迁移脚本）可打包迁往新机器：

- **打包**：`python .agents/skills/lunjian/scripts/export_bundle.py` → `migration/lunjian-bundle-<日期>/`（skill + humanize-writing + 工作区种子 + 数据存档 + README）及同名 zip；`--no-data` 可只打系统不打数据
- **恢复**：解压后依次运行 `python skill/scripts/setup_env.py --fix`（环境自检/装依赖）和 `python skill/scripts/bootstrap_workspace.py <新工作区路径>`（初始化工作区并安装两个 skill）
- **数据迁移**：旧机 `weekly/`、`posts/`、`topics.xlsx` 拷到新工作区同名位置即可
- 迁移后在新工作区照常使用本 skill；工作区种子里的 sources.md 是打包时点的版本，可继续维护
