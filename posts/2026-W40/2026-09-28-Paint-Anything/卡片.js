// 小红书 3:4 卡片：Paint-Anything（Seed 紫主题）——封面 + 机制 + 成绩与边界
const pptxgen = require("pptxgenjs");
const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "7C3AED", ACCENT_DEEP = "5B21B6";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "F1EAFE", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";
const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS"; pres.author = "Z.ai"; pres.title = "Paint-Anything 小红书卡片";
const T = (t, o) => ({ text: t, options: o });

let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });
s1.addText("给AI画图", { x: M, y: 2.0, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("加个取色器", { x: M, y: 3.5, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
s1.addText([
  T("字节 Seed 新论文 Paint-Anything：", { breakLine: true }),
  T("任意色号，精确控色", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });
const chips1 = [
  { num: "24-bit", label: "任意色号输入" },
  { num: "500K", label: "训练数据集" },
  { num: "+85.3%", label: "颜色保真度提升" },
];
chips1.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});
s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("arXiv 2609.20816 · 字节 Seed 技术报告 · 2026-09-17", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("PAINT-ANYTHING · 机制", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("色号是怎么变成画笔的", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 38, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
const steps = [
  { n: "01", lead: "老路的坑", desc: "精确控色要设计专用颜色表示或特殊推理流程，又重又难维护" },
  { n: "02", lead: "关键洞察", desc: "大模型早已把色号和颜色语义关联起来——连紧凑模型都看得懂 #FF6900 是橙" },
  { n: "03", lead: "hex-prompt 接口", desc: "物体级颜色监督训练出的共享接口，色号直接进提示词，生成与编辑通用" },
  { n: "04", lead: "纯色锚点技巧", desc: "真实照片受光影影响标注只是近似色——掺入像素与色号完全一致的锚点，且只在高噪声阶段用" },
];
steps.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s2.addText("Paint-500K 数据集：定位 + 颜色标注 + 编辑对合成", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：arXiv 2609.20816（2026-09-17）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("PAINT-ANYTHING · 成绩与边界", { x: M, y: 0.6, w: 5.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("色号精确度，涨得很明显", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 38, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("自建 ACBench 测试（物体级 hex 颜色保真度）", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });
const stats = [
  { num: "+85.3%", label: "文生图颜色保真度", range: "基线为 FLUX.2-4B 自身" },
  { num: "+28.3%", label: "图像编辑颜色保真度", range: "ACBench-Edit，相对基础模型" },
  { num: "最高", label: "平均 CompColor 分数", range: "在对比方法中居首" },
];
stats.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.num, { x: M, y: ry, w: 2.9, h: 1.0, fontSize: 46, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
  s3.addText(st.label, { x: 3.55, y: ry + 0.12, w: 3.45, h: 0.45, fontSize: 17, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 3.55, y: ry + 0.6, w: 3.45, h: 0.4, fontSize: 15, fontFace: FONT, color: TXT_GRAY, margin: 0 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.42, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("三点说清楚：自建评测 · 基线是自己 · 生产待验证", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 19, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("对设计师真正重要的是「能不能进生产流程」，这要上手试", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });
s3.addText("来源：arXiv 2609.20816（字节 Seed）· 对比方法范围见原文", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
