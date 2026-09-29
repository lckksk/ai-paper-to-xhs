# 信息源清单

> 用途：每周自动采集的信息源与规则手册。定时任务（每周六 10:00）读本文件执行采集与选题。
> 维护约定：新增源写进来时注明抓取方式；发现失效打上 ⚠️ 并写日期。

## 一、论文聚合（社区论文主入口）

| 来源 | 地址 | 更新频率 | 抓取方式 | 说明 |
|---|---|---|---|---|
| Hugging Face Daily Papers | https://huggingface.co/papers | 每日 | web_reader | **采集主入口**；周视图 `https://huggingface.co/papers/week/<年份>-Wxx` |
| arXiv cs.CL（NLP） | https://arxiv.org/list/cs.CL/recent | 每工作日 | web_reader | 量大，只扫标题，兜底用 |
| arXiv cs.AI / cs.LG | https://arxiv.org/list/cs.AI/recent | 每工作日 | web_reader | 同上 |
| alphaXiv | https://www.alphaxiv.org/ | 实时 | web_reader | 讨论热度交叉验证，防赞数虚高 |
| Papers with Code | — | — | — | 已于 2025 年关停，勿再依赖 |

## 二、厂商官方博客（质量保障，全量采集）

| 来源 | 地址 | 抓取方式 | 说明 |
|---|---|---|---|
| OpenAI | https://openai.com/news/ | web_reader，渲染异常时 browser-use | |
| Anthropic | https://www.anthropic.com/news | web_reader | |
| Google DeepMind | https://deepmind.google/discover/blog/ | web_reader | |
| Meta AI | https://ai.meta.com/blog/ | web_reader | |
| Microsoft Research | https://www.microsoft.com/en-us/research/blog/ | web_reader | |
| NVIDIA | https://blogs.nvidia.com/ | web_reader | |
| DeepSeek | GitHub: https://github.com/deepseek-ai/releases | web_reader | ⚠️ /news/ 已失效（2026-09-26 重定向到文档首页），改抓 GitHub releases |
| 通义千问 Qwen | https://qwen.ai/blog | web_reader | ⚠️ /blogs 返回产品页（2026-09-26），改单数路径，失败则用 HF org 页 |
| 智谱 AI | https://www.zhipuai.cn/news | web_reader / browser-use | |
| Moonshot / Kimi | https://www.kimi.com/en/blog | web_reader | ⚠️ moonshotai.github.io 已重定向（2026-09-26） |
| MiniMax | 官网公告页（路径待定） | browser-use | ⚠️ /news 无新闻列表（2026-09-26），临时改公众号/GitHub |
| 字节 Seed | https://seed.bytedance.com/ | WebFetch/browser-use | |
| 阶跃星辰 | https://www.stepfun.com/#news | browser-use | ⚠️ 纯 JS 渲染，web_reader/WebFetch 均无效（2026-09-26） |

## 三、按需采集流程（用户触发，支持每天一更）

> 定时任务已于 2026-09-26 取消，改为用户在对话中启动（如「跑今天」「跑最近一周」）。

1. **确定采集窗口**：从上次采集的次日开始，到今天为止（回看最近的采集日志与台账日期）；默认回溯不超过 7 天
2. **采集**：
   - 窗口为单日：用 HF **每日榜** `https://huggingface.co/papers?date=<日期>` 取当日 Top 3-5
   - 窗口跨多日/整周：用 HF 周榜按赞数取 Top 5
   - 厂商新闻页全量快照（厂商条目不设上限），存 `weekly/<年份>-Wxx/原材料/`
3. **文件命名带日期后缀**（同周多次运行不互相覆盖）：`<厂商名>-<MMDD>.md`、`hf-papers-<MMDD>.md`
4. **候选**：全部入 `topics.xlsx` 候选清单（含周次、初评）；单源失败记入采集日志不阻塞
5. **自动选题**：按 §四 规则排序，**每次运行成稿 2~3 篇**（供用户挑选发布）；用户点名选题不受此限
6. **成稿**：对选中项执行 `.agents/skills/jiedu-lunwen/SKILL.md` 全流程
7. **交付**：产出停在「已成稿/待终审」；发布永远由用户人工完成

