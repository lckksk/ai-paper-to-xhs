// 小红书 3:4 卡片生成：CodeMidas 解读（封面卡 + 方法卡 + 成绩卡）
// 画布 7.5×10in，按 165.6dpi 渲染 → 1242×1656px
const pptxgen = require("pptxgenjs");

const W = 7.5, H = 10, M = 0.5;
// 调色板：深色底 + 小米橙 accent（主题：AI编程/小米论文）
const BG_DARK = "17181C", BG_LIGHT = "FFFFFF";
const ORANGE = "FF6900", ORANGE_DEEP = "E05A00";
const TXT_DARK = "1F2024", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "FFF1E7", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";

const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS";
pres.author = "Z.ai";
pres.title = "CodeMidas 小红书卡片";

const T = (text, opt) => ({ text, options: opt });

// ---------- 卡片 1：封面（深色） ----------
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });

s1.addText("AI自己出题", { x: M, y: 1.95, w: 6.5, h: 1.55, fontSize: 84, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("自己判卷", { x: M, y: 3.5, w: 6.5, h: 1.55, fontSize: 84, bold: true, fontFace: FONT, color: ORANGE, margin: 0, valign: "middle" });

s1.addText([
  T("小米新论文：只用代码本身，", { breakLine: true }),
  T("自动造出 AI 编程训练题库", {}),
], { x: M, y: 5.35, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });

s1.addText("五大编程基准，全部上涨", { x: M, y: 6.7, w: 6.5, h: 0.45, fontSize: 19, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0 });

// 迷你涨幅图（真实数据：三个基准的提升幅度）
const bars = [
  { label: "+8.5%", tag: "终端操作", h: 0.52 },
  { label: "+11.7%", tag: "修 bug", h: 0.72 },
  { label: "+17", tag: "从零写程序", h: 1.04 },
];
bars.forEach((b, i) => {
  const bx = 0.55 + i * 1.45, base = 8.62;
  s1.addText(b.label, { x: bx - 0.05, y: base - b.h - 0.42, w: 1.35, h: 0.36, fontSize: 15, bold: true, fontFace: FONT, color: ORANGE, margin: 0 });
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: base - b.h, w: 1.15, h: b.h, fill: { color: i === 2 ? ORANGE : "B34700" }, line: { type: "none" }, rectRadius: 0.06 });
  s1.addText(b.tag, { x: bx - 0.05, y: base + 0.08, w: 1.35, h: 0.32, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
});

s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("arXiv 2609.22068 · 小米 MiMo × 北大 × 港大 × 人大", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

// ---------- 卡片 2：方法四步（浅色） ----------
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("CODEMIDAS · 方法", { x: M, y: 0.6, w: 4.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ORANGE_DEEP, charSpacing: 2, margin: 0 });
s2.addText("它是怎么做到的？", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });

const steps = [
  { n: "01", lead: "挖空出题", desc: "AI 通读开源项目，把一个完整功能的实现挖掉，剩下的代码库就是题目" },
  { n: "02", lead: "真实判卷", desc: "按功能写测试，判分标准取自原版代码的真实运行结果，不是 AI 拍脑袋" },
  { n: "03", lead: "防误判", desc: "逐条审查测试，删掉题目没要求的苛刻限制，不冤枉正确解法" },
  { n: "04", lead: "防作弊", desc: "专门派一个「作弊 Agent」翻遍环境找泄漏的答案，能走后门的题作废" },
];
steps.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ORANGE, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 18, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s2.addText("最终留下 5,545 道题 · 覆盖 3,185 个开源项目 · 23 种语言", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ORANGE_DEEP, margin: 0 });
s2.addText("来源：CodeMidas（arXiv 2609.22068）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

// ---------- 卡片 3：成绩单（浅色） ----------
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("CODEMIDAS · 效果", { x: M, y: 0.6, w: 4.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ORANGE_DEEP, charSpacing: 2, margin: 0 });
s3.addText("训练后，五个基准全涨", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("用这批题强化学习训练小米 MiMo-V2.5", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });

const stats = [
  { num: "+11.7%", label: "修 bug · DeepSWE", range: "10.0% → 21.7%" },
  { num: "+17", label: "从零写程序 · ProgramBench", range: "4.5 → 21.5" },
  { num: "+8.5%", label: "终端操作 · Terminal-Bench", range: "63.7% → 72.2%" },
];
stats.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.num, { x: M, y: ry, w: 2.9, h: 1.0, fontSize: 52, bold: true, fontFace: FONT, color: ORANGE, margin: 0, valign: "middle" });
  s3.addText(st.label, { x: 3.55, y: ry + 0.12, w: 3.45, h: 0.45, fontSize: 17, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 3.55, y: ry + 0.6, w: 3.45, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.42, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

// 结论色带（承载真实洞察）
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("精筛 3,000 题 ＞ 未清洗 8,000 题", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("训练 AI 和人一样：刷烂题，不如精做好题", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });

s3.addText("来源：CodeMidas（arXiv 2609.22068）· 另两基准同步提升", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
