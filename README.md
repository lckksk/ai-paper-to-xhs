# ai-paper-to-xhs

一套跑在 [WorkBuddy](https://www.workbuddy.cn)（原 ZCode 版，已迁移适配）里的内容生产流水线：**把 AI 论文和厂商博客，变成可发布的小红书笔记**。

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

依赖：Python ≥3.9（openpyxl / PyMuPDF / python-pptx）、Node.js（全局 pptxgenjs）、LibreOffice（渲染 PNG 用）、WorkBuddy 内置工具（WebFetch / WebSearch / 后台任务）。做知识短片另需 FFmpeg、Playwright（Chromium）与 skill [vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film)。详见 `skill/scripts/setup_env.py` 的输出。

## 成品展示

最新一次运行的完整产出——正文、事实核对清单、全套卡片，可直接对照流水线各环节的产物形态：

| 你让AI别想，它还在偷偷想（深度版 6 卡） | 机器人学会用眼睛接箱子（标准版 3 卡） |
|:---:|:---:|
| [![ThinkingInertia 封面卡](examples/2026-W42/2026-10-14-ThinkingInertia-深度版/封面卡.png)](examples/2026-W42/2026-10-14-ThinkingInertia-深度版/正文.md) | [![Reflex 封面卡](examples/2026-W42/2026-10-14-Reflex-G1接箱子/封面卡.png)](examples/2026-W42/2026-10-14-Reflex-G1接箱子/正文.md) |
| 清华×牛津×斯坦福实测：关掉思考开关，开放题 99.9% 照样偷想，强行只答准确率掉 15pp | 宇树 G1 纯视觉反应接住人扔的箱子：真机 2.5 米成功率 65%，为人类水平的 76% |
| [完整笔记](examples/2026-W42/2026-10-14-ThinkingInertia-深度版/正文.md) · [事实核对](examples/2026-W42/2026-10-14-ThinkingInertia-深度版/事实核对.md) | [完整笔记](examples/2026-W42/2026-10-14-Reflex-G1接箱子/正文.md) · [事实核对](examples/2026-W42/2026-10-14-Reflex-G1接箱子/事实核对.md) |

每个示例目录含：`正文.md`（成稿）、`事实核对.md`（逐条溯源清单）、`封面卡/内容卡*.png`（1242×1656，深度版 6 张 / 标准版 3 张）。

### 知识短片（无旁白视频）

| 封面 | 说明 |
|:---:|---|
| [![许愿式编程 封面](examples/2026-W43/2026-10-19-许愿式编程背后的RL/cover.png)](examples/2026-W43/2026-10-19-许愿式编程背后的RL/正文.md) | **一句话，一整个项目**：84 秒 1080×1440 竖屏，6 镜全动效，讲清强化学习的奖励尺子如何从「下一个词准不准」换成「整个项目跑不跑得起来」。无旁白，纯字幕 + 代码合成配乐（Canvas 逐帧 `seek(t)` → Playwright 截图 → FFmpeg）。<br>[笔记](examples/2026-W43/2026-10-19-许愿式编程背后的RL/正文.md) · [抖音文案](examples/2026-W43/2026-10-19-许愿式编程背后的RL/发布文案-抖音.md) · [事实核对](examples/2026-W43/2026-10-19-许愿式编程背后的RL/事实核对.md) · [分镜表](examples/2026-W43/2026-10-19-许愿式编程背后的RL/film/storyboard.md) · [源码 film.js](examples/2026-W43/2026-10-19-许愿式编程背后的RL/film/film.js) |

视频示例只保留「可重渲的源」（film.js + 分镜表 + 文案 + 封面），mp4 与逐帧图不入库——按 `references/视频成稿规范-vibe知识短片.md` 的命令四分钟可重新出片。

## 目录结构

```
skill/                    jiedu-lunwen 主 skill
├── SKILL.md              全流程编排（ZCode 原版）
├── SKILL.workbuddy.md    WorkBuddy 适配版（当前生产在用）
├── references/卡片规范.md  卡片设计系统（版式骨架、调色板、渲染链）
├── references/中文AI味清单.md  中文去 AI 味词表
├── references/发布前检查清单.md  平台硬限 / 敏感词 / 关键词布局 / 收藏价值
├── references/复盘框架.md  互动率口径 / 五维归因 / Do More-Do Less-实验
├── references/对标打法.md  对标博主技法卡（成稿自查用）
├── references/热点帖与合集帖成稿规范.md  双轨内容策略：每日热点帖 + 周日深读合集帖
├── references/视频成稿规范-vibe知识短片.md  无旁白知识短片：方法论（先找形象）、竖屏改造、踩坑清单、双平台发布
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
5. **形态由内容决定**：一条新闻做卡片，一个机制做短片——能"演"出来的才做视频，只有形容词的一律图文
6. **短片不配音**：无旁白、纯字幕 + 合成配乐（AI 配音听感不过关，2026-10-19 实测否决）；配乐由代码生成，不依赖版权素材

## 致谢

- [humanize-writing](https://github.com/jpeggdev/humanize-writing)（MIT）——8 遍去 AI 味编辑工序，整合自 [blader/humanizer](https://github.com/blader/humanizer) 与 [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
- [vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film)——无旁白知识短片的方法论与渲染引擎（本仓库的竖屏改造与踩坑清单在其之上）
- 发布前检查清单与复盘框架参考了社区方法（xiaohongshu-doctor、blacktwist social-media-skills 等）的公开方法论

## License

[MIT](LICENSE) © 2026 lckksk
