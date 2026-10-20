/**
 * 卡片骨架-热点帖.js —— 每日热点帖「真实截图混排」标准骨架
 *
 * 用法：复制到成稿目录改名 卡片.js，改顶部 CONFIG 与各卡文案即可。
 * 前置：先跑 scripts/fetch_shots.js 抓图到 ./shots（见 references/真实素材规范.md）
 *
 * 版式配比（3-5 卡）：
 *   卡1 封面  标题大字 + 真实主视觉截图 + 三个数字 chip
 *   卡2 内容  截图 + 编号要点（图在上，文在下）
 *   卡3 内容  双截图并排 + 图注（对比/前后）
 *   卡4 信息  纯文字：怎么用 / 结论 / 钩子（全帖只准有 1 张纯信息卡）
 */
const path = require("path");
const C = require("E:/自媒体运营/ai-paper-to-xhs/skill/assets/卡片组件.js");

// ---------------- 改这里 ----------------
const CONFIG = {
  accent: "1D4ED8",        // 主色：取自选题方品牌色
  accentDeep: "1E40AF",    // 浅底上的强调色（对比度更高）
  tint: "E4ECFB",          // 结论色带底色（accent 的同族极浅色）
  kicker: "AI 前沿速递",    // 栏目名
  date: "2026·10·20",
  title: "副标题放这里",     // 主标题（一行，冲击力优先）
  title2: "主标题放这里",    // 第二行（带 accent 色）
  source: "来源：xxx · 2026-10-20",
  out: "卡片源文件.pptx",
};
const SHOTS = path.join(__dirname, "shots");
// ----------------------------------------

const ctx = C.init({ accent: CONFIG.accent, accentDeep: CONFIG.accentDeep, tint: CONFIG.tint });
const { pres, W, H, M, P, ACCENT, ACCENT_DEEP, TINT, FONT } = ctx;

