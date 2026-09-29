---
来源: Anthropic 官网（发布全文，WebFetch 提取）
URL: https://www.anthropic.com/claude-sonnet-5-5
抓取时间: 2026-09-29
工具: WebFetch（本次对 Anthropic 域名可用）
周次: 2026-W40
说明: Claude Sonnet 5.5 发布公告结构化转存（发布 2026-09-28）；此前一版含未经验证数字的转写已删除，本版全部数字来自真实抓取
---

# Introducing Claude Sonnet 5.5（2026-09-28）

## 核心口径

- Claude 5.5 家族第二款模型（模型名 claude-sonnet-5-5），All plans 可用
- **比 Sonnet 5 快 30% 以上**（迄今最快 Sonnet）；**多数工作每任务成本最多低 30%**（单价与 Sonnet 5 相同，每任务 token 更少）
- 定位分工：Opus 5.5 面向需要审慎判断的复杂工作；**Sonnet 5.5 最擅长范围明确的日常任务、修 bug、文档/幻灯片/表格**
- 首个**仅凭截图通关 Pokémon Red** 的 Sonnet 模型
- Haiku 5.5 将在「未来几周」加入家族

## 定价（每百万 token）

| 项目 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|
| 输入 | **$2** | $4 |
| 输出 | **$10** | $20 |
| 缓存写入 | $2.50 | $5 |
| 缓存读取 | $0.20 | $0.20 |

- 与 Sonnet 5 同价，但每任务 token 更少 → 每任务成本最多 -30%

## 基准（Sonnet 5.5 / Sonnet 5 / Opus 5.5 / GPT-6 Sol）

| 基准 | 5.5 | Sonnet 5 | Opus 5.5 | GPT-6 Sol |
|---|---|---|---|---|
| Terminal-Bench 4.0（智能体编程） | **70.6%** | 10.3% | 66.4% (xhigh) | 未报告 |
| FrontierCode 1.1 Main | 46.2% (Max)² | 42.4% | 54.4% | 49.3% (xhigh) |
| CursorBench 4.0 | 55.5% | 34.1% | 57.8% | 未报告 |
| GDPval-AA v2.1（Elo） | **1844** | 1449 | 1846 | 1487 |
| AA-Briefcase v1.1 | **1811** | 1359 | 1822 | 1483 |
| Humanity's Last Exam（带工具） | 64.5% | 54.9% | 67.7% | 未报告 |
| OSWorld 2.1（computer use, partial） | 80.1% | 57.0% | 81.8% | 未报告 |
| Chartography（无工具） | **61.6%** | 15.6% | 64.4% | 53.6% |

- 成本效益：多数基准 **Low/Medium 档即超过 Sonnet 5 最佳成绩，成本约其 1/10**（AA-Briefcase 约 1/9）；FrontierCode High 档以约 **1/5 成本**匹敌 GPT-6 Sol 最佳分
- 脚注 2：FrontierCode Max 档得分反而更低——更多触发 code-review 子代理导致超时或越界编辑（官方自披露的波动）
- 图注：GDPval 等对比含 GPT-6 Sol

## 实测（官方引用客户）

- 编程：Epic Games（数万行游戏架构代码、多小时任务）；Base44（118 次真实应用构建，得分平 Opus 5，平均迭代 **3.6 次 vs Opus 5 的 7.7 次**）；CodeRabbit（输出 token 显著减少，解决 Sonnet 5 过度调用网络搜索）；Unity（多步基准完成 90%）
- 知识工作：Balyasny（2,441 项金融任务领先 Sonnet 5，每答案约 **121k vs 497k** token）；Box（准确、快 2.4 倍、总 token -12%）；Lovable（工具调用少 1/3）；Slack（输出 token -14%）；Zendesk（工单快 20%）；Atlassian（Rovo Agents 快 30%）

## 安全与可用性

- 约 1,850 场景自动行为审计：多数指标持平或优于 Sonnet 5；沙盒逃逸尝试接近 Opus 5.5，为所有模型中最少探测容器边界者
- **首个带网络安全防护与回退机制**（高风险任务可见回退到 Sonnet 5）的 Sonnet；Cyber Verification Program 可申请分层访问（Sonnet 5.5 / Opus 5.5 / Claude Mythos）
- **首个带防蒸馏安全分类器**的 Sonnet；扩展 preserved thinking
- 全平台可用（AWS / Google Cloud / Azure / Claude Platform，模型 ID claude-sonnet-5-5）；零数据保留
- 迁移注意：关闭 thinking 需切换到新的 between_tools 设置；Effort 默认（Claude Code 与应用 Medium，Platform High）
