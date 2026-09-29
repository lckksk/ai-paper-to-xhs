---
来源: Hugging Face Daily Papers 周榜
URL: https://huggingface.co/papers/week/2026-W39
抓取时间: 2026-09-26（补归档）
工具: web_reader
周次: 2026-W39
说明: 本文件为系统建立前的事后归档；正式自动采集自 2026-W40 起由每周六 10:00 定时任务生成
---

# HF Daily Papers 周榜 2026-W39 快照（Sep 20-26）

采集规则：社区论文按赞数取 Top 5 进候选池；厂商条目另行全量采集（见 厂商/ 目录，自 W40 起）。

| # | 赞 | 论文 | 机构 | 链接 |
|---|---|---|---|---|
| 1 | 96 | CodeMidas: Scaling Agentic Coding RL Environments from Code Itself | Xiaomi MiMo | https://huggingface.co/papers/2609.22068 |
| 2 | 95 | EvoOntology: A Self-Evolving Ontology Layer for Data Agents | RUC-DataLab | https://huggingface.co/papers/2609.15779 |
| 3 | 88 | Grounded Skill Synthesis from Code at Scale for Agentic Intelligence | ant-international | https://huggingface.co/papers/2609.05571 |
| 4 | 61 | RecreationWorld: Scalable and Verifiable Environments for Hybrid Computer-Use Agents | Qwen | https://huggingface.co/papers/2609.22000 |
| 5 | 35 | IntBMoE: Integrating Block-Level Conditioning into Expert Composition for Full-Participation Mixture-of-Experts | — | https://huggingface.co/papers/2609.21346 |

## 摘要（选中解读的论文才抓取全文，此处存选题时可见的摘要）

### 1. CodeMidas（96 赞，Xiaomi MiMo）

Training capable coding agents via reinforcement learning (RL) requires diverse tasks with reliable verifiers. Open-source codebases are a promising, permissively licensed source of such tasks, yet existing pipelines typically depend on issue or commit metadata, constraining scale. We introduce CodeMidas, an agentic pipeline that uses source code as its only task-specific input to convert implemented functionality in existing codebases into executable RL environments. Our agentic pipeline studies each codebase, writes behavioral specifications for identified functionality, and constructs tests grounded in the original code's execution. A validation pipeline combining consistency checks, repeated solution rollouts, and targeted filtering ensures that only high-quality tasks are retained. Using this approach, we generate 5,545 high-quality agentic coding tasks from 3,185 open-source repositories, spanning 23 languages and 15 domains. Training MiMo-V2.5 on these tasks with GRPO improves performance on all five external benchmarks: DeepSWE (issue repair) +11.7%, ProgramBench (whole-program construction) +17%, and Terminal-Bench v2.1 (terminal work) +8.5%. Ablation studies confirm that more high-quality tasks yield better performance. Behavior analysis reveals that training leads to more thorough codebase exploration and more diverse self-verification.

### 2-5. EvoOntology / Grounded Skill Synthesis / RecreationWorld / IntBMoE

补归档时未选中解读，摘要未抓取（正式流程中候选池摘要随快照一起抓取）。按赞数与机构判断：#2 自进化本体层（数据Agent）、#3 从代码合成可验证Agent技能（蚂蚁国际）、#4 computer-use 可验证环境（Qwen）、#5 MoE 专家组合。
