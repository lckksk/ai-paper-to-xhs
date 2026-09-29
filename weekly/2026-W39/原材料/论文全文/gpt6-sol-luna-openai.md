---
来源: OpenAI Newsroom（发布全文，browser-use 渲染抓取）
URL: https://openai.com/index/introducing-gpt-6-sol-and-luna/
抓取时间: 2026-09-27
工具: browser-use（web_reader/WebFetch 被反爬拦截）
周次: 2026-W39
说明: GPT-6 Sol and Luna 发布公告结构化转存（抓取时文末 availability 段有截断，已标注）
---

# Introducing GPT-6 Sol and Luna（2026-09-22）

## 核心口径

- 与 GPT-6 Astra 同源训练方法；Astra 是最强旗舰，Sol/Luna 把这套能力带到更低成本档
- API 定价对比 GPT-5.6 促销价（promotional pricing）**降 50%**
- 发布于 2026-09-22，与 Anthropic Claude Opus 5.5 同日（Opus 先发约 2 小时）

## 定价（每百万 token）

| 模型 | 输入 | 输出 | 降幅 |
|---|---|---|---|
| GPT-5.6 Sol → GPT-6 Sol | $4 → $2 | $20 → $10 | -50% |
| GPT-5.6 Luna → GPT-6 Luna | $0.20 → $0.10 | $1.20 → $0.50 | -50% |

## 基准与数字（官方口径）

### AutomationBench 1.0.6（跨销售/营销/运营/客服/财务/HR 共 47 个工具的业务流测试）

| 模型（档位） | 得分 | 每任务成本 |
|---|---|---|
| GPT-6 Sol (xhigh) | **33.2%** | $0.27 |
| GPT-6 Astra (low) | 30.3% | 3.9× Sol |
| Claude Opus 5 (max) | 26.9% | **11.1× Sol** |
| Claude Fable 5.1 w/ Opus 5 Fallback (max) | 31.4% | >8.9×（fallback 成本未计） |

- Sol 以约 **9% 的每任务成本**（xhigh）超过 Opus 5（max）
- Luna 高档比前代 +5.4pp、每任务成本 -58%
- **官方注释**：Fable 5.1 的成本被低估——Opus 5 兜底调用出现在约 40% 的任务上但未计入

### 其他基准

- **Agents' Last Exam**（55 子行业长程任务）：Sol max 56.4%，高于 Opus 5 最高分，每任务成本 -60%
- **Factuality**（内部评测：用户标记过错误的真实对话）：Sol 错误率约为前代一半，接近 Astra；Luna 高档 ≈ GPT-5.6 Sol，成本约百分之一
- **FrontierCode 1.1**（可合并性评分）：Sol 大幅超 GPT-5.6 Sol，低成本打平 Fable 5.1 xhigh
- **DeepSWE v1.1**：Sol max 68.8%（Fable 5 最高 69.9%，成本 -80%）；Luna max 66.6% ≈ Opus 5 / Fable 5 medium（成本比 Opus 5 低 93%、比 Fable 5 低 96%）
- **OSWorld 2.0 offline**（computer use）：Sol xhigh 60.5% ≈ Opus 5 medium 60.3%（成本 -80%）；Luna max > GPT-5.6 Sol medium，成本 1/10

### 缓存与生态

- prompt caching 改进：缓存读取**折扣 90%**；新增 Caching Dashboard 与诊断工具；调 effort/开关工具不再破坏缓存；支持显式缓存断点
- GitHub 数据：数十亿请求实测，需新鲜处理的 prompt token 占比下降 50%+
- OpenAI 内部：研究员日均 token 消耗中位 $600，P90 达 $7,000（引自 Research acceleration 博文）

### 协作风格与对齐

- Astra 的沟通风格改进（少行话/少废话/重点前置）带到 Sol/Luna（官方给了 bento 网站改造对比示例）
- 对齐：编码欺骗率低于 GPT-5.6 同档（内部编码欺骗评测；原文声明为刻意困难场景，不代表日常失败率）

## Availability（抓取截断前）

ChatGPT Work 与 Codex 即日起可用（Plus/Pro/Business/Enterprise/Edu）；Free/Go 用户可用 Luna（文末在此次抓取中被截断，细节以原文为准）。
