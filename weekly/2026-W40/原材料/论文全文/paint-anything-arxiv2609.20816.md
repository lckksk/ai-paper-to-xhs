---
来源: arXiv 摘要页
URL: https://arxiv.org/abs/2609.20816
抓取时间: 2026-09-27（候选池深读；此前台账链接误挂 2609.22816，已修正）
工具: WebFetch
周次: 2026-W39/W40
说明: Paint-Anything 摘要转存；HTML 全文未抓取
---

# Paint-Anything: Unified Any-Color Control for Image Generation and Editing

**作者**：Ji Xie, Dewei Zhou, Xinyu Huang, Zhennan Chen, Xun Wang
**机构**：Seed Technical Report（字节 Seed；arXiv 页未列机构名，⚠️）
**arXiv**：2609.20816（v1 2026-09-17，v2 09-20 仅 HTML 修复；cs.CV 主，29 页）｜ HF 赞 29

## 摘要要点（已验证）

- 问题：专业设计需要 **any-color control**——用**任意 24 位十六进制值**指定物体目标颜色，用于图像生成与编辑
- 老路缺陷：先前色彩生成/编辑/上色研究常依赖**专用颜色表示或特殊推理流程**
- 洞察：LLM 的进展让更简单的起点成为可能——**即使是紧凑模型也能将十六进制值与颜色语义关联**
- 方案：通过**物体级颜色监督**，学习一个共享的 **hex-prompt 接口**，统一服务生成与编辑两个任务
- 数据：**Paint-500K** 数据集——真实图像经物体定位、感知颜色标注、编辑对合成；因阴影使真实图像的颜色标注只是近似，补充**纯色锚点**（像素与配对 hex 值完全匹配），**仅在高噪声时间步使用**，低噪声阶段仍用自然图像
- 评测：自建 **Any Color Benchmark（ACBench）**：ACBench-T2I 与 ACBench-Edit，衡量物体级 hex 颜色保真度
- 结果：FLUX.2-4B 上，ACBench-T2I 与 ACBench-Edit 相对基础模型分别提升 **85.3%** 与 **28.3%**；消融支持该训练方案；对比方法中平均 **CompColor** 分数最高

## 未获取（如需引用需补抓全文）

- hex-prompt 接口的具体形式、ACBench 各项分数、与 LoRA/ControlNet 类方法的对比细节
