---
来源: arXiv HTML 全文
URL: https://arxiv.org/html/2609.22068v1
抓取时间: 2026-09-26（补归档）
工具: web_reader
周次: 2026-W39
说明: CodeMidas 论文全文结构化转写（HTML 转 Markdown，表格转为文字；参考文献列表未转存，见原文）。事实核对清单见 posts/2026-09-26-CodeMidas/事实核对.md
---

# CodeMidas: Scaling Agentic Coding RL Environments from Code Itself

**作者**：Bowen Ye, Lei Li, Shihao Zou, Xi Xia, Zongyan Liu, Junying Chen, Jianfeng Liu, Wei Chu, Yuan Hu
**机构**：Xiaomi LLM Core（一作小米实习）× 北京大学 × 香港大学 × 中国人民大学
**arXiv**：2609.22068

## Abstract

Training capable coding agents via reinforcement learning (RL) requires diverse tasks with reliable verifiers. Open-source codebases are a promising, permissively licensed source of such tasks, yet existing pipelines typically depend on issue or commit metadata, constraining scale. We introduce CodeMidas, an agentic pipeline that uses source code as its only task-specific input to convert implemented functionality in existing codebases into executable RL environments. Our agentic pipeline studies each codebase, writes behavioral specifications for identified functionality, and constructs tests grounded in the original code's execution. A validation pipeline combining consistency checks, repeated solution rollouts, and targeted filtering ensures that only high-quality tasks are retained. Using this approach, we generate 5,545 high-quality agentic coding tasks from 3,185 open-source repositories, spanning 23 languages and 15 domains. Training MiMo-V2.5 on these tasks with GRPO improves performance on all five external benchmarks: DeepSWE (issue repair) +11.7%, ProgramBench (whole-program construction) +17%, and Terminal-Bench v2.1 (terminal work) +8.5%. Ablation studies confirm that more high-quality tasks yield better performance. Behavior analysis reveals that training leads to more thorough codebase exploration and more diverse self-verification.

## 1 Introduction

- 用 RL 训练编程 Agent 需要：多样任务 + 可靠判分器（verifier）。
- 现有管线从 issue / PR / commit message / 现成测试 / 文档等"开发痕迹"提取任务（Table 1 对比），但带完整 artifacts 的开源仓库占比小，任务来源受限、规模上不去。
- 本文主张：**源代码本身就是可规模化扩展的任务基础**（source code as its only task-specific input）。

## 2 Related Work

对比了依赖开发痕迹的任务生成管线与本文"仅用源代码"的定位（详见原文 Table 1）。

## 3 Methodology（四阶段全自动流水线）

### 3.1 Task Design（任务设计）
- Agent 通读代码库，识别有公开入口、结果可观察的功能。
- 移除所选核心实现，调整剩余代码形成连贯的"开发起点"（即题目环境）；原实现单独保留作参考解（reference solution）。
- 写行为规格说明（behavioral statement）：定义输入/输出/接口约束，不规定内部实现。

### 3.2 Test Construction（测试构建）
- Agent 依据规格写测试；测试期望值来自**运行原版代码**的执行记录（execution-grounded），不是模型拍脑袋。
- 逐条审查断言（assertion），删除规格未要求的过度限制。例：要求异常类型匹配、但不限定报错文案的具体措辞——避免误杀正确解法。

### 3.3 Environment Preparation + Execution Consistency Check（环境准备与一致性检查）
- 6 个全新容器：2 个起点代码容器（必须全部测试失败）+ 4 个参考解容器（必须全部测试通过），不过关即废。

### 3.4 Post-hoc Filtering（赛后过滤，三道）
1. **对抗性 rollout 找泄漏**：派 Agent 试图利用环境残留（residual leakage）绕过正常实现，审查确认能走后门的任务作废。
2. **解法审查**：Agent 以人工审查方式核对解法与判分结果是否一致，防止误判。
3. **Rollout 结果过滤**：所有 rollout 全对或全错的任务都扔掉——太简单/太难/有缺陷的任务没有学习信号。

### 3.5 Dataset Overview（数据集概况）
- **5,545 个任务**，来自 **3,185 个开源仓库**，**23 种语言**（Python 21.4%、TypeScript 18.3%、Go 16.2% 等）、**15 个领域**。
- 参考解中位数 142 行。

## 4 Experiments

### 4.1 Setup
- 基座：MiMo-V2.5；训练算法 GRPO。

### 4.2 Main Results（五个外部基准全部提升）
| 基准 | 能力 | 前 → 后 |
|---|---|---|
| SWE-bench Pro | issue 修复 | 提升（详见原文） |
| DeepSWE | issue 修复 | 10.0% → 21.7%（+11.7pp） |
| ProgramBench（Almost Solved） | 从零写整个程序 | 4.5 → 21.5（+17） |
| RepoZero C2Rust | 代码翻译 | 提升（详见原文） |
| Terminal-Bench v2.1 | 终端操作 | 63.7% → 72.2%（+8.5pp） |

## 5 Analysis

### 5.1 Data Quality Ablation
- 1k → 3k → 5.5k 高质量任务，性能逐步提升。
- **精筛 3k 子集在全部三个评测（SWE-bench Pro、DeepSWE、CodeMidas Val）上打赢未清洗的 8k 基线**：质量 > 数量。

### 5.2 Behavioral Analysis
- 首次改代码前的读代码/搜索调用：27.2 → 40.1 次。
- 写代码前先在推理里打草稿的比例：0.36 → 0.63。
- 自我验证命令种类：2.03 → 2.53。
- **Agent 自己写检查命令（checks）并执行的 rollout，平均通过率高 4.2 个百分点**（95% CI 1.8–6.6；同任务同 checkpoint 对比）。
- 上述行为变化同样出现在外部基准上（泛化证据）。

## 6 Conclusion + Limitations

- 结论：源代码本身足以作为规模化 agentic coding RL 环境的基础；任务质量与数量都重要，质量优先。
- Limitations：任务为单点功能挖空式改造，与真实工程的全局复杂性有差距；判分依赖测试通过，测试质量决定环境质量（详见原文）。

## 命名

Midas touch（点石成金）：把现有代码"点成" RL 训练环境。
