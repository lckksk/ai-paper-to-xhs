// 小红书 3:4 卡片：Claude Sonnet 5.5（Anthropic 陶土橙主题）——封面 + 数据卡 + 三点说清楚
const pptxgen = require("pptxgenjs");
const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "CC785C", ACCENT_DEEP = "A85B40";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "F5EDE6", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";
const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS"; pres.author = "Z.ai"; pres.title = "Claude Sonnet 5.5 小红书卡片";
const T = (t, o) => ({ text: t, options: o });

let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });
s1.addText("Sonnet 5.5", { x: M, y: 2.0, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("反超自家旗舰", { x: M, y: 3.5, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
s1.addText([
  T("Claude 家族第二款模型：", { breakLine: true }),
  T("多数工作达 Opus 水平，定价减半", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });
const chips1 = [
  { num: "70.6%", label: "Terminal-Bench 4.0" },
  { num: "1844", label: "GDPval-AA Elo" },
  { num: "-50%", label: "定价 vs Opus 5.5" },
];
chips1.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});
s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("Anthropic · 2026-09-28 · 全平台可用", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("SONNET 5.5 · 数据", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("中档的反超，数字都在这", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 38, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
const rows = [
  { n: "01", lead: "反超旗舰的编程分", desc: "Terminal-Bench 4.0 拿下 70.6%，自家旗舰 Opus 5.5 为 66.4%；Sonnet 5 仅 10.3%" },
  { n: "02", lead: "知识工作差 2 分", desc: "GDPval-AA 拿 1844 分，旗舰 1846——44 种职业的真实工作评测" },
  { n: "03", lead: "十分之一的成本", desc: "多数基准 Low/Medium 档即超 Sonnet 5 最佳成绩（AA-Briefcase 约 1/9）" },
  { n: "04", lead: "真实构建追平旗舰", desc: "Base44 实测 118 次应用构建追平 Opus 5，平均迭代 3.6 次 vs 7.7 次" },
];
rows.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 24, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s2.addText("顺带：首个仅凭截图通关《宝可梦 红》的 Sonnet 模型", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：Anthropic（2026-09-28）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("SONNET 5.5 · 说清楚", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("三点说清楚", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("「反超旗舰」之外，这三件事也要知道", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });
const notes = [
  { n: "01", lead: "复杂工作仍用 Opus", desc: "官方口径没变：需要审慎判断的工作交给旗舰——分数接近不等于整体替换" },
  { n: "02", lead: "高强度档有波动", desc: "FrontierCode 的 Max 档反而更低，官方自披露：code-review 子代理超时所致" },
  { n: "03", lead: "自家参与口径", desc: "多篇基准为 Anthropic 参与的评测；GPT-6 Sol 在多数对应项未报告分数" },
];
notes.forEach((st, i) => {
  const ry = 2.6 + i * 1.62;
  s3.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s3.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 24, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("本周第二家：中档打旗舰", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("前天 GPT-6 Sol 同款剧情，旗舰护城河正被自家中档填平", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });
s3.addText("来源：Anthropic（09-28）· 分数为官方自报口径", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
