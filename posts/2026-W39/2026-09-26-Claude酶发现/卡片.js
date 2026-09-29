// 小红书 3:4 卡片：Claude 酶发现（封面卡 + 过程卡 + 意义卡）
// 主题：Anthropic 陶土橙（与 Opus 5.5 期一致，accent 跟随选题方品牌色）
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
pres.title = "Claude 酶发现 小红书卡片";

const T = (text, opt) => ({ text, options: opt });

// ---------- 卡片 1：封面（深色） ----------
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });

s1.addText("AI 自己发现", { x: M, y: 2.0, w: 6.5, h: 1.45, fontSize: 76, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("新酶系统", { x: M, y: 3.45, w: 6.5, h: 1.45, fontSize: 76, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });

s1.addText([
  T("Claude × Arc Institute × Stanford，", { breakLine: true }),
  T("合作研究登上 Science", {}),
], { x: M, y: 5.3, w: 6.5, h: 1.0, fontSize: 22, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });

const chips = [
  { num: "≈21h", label: "从数据到发现" },
  { num: "1 个", label: "未被记录的新系统" },
  { num: "Science", label: "顶刊发表" },
];
chips.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});

s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("Anthropic Newsroom · 2026-09-23 · 发现于细菌 DNA", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

// ---------- 卡片 2：过程（浅色） ----------
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("CLAUDE × SCIENCE · 过程", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("这次是怎么发生的？", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });

const steps = [
  { n: "01", lead: "只给高层方向", desc: "科学家不给先验知识，Claude 自主研究细菌基因组数据" },
  { n: "02", lead: "约 21 小时", desc: "从海量基因组数据中锁定一个结构类似 CRISPR 的新系统" },
  { n: "03", lead: "连功能一起推断", desc: "不只找到序列，还给出了这个系统是干什么的假设" },
  { n: "04", lead: "人类负责验证", desc: "Arc Institute 与 Stanford 合作验证，成果登上 Science" },
];
steps.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 18, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s2.addText("发现于细菌 DNA：限制酶、Taq、CRISPR 都出自这里", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：Anthropic Newsroom（2026-09-23）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

// ---------- 卡片 3：意义（浅色） ----------
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("CLAUDE × SCIENCE · 意义", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("为什么值得在意？", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("AI 的角色，从工具变成了发现者", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });

const stats = [
  { num: "21h", label: "从数据到发现", range: "据报道，仅给高层方向" },
  { num: "1", label: "此前未被记录的酶系统", range: "类似 CRISPR，出自细菌 DNA" },
  { num: "Science", label: "发表背书", range: "09-23，与 Arc、Stanford 合作" },
];
stats.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.num, { x: M, y: ry, w: 2.9, h: 1.0, fontSize: st.num.length > 4 ? 40 : 52, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
  s3.addText(st.label, { x: 3.55, y: ry + 0.12, w: 3.45, h: 0.45, fontSize: 17, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 3.55, y: ry + 0.6, w: 3.45, h: 0.4, fontSize: 15, fontFace: FONT, color: TXT_GRAY, margin: 0 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.42, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("范式变化：假设由 AI 提出，人类负责验证", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("限制酶、Taq、CRISPR 之后的下一个，可能由 AI 先指出来", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });

s3.addText("来源：Anthropic Newsroom（09-23）·「新基因编辑」为潜力判断", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
