---
来源: arXiv 摘要页
URL: https://arxiv.org/abs/2609.05571
抓取时间: 2026-09-27（候选池深读）
工具: WebFetch
周次: 2026-W39/W40
说明: Code2Skill（Grounded Skill Synthesis from Code at Scale for Agentic Intelligence）摘要转存；HTML 全文未抓取
---

# Grounded Skill Synthesis from Code at Scale for Agentic Intelligence（Code2Skill）

**作者**：Yongqi Tong, Pan Wang, Hang Wang, Jianshe Li, Xin Zhang, Jiang-Ming Yang, Wei Wu
**机构**：蚂蚁国际（HF 提交方 ant-intl；arXiv 页未列机构，⚠️ 推断）
**arXiv**：2609.05571（v1 2026-09-04，cs.SE / cs.CL）｜ HF 赞 88（W39 第 3）

## 摘要要点（已验证）

- 问题：可复用技能为 Agent 提供可迁移的程序性知识，但规模化获取难。两条老路：
  ① 轨迹合成——需要与特定环境交互
  ② 文档提取——缺可执行证据与验证
- 洞察：**源代码**是互补路径——无需先验 Agent 经验，自带可执行证据
- 方案：**Code2Skill** 全自动流水线——把选定的代码单元转成「以实现为锚点」的原子操作、复合工作流、重复模式三类记录；用**盲源重构 + 源码对比**验证每条记录
- 规模：应用于 **19,769 个流行且活跃维护的 GitHub 仓库** → 产出 **CodeSkillBank：1,006,822 条已接受记录**（含工作流、边界、来源、源码证据元数据）
- 效果：
  - **72 项协议匹配评估**（9 个模型设置 × 8 个基准）：使用检索技能的模型平均提升 **11.7%**，**57 例**超过基线
  - 统一下游接口下，**全部 7 个共享基准**优于轨迹衍生的技能库
  - 从经过测试的 AI 生成代码合成的技能通过率 **93.50%**，人类代码 **93.00%**

## 未获取（如需引用需补抓全文）

- 各基准的具体提升数字、Code2Skill 各阶段 ablation、CodeSkillBank 检索机制细节
