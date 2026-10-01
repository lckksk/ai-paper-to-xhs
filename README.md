# ai-paper-to-xhs

一套跑在 [ZCode](https://zcode.ai)（或同类 AI 编码助手）里的内容生产流水线：**把 AI 论文和厂商博客，变成可发布的小红书笔记**。

> 设计目标：AI 负责采集、解读、成稿、做图；人负责事实终审与发布。学术内容翻车成本高，终审关卡永远保留。
>
> 本仓库只保留**最新样例与 skill 本体**；运行数据（成稿全档 / 采集原材料 / 数据台账）不随仓库分发。

## 流水线

```
采集(论文/博客) → 候选入台账 → 自动选题 → 深读原文+事实核对清单
→ 按模板成稿 → 去AI味(8遍工序) → 字数与敏感词实测 → 3:4卡片(pptx→PNG)
→ 版式验收 → 台账回填 → 人工终审 → 发布 → 数据复盘
```

## 特性

- **事实核对清单**：正文每条陈述对应原文出处，区分「论文事实 / 解读观点 / 人设表述」，发布前人工过一遍
- **去 AI 味工序**：配合 [humanize-writing](https://github.com/jpeggdev/humanize-writing) 的 8 遍编辑流程 + 中文 AI 味词表，装腔开场/说教金句/段段 emoji 出现即重写
- **发布前检查**：标题 ≤20 字、正文含标签 ≤1000 字实测；极限词/夸大词/引流词三类敏感词扫描，命中逐条判断（原文归因可保留，自评改写）
- **3:4 卡片生成**：pptxgenjs 画卡片 → LibreOffice 转 PDF → PyMuPDF 渲染 1242×1656 PNG；accent 跟随选题方品牌色
- **数据复盘框架**：统一互动率口径（赞+评+藏/浏览）、Top/Bottom 逐篇五维归因、只与自己历史均值比、新帖 72h 防误判

## 快速开始

```bash
# 1) 环境自检（列出缺失依赖与安装命令）
python skill/scripts/setup_env.py --fix

# 2) 初始化工作区（生成 sources.md、templates/、topics.xlsx、weekly/、posts/，并安装 skill）
python skill/scripts/bootstrap_workspace.py <你的工作区路径>

# 3) 安装去 AI 味 skill（用户级，跨项目可用）
#    见 https://github.com/jpeggdev/humanize-writing（bootstrap 缺它时会给出同样提示）

# 4) 在 ZCode 中打开工作区，说「跑今天」「跑最近一周」或「解读这篇 + <链接>」
```

依赖：Python ≥3.9（openpyxl / PyMuPDF / python-pptx）、Node.js（全局 pptxgenjs）、LibreOffice（渲染 PNG 用）、ZCode 内置工具（web_reader / browser-use / WebSearch）。详见 `skill/scripts/setup_env.py` 的输出。

## 成品展示

最新两次运行的完整产出——正文、事实核对清单、三张卡片，可直接对照流水线各环节的产物形态：

| GPT-6 上岗机器人 | AI 给 AI 搭工位 |
|:---:|:---:|
| [![GPT-6 机器人封面卡](examples/2026-W40/2026-10-01-GPT6-Astra-Robot/封面卡.png)](examples/2026-W40/2026-10-01-GPT6-Astra-Robot/正文.md) | [![Meta-Skills 封面卡](examples/2026-W40/2026-10-01-MetaSkill-AI4AI/封面卡.png)](examples/2026-W40/2026-10-01-MetaSkill-AI4AI/正文.md) |
| Galbot 给 GPT-6 安排六门机器人考试：会认路 92%，不会走路 0/5 | UIUC 当日榜首：管家 AI 学搭环境，教原则比给资源多拿 12 分 |
| [完整笔记](examples/2026-W40/2026-10-01-GPT6-Astra-Robot/正文.md) · [事实核对](examples/2026-W40/2026-10-01-GPT6-Astra-Robot/事实核对.md) | [完整笔记](examples/2026-W40/2026-10-01-MetaSkill-AI4AI/正文.md) · [事实核对](examples/2026-W40/2026-10-01-MetaSkill-AI4AI/事实核对.md) |

每个示例目录含：`正文.md`（成稿）、`事实核对.md`（逐条溯源清单）、`封面卡/内容卡1/内容卡2.png`（1242×1656）。

## 目录结构

```
skill/                    jiedu-lunwen 主 skill
├── SKILL.md              全流程编排（按需触发、采集窗口、产能规则、复盘框架）
├── references/卡片规范.md  卡片设计系统（版式骨架、调色板、渲染链）
├── references/中文AI味清单.md  中文去 AI 味词表
├── references/发布前检查清单.md  平台硬限 / 敏感词 / 关键词布局 / 收藏价值
├── references/复盘框架.md  互动率口径 / 五维归因 / Do More-Do Less-实验
├── references/对标打法.md  对标博主技法卡（成稿自查用）
├── assets/卡片模板.js     卡片骨架（改内容不改骨架）
└── scripts/              setup_env / bootstrap_workspace / export_bundle / render_cards / count_body
workspace-template/       新工作区种子（sources.md 信息源与规则手册、小红书笔记模板）
examples/                 最新样例（只保留最近一跑，向前滚动更新）
```

## 设计原则

1. **事实红线**：引号里的数字必须能在原文中指出位置，找不到就不写；候选链接必须来自抓取原文
2. **人机分工**：AI 产出停在「待终审」；终审与发布永远由人完成
3. **旧闻淘汰**：只追窗口内的新发布，官宣超过一周的热点不回头写
4. **文本即状态**：所有流程状态都在 md/xlsx 文件里，换机器、换会话不丢上下文

## 致谢

- [humanize-writing](https://github.com/jpeggdev/humanize-writing)（MIT）——8 遍去 AI 味编辑工序，整合自 [blader/humanizer](https://github.com/blader/humanizer) 与 [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- 发布前检查清单与复盘框架参考了社区方法（xiaohongshu-doctor、blacktwist social-media-skills 等）的公开方法论

## License

[MIT](LICENSE) © 2026 lckksk
