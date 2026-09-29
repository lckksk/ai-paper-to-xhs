---
来源: arXiv HTML 全文
URL: https://arxiv.org/html/2609.15779v1
抓取时间: 2026-09-27
工具: web_reader
周次: 2026-W39
说明: EvoOntology 论文全文结构化转存（HTML 转 Markdown）
---

# EvoOntology: A Self-Evolving Ontology Layer for Data Agents

**作者**：Meiduo Chong, Shaolei Zhang, Ju Fan, Xiaoyong Du（中国人民大学 RUC-DataLab，代码库 github.com/ruc-datalab/EvoOntology）
**arXiv**：2609.15779（v1 2026-09-14，cs.AI / cs.CL / cs.DB）

## Abstract 要点

- 数据 Agent 的目标：对异构数据（表格/文件/数据库）执行自然语言指令
- 核心问题：**agent-data gap**——数据在 Agent 外部，Agent 只能通过通用工具（列名、文件路径）间接访问，缺乏语义理解
- 两条老路都不行：①让 Agent 直接探索原始数据（慢且不可靠）②把手工构建的语义层塞进 prompt（难扩展、难适应不同 Agent 行为）
- 方案：**EvoOntology 自进化本体层**，封装为 MCP 服务器，含三层：schema 层 / content 层 / tool 层
- 构建与进化：builder agent 自动构建本体；自进化循环采用 **attribution-guided typed edits**（归因引导的类型化编辑），仅通过 **backbone-conditional paired evaluation**（骨干条件化成对评估）的修改才被采纳
- 结果：**3 个数据 Agent 基准 × 4 种 LLM 骨干**，持续超越强基线与现有语义层方法

## 正文关键内容

⚠️ 本次 HTML 抓取在正文开头即被截断，以下仅覆盖**摘要可直接验证**的范围；正文细节（三层各自职责、进化循环的具体步骤、各基准具体数字）**未获取**，引用前需重新抓取全文核对。

- 本体封装为 MCP 服务器：支持 MCP 的数据 Agent 可在运行时主动查询本体（摘要：agents can actively query the ontology at runtime）
- 三层结构：schema 层 / content 层 / tool 层（摘要列出的划分，各层具体职责未见正文）
- builder agent 负责构建本体（摘要：introduces a builder agent）
- 自进化循环 = attribution-guided typed edits + backbone-conditional paired evaluation 双机制（摘要原文，具体流程未获取）
- 实验规模：3 个基准 × 4 种 LLM 骨干，"consistently outperforms strong baselines and existing semantic-layer approaches"（摘要原文；具体数字未获取）
