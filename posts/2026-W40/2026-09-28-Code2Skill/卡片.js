// 小红书 3:4 卡片：Code2Skill（蚂蚁蓝主题）——封面 + 怎么挖 + 成绩单
const pptxgen = require("pptxgenjs");
const W = 7.5, H = 10, M = 0.5;
const BG_DARK = "141413", BG_LIGHT = "FFFFFF";
const ACCENT = "1677FF", ACCENT_DEEP = "0E5FD8";
const TXT_DARK = "1F1E1D", TXT_GRAY = "6B6E74";
const TXT_ON_DARK = "FFFFFF", GRAY_ON_DARK = "C9CBD1", MUTED_ON_DARK = "9CA0A8";
const TINT = "EAF2FF", HAIRLINE = "ECECEA", HAIRLINE_DARK = "3A3C42";
const FONT = "Microsoft YaHei";
const pres = new pptxgen();
pres.defineLayout({ name: "XHS", width: W, height: H });
pres.layout = "XHS"; pres.author = "Z.ai"; pres.title = "Code2Skill 小红书卡片";
const T = (t, o) => ({ text: t, options: o });

let s1 = pres.addSlide();
s1.background = { color: BG_DARK };
s1.addText("AI 论文解读", { x: M, y: 0.55, w: 3.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });
s1.addText("2026 · 09", { x: 4.8, y: 0.55, w: 2.2, h: 0.4, fontSize: 15, fontFace: FONT, color: MUTED_ON_DARK, align: "right", margin: 0 });
s1.addText("从代码里挖出", { x: M, y: 2.0, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: TXT_ON_DARK, margin: 0, valign: "middle" });
s1.addText("百万条技能", { x: M, y: 3.5, w: 6.5, h: 1.5, fontSize: 72, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
s1.addText([
  T("蚂蚁国际新论文 Code2Skill：", { breakLine: true }),
  T("让 Agent 的教材自动生成", {}),
], { x: M, y: 5.4, w: 6.5, h: 1.05, fontSize: 24, fontFace: FONT, color: GRAY_ON_DARK, margin: 0, lineSpacingMultiple: 1.25 });
const chips1 = [
  { num: "100万", label: "通过验证的技能" },
  { num: "19,769", label: "个开源仓库" },
  { num: "+11.7%", label: "平均性能提升" },
];
chips1.forEach((c, i) => {
  const cx = 0.5 + i * 2.25;
  s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 6.9, w: 2.0, h: 1.3, fill: { color: "201F1D" }, line: { color: HAIRLINE_DARK, width: 0.75 }, rectRadius: 0.08 });
  s1.addText(c.num, { x: cx, y: 7.02, w: 2.0, h: 0.55, fontSize: 26, bold: true, fontFace: FONT, color: ACCENT, align: "center", margin: 0 });
  s1.addText(c.label, { x: cx, y: 7.6, w: 2.0, h: 0.4, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, align: "center", margin: 0 });
});
s1.addShape(pres.shapes.LINE, { x: M, y: 9.3, w: W - 2 * M, h: 0, line: { color: HAIRLINE_DARK, width: 0.75 } });
s1.addText("arXiv 2609.05571 · 蚂蚁国际 · 2026-09-04", { x: M, y: 9.42, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: MUTED_ON_DARK, margin: 0 });

let s2 = pres.addSlide();
s2.background = { color: BG_LIGHT };
s2.addText("CODE2SKILL · 怎么挖", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s2.addText("老路走不通，答案在代码", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 38, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
const steps = [
  { n: "01", lead: "两条老路", desc: "让 Agent 在特定环境里试错攒经验——换环境归零；从文档提取——纸上谈兵没证据" },
  { n: "02", lead: "换个思路", desc: "能跑起来的源代码，本身就是「怎么把这件事做成」的可执行证据" },
  { n: "03", lead: "自动挖矿", desc: "代码单元转成三类技能记录：原子操作、复合工作流、重复模式" },
  { n: "04", lead: "盲源重构验证", desc: "不看源码重写出实现，与原版对比——对得上，这条技能才算数" },
];
steps.forEach((st, i) => {
  const ry = 2.3 + i * 1.62;
  s2.addText(st.n, { x: M, y: ry, w: 1.1, h: 0.8, fontSize: 44, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
  s2.addText(st.lead, { x: 1.75, y: ry + 0.02, w: 5.25, h: 0.5, fontSize: 25, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s2.addText(st.desc, { x: 1.75, y: ry + 0.62, w: 5.25, h: 0.85, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
  if (i < 3) s2.addShape(pres.shapes.LINE, { x: M, y: ry + 1.5, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s2.addText("19,769 个仓库 → 1,006,822 条通过验证的技能记录", { x: M, y: 8.95, w: 6.5, h: 0.4, fontSize: 16, bold: true, fontFace: FONT, color: ACCENT_DEEP, margin: 0 });
s2.addText("来源：arXiv 2609.05571（2026-09-04）", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

let s3 = pres.addSlide();
s3.background = { color: BG_LIGHT };
s3.addText("CODE2SKILL · 成绩单", { x: M, y: 0.6, w: 4.5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
s3.addText("技能喂进去，成绩涨上来", { x: M, y: 1.05, w: 6.5, h: 0.85, fontSize: 38, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("72 项协议匹配评估：9 种模型设置 × 8 个基准", { x: M, y: 1.95, w: 6.5, h: 0.4, fontSize: 17, fontFace: FONT, color: TXT_GRAY, margin: 0 });
const stats = [
  { num: "+11.7%", label: "平均性能提升", range: "57 个案例超过基线" },
  { num: "7/7", label: "共享基准全胜", range: "全部优于轨迹衍生的技能库" },
  { num: "93.5%", label: "AI 代码技能通过率", range: "人类代码为 93.00%" },
];
stats.forEach((st, i) => {
  const ry = 2.75 + i * 1.62;
  s3.addText(st.num, { x: M, y: ry, w: 2.9, h: 1.0, fontSize: 52, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });
  s3.addText(st.label, { x: 3.55, y: ry + 0.12, w: 3.45, h: 0.45, fontSize: 17, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
  s3.addText(st.range, { x: 3.55, y: ry + 0.6, w: 3.45, h: 0.4, fontSize: 15, fontFace: FONT, color: TXT_GRAY, margin: 0 });
  if (i < 2) s3.addShape(pres.shapes.LINE, { x: M, y: ry + 1.42, w: W - 2 * M, h: 0, line: { color: HAIRLINE, width: 0.75 } });
});
s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.8, w: W, h: 1.25, fill: { color: TINT }, line: { type: "none" } });
s3.addText("公允起见：评估协议是作者定义的", { x: M, y: 7.98, w: 6.5, h: 0.45, fontSize: 21, bold: true, fontFace: FONT, color: TXT_DARK, margin: 0 });
s3.addText("技能库的价值也依赖检索质量——百万条里怎么捞对那条", { x: M, y: 8.45, w: 6.5, h: 0.4, fontSize: 16, fontFace: FONT, color: TXT_GRAY, margin: 0 });
s3.addText("来源：arXiv 2609.05571（蚂蚁国际）· 具体基准数字见原文", { x: M, y: 9.45, w: 6.5, h: 0.35, fontSize: 13, fontFace: FONT, color: TXT_GRAY, margin: 0 });

pres.writeFile({ fileName: "卡片源文件.pptx" }).then(() => console.log("pptx written"));
