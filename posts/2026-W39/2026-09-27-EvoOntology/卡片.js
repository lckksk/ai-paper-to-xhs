// 小红书 3:4 卡片：EvoOntology（封面卡 + 痛点方案卡 + 自进化与边界卡）
// 主题：人大红（accent 跟随选题方品牌色）
const pptxgen = require("pptxgenjs");

const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "C0392B", ACCENT_DEEP = "96281B";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "F9EDEB", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";

const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS";
pres.author = "Z.ai";
pres.title = "EvoOntology 小红书卡片";

const T = (text, opt) => ({ text, options: opt });

// ---------- 卡片 1：封面（深色） ----------
let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });

s1.addText("一本会进化的", { x: M, y: 2.0, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("数据说明书", { x: M, y: 3.5, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });

s1.addText([
  T("人大团队新论文 EvoOntology：", { breakLine: true }),
  T("解决 AI 数据 Agent 的老毛病", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });

const chips = [
  { num: "3", label: "数据基准测试" },
  { num: "4", label: "种底层模型验证" },
  { num: "MCP", label: "即插即用" },
];
chips.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});

s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("arXiv 2609.15779 · RUC-DataLab · 代码开源", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

// ---------- 卡片 2：痛点与方案（浅色） ----------
let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("EVOONTOLOGY · 方案", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("老毛病，新解法", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });

const steps = [
  { n: "01", lead: "病根在哪", desc: "数据在 AI 的「脑子」外面，它只能靠列名和路径猜——学名叫 agent-data gap" },
  { n: "02", lead: "老路不通", desc: "让 AI 自己探索原始数据太慢；手写说明书塞进 prompt 又贵又脆，数据一变就作废" },
  { n: "03", lead: "装上说明书", desc: "本体层封装成 MCP 服务器，三层结构：表结构、取值内容、工具用法" },
  { n: "04", lead: "即插即用", desc: "Agent 干活时实时查手册，而不是把所有东西一次性塞进 prompt" },
];
steps.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 18, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s2.addText("3 个基准 × 4 种底层模型，持续领先强基线", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：arXiv 2609.15779（2026-09-14）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

// ---------- 卡片 3：自进化与边界（浅色） ----------
let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("EVOONTOLOGY · 自进化与边界", { x: M, y: 0.6, w: 5.0, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("说明书自己会进化", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 40, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("用得越多越准，但每一步修改都设了门槛", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });

const rows = [
  { n: "01", label: "builder agent 当编辑", range: "自动构建本体，并负责后续的修订与升级" },
  { n: "02", label: "归因引导的类型化编辑", range: "修改有归因、有类型，不是乱改（官方机制名）" },
  { n: "03", label: "成对评估卡门槛", range: "同一道题新旧版本各做一遍，新版赢了才被采纳" },
];
rows.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s3.addText(st.label, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 22, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.6, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});

s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("公允起见：评估体系是作者自建的", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("能否长期拦住坏修改，要看真实使用的检验", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });

s3.addText("来源：arXiv 2609.15779（RUC-DataLab）· 具体基准数字见原文", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
