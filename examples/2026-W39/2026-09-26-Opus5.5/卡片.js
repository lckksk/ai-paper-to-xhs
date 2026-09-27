// 小红书 3:4 卡片：Claude Opus 5.5 解读（封面卡 + 实绩卡 + 成绩卡）
// 主题：Anthropic 陶土橙（accent 跟随选题方品牌色，见 references/卡片规范.md）
const pptxgen = require("pptxgenjs");

const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "CC785C", ACCENT_DEEP = "A85B40";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6A66";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9C7C2", MUTED_ON_DARK = "9C9A94";
const TINT = "F5EDE6", HAIRLINE = "ECEAE6", HAIRLINE_DARK = "3A3937";
const FONT = "Microsoft YaHei";

const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS";
pres.author = "Z.ai";
pres.title = "Claude Opus 5.5 小红书卡片";

const T = (text, opt) => ({ text, options: opt });

// ---------- 卡片 1：封面（深色） ----------
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });

s1.addText("打平旗舰", { x: M, y: 2.0, w: 6.5, h: 1.55, fontSize: 88, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("便宜四成", { x: M, y: 3.55, w: 6.5, h: 1.55, fontSize: 88, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });

s1.addText([
  T("Claude Opus 5.5 发布：缓存降价 60%，", { breakLine: true }),
  T("输出提速 30%，运行成本省 40%", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });

s1.addText("运行成本对比 Opus 5（典型负载）", { x: M, y: 6.75, w: 6.5, h: 0.45, fontSize: 19, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0 });

const bars = [
  { label: "-20%", tag: "token 单价", h: 0.35 },
  { label: "-40%", tag: "典型负载", h: 0.7 },
  { label: "-60%", tag: "缓存读取", h: 1.05 },
];
bars.forEach((b, i) => {
  const bx = 0.55 + i * 1.45, base = 8.62;
  s1.addText(b.label, { x: bx - 0.05, y: base - b.h - 0.42, w: 1.35, h: 0.36, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: base - b.h, w: 1.15, h: b.h, fill: { color: i === 2 ? ACCENT : "8F5844" }, line: { type: "none" }, rectRadius: 0.06 });
  s1.addText(b.tag, { x: bx - 0.05, y: base + 0.08, w: 1.35, h: 0.32, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
});

s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("Anthropic Newsroom · 2026-09-22 · 全平台可用", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

// ---------- 卡片 2：编程实绩（浅色） ----------
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("OPUS 5.5 · 编程实绩", { x: M, y: 0.6, w: 4.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("便宜四成，活儿怎么样？", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });

const feats = [
  { n: "01", lead: "一天，68 万行", desc: "早期测试者用它在一天内完成整库代码迁移，工程团队原本要几周" },
  { n: "02", lead: "3 小时，20 万行", desc: "审计并修复 20 万行代码库；Opus 5 要 20 多个小时、2.5 倍 token" },
  { n: "03", lead: "HAProxy 转译", desc: "C 转 Rust 通过几乎全部官方回归测试，比 Fable 5.1 快且省 51%" },
  { n: "04", lead: "四分之一的成本", desc: "FrontierCode 默认档打败 GPT-6 Astra，每任务成本约其五分之一" },
];
feats.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 18, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s2.addText("GitHub 实测：token 与步数最少，步数不到一半", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：Anthropic Newsroom（2026-09-22）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

// ---------- 卡片 3：成绩单（浅色） ----------
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("OPUS 5.5 · 成绩单", { x: M, y: 0.6, w: 4.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("能力这块，数字说话", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("九项基准七项第一（对手含 Fable 5.1、GPT-6 Astra）", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });

const stats = [
  { num: "66.4%", label: "Terminal-Bench 4.0", range: "Fable 5.1 为 55.8%" },
  { num: "1846", label: "GDPval-AA Elo", range: "44 种职业真实工作评测，三家最高" },
  { num: "16/18", label: "深度报告过质量线", range: "Fable 5.1 与 Opus 5 均为 0" },
];
stats.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.num, { x: M, y: ry, w: 2.9, h: 1.0, fontSize: 52, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
  s3.addText(st.label, { x: 3.55, y: ry + 0.12, w: 3.45, h: 0.45, fontSize: 17, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 3.55, y: ry + 0.6, w: 3.45, h: 0.4, fontSize: 15, fontFace: FONT, color: TXT_GRAY, margin: 0 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.42, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("官方自曝：跑分差距，已不代表真实差距", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("Anthropic：实际使用中 5.5 与 Fable 5.1 的差距比表格小", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });

s3.addText("来源：Anthropic Newsroom（2026-09-22）· 两项基准 Astra 更高", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