// ============ 卡 1：封面（真实主视觉） ============
{
  const s = ctx.cover();
  ctx.kickerLine(s, CONFIG.kicker, CONFIG.date);
  s.addText(CONFIG.title, { x: M, y: 1.05, w: 6.5, h: 1.2, fontSize: 64, bold: true, fontFace: FONT, color: P.TXT_ON_DARK, margin: 0, valign: "middle" });
  s.addText(CONFIG.title2, { x: M, y: 2.15, w: 6.5, h: 1.1, fontSize: 52, bold: true, fontFace: FONT, color: ACCENT, margin: 0, valign: "middle" });

  // 主视觉：官方页面/产品实截图（w 6.5，h 会自动按比例算）
  C.shotBox(ctx, s, {
    path: path.join(SHOTS, "cover.png"),
    x: M, y: 3.5, w: 6.5, h: 2.6, fit: "contain",
    url: "example.com/real-page", dark: true, barH: 0.3, urlSize: 8,
    caption: "官方页面原样截取 · 2026-10-20", captionSize: 12,
  });

  // 三个数字 chip（只用真实数字）
  const chips = [
    { v: "数字A", t: "标签A" },
    { v: "数字B", t: "标签B" },
    { v: "数字C", t: "标签C" },
  ];
  chips.forEach((c, i) => {
    const bx = 0.55 + i * 2.2;
    s.addText(c.v, { x: bx, y: 7.55, w: 2.1, h: 0.45, fontSize: 18, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
    s.addText(c.t, { x: bx, y: 8.0, w: 2.1, h: 0.32, fontSize: 13, fontFace: FONT, color: P.MUTED_ON_DARK, margin: 0 });
  });
  ctx.sourceLine(s, CONFIG.source, true);
}

// ============ 卡 2：截图 + 编号要点 ============
{
  const s = ctx.card();
  s.addText("亮点一", { x: M, y: 0.52, w: 5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
  s.addText("一句结论式小标题", { x: M, y: 0.92, w: 6.5, h: 0.8, fontSize: 34, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });
  s.addText("一句解释这个标题的副标题", { x: M, y: 1.74, w: 6.5, h: 0.42, fontSize: 17, fontFace: FONT, color: P.TXT_GRAY, margin: 0 });

  C.shotBox(ctx, s, {
    path: path.join(SHOTS, "content1.png"),
    x: M, y: 2.32, w: 6.5, h: 2.5, fit: "contain",
    url: "example.com/path", dark: false, barH: 0.28, urlSize: 8,
    caption: "说明这张图在证明什么", captionSize: 11.5,
  });

  const rows = [
    { n: "01", lead: "要点一", desc: "一行说明，带真实细节" },
    { n: "02", lead: "要点二", desc: "一行说明，带真实细节" },
  ];
  rows.forEach((r, i) => {
    const ry = 5.55 + i * 1.05;
    s.addText(r.n, { x: M, y: ry, w: 0.9, h: 0.6, fontSize: 30, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
    s.addText(r.lead, { x: 1.55, y: ry + 0.02, w: 5.45, h: 0.4, fontSize: 21, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });
    s.addText(r.desc, { x: 1.55, y: ry + 0.44, w: 5.45, h: 0.4, fontSize: 15, fontFace: FONT, color: P.TXT_GRAY, margin: 0 });
    if (i === 0) s.addShape(pres.shapes.LINE, { x: M, y: ry + 0.94, w: W - 2 * M, h: 0, line: { color: P.HAIRLINE, width: 0.75 } });
  });
  ctx.sourceLine(s, CONFIG.source);
}

// ============ 卡 3：双截图并排 ============
{
  const s = ctx.card();
  s.addText("亮点二", { x: M, y: 0.52, w: 5, h: 0.4, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
  s.addText("两个东西放一起看", { x: M, y: 0.92, w: 6.5, h: 0.8, fontSize: 34, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });

  C.shotPair(ctx, s, {
    x: M, y: 1.85, w: 6.5, gap: 0.16,
    items: [
      { path: path.join(SHOTS, "pair-a.png"), url: "site-a.com", caption: "左边这张说明什么" },
      { path: path.join(SHOTS, "pair-b.png"), url: "site-b.com", caption: "右边这张说明什么" },
    ],
  });

  ctx.tintBand(s, 6.9, 2.0, "一句扎心的结论", "两行以内的解释，最好带一个具体数字或具体场景");
  ctx.sourceLine(s, CONFIG.source);
}

// ============ 卡 4：纯信息卡（全帖唯一） ============
{
  const s = ctx.card();
  s.addText("怎么用上 / 关键提醒", { x: M, y: 0.55, w: 6.5, h: 0.42, fontSize: 15, bold: true, fontFace: FONT, color: ACCENT_DEEP, charSpacing: 2, margin: 0 });
  s.addText("三条路，按需选", { x: M, y: 1.0, w: 6.5, h: 0.9, fontSize: 38, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });
  const ways = [
    { n: "01", lead: "不折腾", desc: "直接打开就能用，无需任何配置" },
    { n: "02", lead: "开发者", desc: "接口地址与调用方式，注意计费时点" },
    { n: "03", lead: "折腾党", desc: "开源地址与本地部署的坑" },
  ];
  ways.forEach((wy, i) => {
    const ry = 2.3 + i * 1.85;
    s.addText(wy.n, { x: M, y: ry, w: 1.0, h: 0.75, fontSize: 38, bold: true, fontFace: FONT, color: ACCENT, margin: 0 });
    s.addText(wy.lead, { x: 1.65, y: ry + 0.02, w: 5.35, h: 0.5, fontSize: 23, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });
    s.addText(wy.desc, { x: 1.65, y: ry + 0.58, w: 5.35, h: 0.9, fontSize: 16, fontFace: FONT, color: P.TXT_GRAY, margin: 0, lineSpacingMultiple: 1.15 });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: M, y: ry + 1.65, w: W - 2 * M, h: 0, line: { color: P.HAIRLINE, width: 0.75 } });
  });
  ctx.tintBand(s, 8.1, 1.05, "一句站得住的判断", null);
  ctx.sourceLine(s, CONFIG.source);
}

pres.writeFile({ fileName: CONFIG.out }).then(() => console.log("written:", CONFIG.out));
