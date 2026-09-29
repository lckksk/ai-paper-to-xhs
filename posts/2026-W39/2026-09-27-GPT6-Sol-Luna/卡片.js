// 小红书 3:4 卡片：GPT-6 Sol/Luna 价格战（封面卡 + 价格实绩卡 + 诚实边界卡）
// 主题：OpenAI 绿（accent 跟随选题方品牌色，见 references/卡片规范.md）
const pptxgen = require("pptxgenjs");

const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "10A37F", ACCENT_DEEP = "0B7A5F";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "E8F5F0", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";

const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS";
pres.author = "Z.ai";
pres.title = "GPT-6 Sol Luna 小红书卡片";

const T = (text, opt) => ({ text, options: opt });

// ---------- 卡片 1：封面（深色） ----------
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });

s1.addText("API定价", { x: M, y: 2.0, w: 6.5, h: 1.55, fontSize: 88, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("直接腰斩", { x: M, y: 3.55, w: 6.5, h: 1.55, fontSize: 88, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });

s1.addText([
  T("GPT-6 Sol 与 Luna 发布：", { breakLine: true }),
  T("定价 -50%，缓存读取 1 折", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });

const chips = [
  { num: "-50%", label: "API 定价" },
  { num: "-90%", label: "缓存读取" },
  { num: "1/11", label: "对手每任务成本" },
];
chips.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});

s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("OpenAI Newsroom · 09-22 · ChatGPT Work 与 Codex 可用", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

// ---------- 卡片 2：价格与实绩（浅色） ----------
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("GPT-6 · 价格与实绩", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("腰斩之后，分数反而更高", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });

const feats = [
  { n: "01", lead: "定价腰斩", desc: "Sol：输入 $4→$2、输出 $20→$10（每百万 token），对比 GPT-5.6 促销价 -50%" },
  { n: "02", lead: "AutomationBench 33.2%", desc: "47 个工具的真实业务流测试；Opus 5 满血档 26.9%，每任务成本是 Sol 的 11 倍" },
  { n: "03", lead: "DeepSWE 68.8%", desc: "距 Fable 5 最高分 1.1pp、成本省 80%；Luna 66.6% ≈ Opus 5，成本只要 7%" },
  { n: "04", lead: "错误率减半", desc: "内部事实性评测：Sol 约为前代一半，接近旗舰 Astra 的可靠性" },
];
feats.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 23, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s2.addText("缓存读取 1 折：Agent 场景的大头开销", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：OpenAI Newsroom（2026-09-22）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

// ---------- 卡片 3：诚实边界（浅色） ----------
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("GPT-6 · 说清楚", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("三点说清楚", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("分数很猛，但这三件事得先讲明白", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });

const rows = [
  { n: "01", lead: "困难场景评测", desc: "分数来自刻意刁难的任务，官方明说：不代表日常使用中的失败率" },
  { n: "02", lead: "兜底成本没算", desc: "与 Fable 5.1 的成本对比未计其 Opus 5 兜底调用——官方注释承认约四成任务触发" },
  { n: "03", lead: "内部口径", desc: "「错误率减半」来自 OpenAI 内部事实性评测，不是公开第三方基准" },
];
rows.forEach((st, i) => {
  const ry = 2.6 + i * 1.62;
  s3.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s3.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 18, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("同一天：Claude 降四成，GPT-6 直接腰斩", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("价格战开打，受益的是所有拿 API 干活的人", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });

s3.addText("来源：OpenAI Newsroom（09-22）· 分数为官方自报口径", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
