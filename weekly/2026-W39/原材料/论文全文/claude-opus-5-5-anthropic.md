---
来源: Anthropic Newsroom（发布全文）
URL: https://www.anthropic.com/news/claude-opus-5-5
抓取时间: 2026-09-26
工具: web_reader
周次: 2026-W39
说明: Claude Opus 5.5 发布公告结构化转存
---

# Introducing Claude Opus 5.5（2026-09-22）

## 核心口径

- Claude 5.5 家族第一个模型；多数工作上达到 Claude Fable 5.1 水平，典型负载运行成本比 Opus 5 低 40%
- 是 Anthropic 呼吁「pace the frontier」后的第一个发布；发布前经 Frontier Design、METR 等外部评测

## 定价（每百万 token，vs Opus 5）

| 项目 | Opus 5.5 | Opus 5 | 降幅 |
|---|---|---|---|
| 缓存读取 | $0.20 | $0.50 | **-60%** |
| 输入 | $4 | $5 | -20% |
| 输出 | $20 | $25 | -20% |
| 缓存写入 | $5 | $6.25 | -20% |

- 40% 的构成：token 单价更便宜 × 每任务 token 用量更少，净省 40%（官方："Where Opus 5.5's advantage is very clear is efficiency"）
- 缓存读取构成 agentic/编程工作的成本大头（官方原话：cache reads make up the majority of agentic and coding work costs）
- 输出生成比 Opus 5 快 30%+；fast mode 最高 2.5 倍速（$8/$40）
- 订阅：Pro/Max/Team/Enterprise 五小时限额上调；提供可保存的限流重置

## 基准（Opus 5.5 / Fable 5.1 / Opus 5 / GPT-6 Astra / GPT-5.6 Sol）

| 基准 | 5.5 | Fable 5.1 | Opus 5 | Astra | 5.6 Sol |
|---|---|---|---|---|---|
| Terminal-Bench 4.0（agentic coding） | **66.4%** | 55.8% | 52.3% | 57.9% | 37.3% |
| FrontierCode v1.1 | **54.4%** | 50.3% | 48.0% | 53.3% | 47.5% |
| CursorBench 4.0 | **57.8%** | 51.8% | 46.6% | — | 41.7% |
| GDPval-AA v2.1（Elo，44 职业） | **1846** | 1735 | 1708 | 1542 | 1588 |
| AutomationBench（Zapier） | 40.0% | 31.4% | 26.9% | **41.4%** | 28.8% |
| Humanity's Last Exam（带工具） | **67.7%** | 65.6% | 63.6% | 57.2% | — |
| Terminal-Bench-Science | 58.7% | 52.6% | 29.0% | **64.6%** | 22.4% |
| OSWorld 2.0（computer use, partial） | **81.8%** | 80.7% | 74.0% | — | — |
| Chartography（带工具） | **89.0%** | 88.4% | 83.4% | — | — |

**官方自曝**：这个量级下跑分差距已不太可靠，"In our own use, the gap between Opus 5.5 and Claude Fable 5.1 is narrower than these scores suggest."
**评测注意**：Opus 5.5 带生产防护评测；防护介入时网络安全任务由 Opus 4.8 完成、生物与前沿 LLM 开发任务由 Opus 5 完成——可能低估其分数。
AutomationBench 与 Terminal-Bench-Science 上 GPT-6 Astra 更高。

## 编程实测

- 早期测试者：68 万行代码迁移，不到一天完成（工程团队需数周）
- 20 万行代码库审计+修复：不到 3 小时（Opus 5：20+ 小时、2.5 倍 token）
- HAProxy C→Rust：通过几乎全部 HAProxy 自带回归测试；5.5 用 9.5h vs Fable 5.1 12h，成本低 51%
- FrontierCode 默认档：以约 1/5 每任务成本打败 GPT-6 Astra；Terminal-Bench 4.0 以约 40% 成本打平 Astra
- GitHub（Mario Rodriguez, CPO）：Copilot CLI 与 VS Code 测试中 token 与步数最少；VS Code 中以不到一半步数解决更多终端任务
- 网页加载优化：40 次成功 39 次（Opus 5 改进更小且改变应用行为）

## 知识工作

- 季度报告测试（自动评分器核对每个数字与引文）：5.5 在不同 effort 下 16/18 过质量线；**Fable 5.1 与 Opus 5 均为 0**
- Deloitte：低 effort 查出 72% 已知 bug（Opus 5 高 effort 56%），误报更少
- Walleye Capital：最低档基本解决其评测集，并发现评测说明中的一个错误（此前无模型发现）
- 并购分析：63 分钟 vs Opus 5 93 分钟，成本低 50%

## 沟通改进

- 重点前置、少行话、遵守给定写作规则；账单 bug 示例：5.5 首句直接给出结论（"$9.92 来自统计 bug，$1.50 才是免费额度变化"）
- Ramp 工程师："it writes the way I do" / "writes like a good colleague"

## 安全

- 行为审计（约 2000 场景）：对齐指标好于近期所有 Claude；绕过围栏的尝试比 Opus 5 / Mythos 5.1 少约 85%，且全部低烈度并自我报告
- 提示注入：Gray Swan 基准上与 Fable 5.1 并列最低成功率
- 第一个带 Fable 5.1 同级防护的 Opus：网络安全任务多数转 Opus 4.8；生物研究需 Life Sciences Verification Program
- preserved thinking 防蒸馏（2026-08-31 后开的 API 账号）；零数据保留；EU AI Act 水印

## 可用性

全平台（AWS / Google Cloud / Azure）；Claude Platform 模型名 `claude-opus-5-5`。Sonnet 5.5 / Haiku 5.5 未来几周跟进。