## 四、热度评判标准（自动选题的排序依据）

### 硬指标（程序直接算）
| 指标 | 用法 |
|---|---|
| HF 社区赞数 | 社区论文主排序键，周榜自带数字 |
| 发布时间 | 只收本周新发布，旧论文蹭榜淘汰 |
| 机构知名度 | 知名实验室/大厂名单匹配加分 |
| 开源配套 | 有活跃 GitHub 仓库 → 加分 |

### 软指标（AI 在流水线里评）
| 指标 | 用法 |
|---|---|
| 讨论热度 | HF 评论数、alphaXiv/X 讨论交叉验证，防虚高 |
| 题材适配度 | 模型发布 / 实用技巧 / 反常识 > 纯理论 / 增量刷点 |
| 厂商背书 | 厂商官方发布 = 质量保障，全量采集、成稿优先级最高 |

### 自动选题规则（权重可调，改动直接编辑本节）
- 候选池 = 厂商全量条目 + HF 当日/当周 Top N（去重：同一工作双源出现算一条，标注双源）
- 成稿排序 = 厂商背书（最高权重）× HF 赞数 × 题材适配度
- 产能闸门：**每次运行成稿 2~3 篇**（按排序取前 2~3 名，供用户挑选发布；候选不足则有多少写多少）；用户点名选题不受此限
- 无合规候选时宁缺毋滥，当天可空过

## 五、采集产出规范

### 目录与命名
```
weekly/<年份>-Wxx/           # ISO 周号，与 HF 周榜 URL 对齐
├── 原材料/
│   ├── hf-papers-<MMDD>.md          # HF 快照（每日榜或周榜，按窗口）
│   ├── 厂商/<厂商名>-<MMDD>.md       # 每源一个快照，带日期后缀防覆盖
│   └── 论文全文/<短名>-arxiv<id>.md  # 仅选中的论文转存全文
└── 采集日志.md                       # 每次运行追加一节：窗口/抓了什么/选题理由
```
同一周内多次运行（每天一更）：快照文件按日期后缀并存，采集日志按日期分节追加。

### 元数据头（每个原材料文件开头必带）
```
---
来源: <信息源名>
URL: <原始链接>
抓取时间: YYYY-MM-DD HH:MM
工具: web_reader | browser-use | WebSearch
周次: <年份>-Wxx
---
```

### 保留策略
原材料与成品全部永久保留（纯文本，体积可忽略）；复盘时按周次回溯。

## 六、不写什么（负面清单）

- ❌ 无原文可核实的二手消息、纯传闻
- ❌ 只有圈内人关心的 benchmark 微调
- ⚠️ 纯理论（需极强的讲人话能力才适配小红书，默认不选）
- ➕ 新增选题类型（对标学习 2026-09-26）：**自制评测实验**——自己给模型出题产出一手结论（赛博禅心式），个人号对抗纯搬运的核心武器

## 七、对标选题雷达（2026-09-26 四博主深度分析的落地）

| 博主 | 定位 | 渠道与抓取 | 频率 |
|---|---|---|---|
| 新智元 | 机构媒体，时效+广度 | 公众号；镜像 36氪/搜狐/IT之家，WebSearch/WebFetch | 每周采集时顺带 |
| 赛博禅心 | 个人科普+评测 | 公众号；转载站 woshipm / 火山引擎 / 优设，WebSearch | 每周 |
| 橘鸦 | 「AI 早报」日更 | 知乎 zhuanlan.zhihu.com + B站「橘鸦 Juya」，WebSearch | 每周 |
| 井底之硅 | 深度长文 | 公众号；转载 smzdm / 享健丽，WebSearch | 每周 |

用法：每次采集顺带扫他们的近作——**他们的爆款选题 = 经过市场验证的候选**，转录进 topics.xlsx 时来源标「对标」，排序规则同 §四。写作打法浓缩卡见 skill 的 `references/对标打法.md`，完整分析见 `research/对标博主分析/`。
