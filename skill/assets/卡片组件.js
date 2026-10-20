/**
 * 卡片组件.js —— 小红书 3:4 卡片「真实截图混排」组件库
 *
 * 设计目标：让卡片里出现可核验的真实网页元素（带浏览器地址栏的截图），
 *           解决"全是 AI 自己拼的图、看着假"的问题。
 *
 * 用法（成稿目录里的 卡片.js）：
 *   const C = require("E:/自媒体运营/ai-paper-to-xhs/skill/assets/卡片组件.js");
 *   const ctx = C.init({ accent: "1D4ED8", accentDeep: "1E40AF", title: "xxx" });
 *   const s1 = ctx.cover();                       // 深底封面
 *   C.shotBox(ctx, s1, { path: "shots/hf-papers.png", x: 0.5, y: 3.7, w: 6.5,
 *                        url: "huggingface.co/papers", caption: "本周热门论文榜 · 10-18 快照" });
 *
 * 组件是「零件」不是「整卡」：版式照样自由度很高，只把重复元素标准化。
 */
const fs = require("fs");
const pptxgen = require("pptxgenjs");

const FONT = "Microsoft YaHei";

// ---------- 调色板 ----------
const PALETTE = {
  BG_DARK: "17181C",
  BG_LIGHT: "FFFFFF",
  TXT_DARK: "1F2024",
  TXT_GRAY: "6B6E74",
  TXT_ON_DARK: "FFFFFF",
  GRAY_ON_DARK: "C9CBD1",
  MUTED_ON_DARK: "9CA0A8",
  HAIRLINE: "ECECEA",
  HAIRLINE_DARK: "3A3C42",
  // 浏览器边框（浅底卡）
  CHROME_BAR: "EFEFF1",
  CHROME_DOT: "D2D3D7",
  CHROME_URLBG: "FFFFFF",
  CHROME_URLTXT: "8A8D93",
  CHROME_BORDER: "E0E1E5",
  // 浏览器边框（深底卡）
  CHROME_BAR_D: "24262B",
  CHROME_DOT_D: "4A4C53",
  CHROME_URLBG_D: "1A1B1F",
  CHROME_URLTXT_D: "8E9199",
  CHROME_BORDER_D: "3C3E45",
};

// ---------- 图片尺寸读取（PNG / JPEG，不引第三方包） ----------
function imageSize(p) {
  try {
    const b = fs.readFileSync(p);
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        }
        i += 2 + len;
      }
    }
  } catch (e) {}
  return null;
}

function init(opts) {
  const o = opts || {};
  const pres = new pptxgen();
  const W = 7.5, H = 10, M = 0.5;
  pres.defineLayout({ name: "XHS", width: W, height: H });
  pres.layout = "XHS";
  if (o.title) pres.title = o.title;

  const P = Object.assign({}, PALETTE, o.palette || {});
  const ACCENT = o.accent || "FF6900";
  const ACCENT_DEEP = o.accentDeep || ACCENT;
  const TINT = o.tint || "FFF1E7";

  const ctx = {
    pres, W, H, M, P, ACCENT, ACCENT_DEEP, TINT, FONT,
    // 深底封面（角标 + 日期留白位，内容自己排）
    cover() {
      const s = pres.addSlide();
      s.background = { color: P.BG_DARK };
      return s;
    },
    // 浅底内容卡
    card() {
      const s = pres.addSlide();
      s.background = { color: P.BG_LIGHT };
      return s;
    },
    // 角标行：左栏目名 / 右日期
    kickerLine(s, left, right) {
      s.addText(left, { x: M, y: 0.5, w: 3.6, h: 0.4, fontSize: 15, fontFace: FONT, color: P.MUTED_ON_DARK, margin: 0 });
      if (right) s.addText(right, { x: 4.3, y: 0.5, w: 2.7, h: 0.4, fontSize: 15, fontFace: FONT, color: P.MUTED_ON_DARK, align: "right", margin: 0 });
    },
    // 来源行（满宽发丝线上方）
    sourceLine(s, text, dark) {
      s.addShape(pres.shapes.LINE, { x: M, y: 9.28, w: W - 2 * M, h: 0, line: { color: dark ? P.HAIRLINE_DARK : P.HAIRLINE, width: 0.75 } });
      s.addText(text, { x: M, y: 9.4, w: W - 2 * M, h: 0.35, fontSize: 12.5, fontFace: FONT, color: dark ? P.MUTED_ON_DARK : P.TXT_GRAY, margin: 0 });
    },
    // 满宽色带（结论/提醒）
    tintBand(s, y, h, title, body) {
      s.addShape(pres.shapes.RECTANGLE, { x: 0, y, w: W, h, fill: { color: TINT }, line: { type: "none" } });
      s.addText(title, { x: M, y: y + 0.2, w: W - 2 * M, h: 0.42, fontSize: 19, bold: true, fontFace: FONT, color: P.TXT_DARK, margin: 0 });
      if (body) s.addText(body, { x: M, y: y + 0.62, w: W - 2 * M, h: h - 0.72, fontSize: 16.5, fontFace: FONT, color: P.TXT_GRAY, margin: 0, lineSpacingMultiple: 1.3 });
    },
  };
  return ctx;
}

/**
 * 带浏览器地址栏的截图框 —— 真实感的来源
 * @param {object} ctx        init() 返回的对象
 * @param {slide}  s          幻灯片
 * @param {object} o
 *   path     图片路径
 *   x,y      左上角（英寸）
 *   w        宽度（英寸）；给了 h 也可以按 contain 缩
 *   h        可选，最大高度（英寸），配合 fit:"contain"
 *   fit      "w"（默认，按宽度定高）| "contain"（塞进 w×h 不裁剪）
 *   url      地址栏文字，如 "arxiv.org/abs/2510.03088"
 *   caption  图注，放在框下方（可选）
 *   dark     深底版样式
 *   border   是否画外描边，默认 true
 * @returns {number} 组件总高度（含 chrome 条与图注）
 */
function shotBox(ctx, s, o) {
  const { pres, P, FONT } = ctx;
  const barH = o.barH || 0.3;
  const size = imageSize(o.path);
  if (!size) {
    // 降级：灰框提示缺图，避免成稿静默出错
    s.addShape(pres.shapes.RECTANGLE, { x: o.x, y: o.y, w: o.w, h: o.h || 1.5, fill: { color: "F2F2F2" }, line: { color: "DDD", width: 1 } });
    s.addText("缺图：" + o.path, { x: o.x, y: o.y, w: o.w, h: 0.4, fontSize: 10, fontFace: FONT, color: "999999", align: "center", valign: "middle", margin: 0 });
    console.warn("shotBox 缺图:", o.path);
    return o.h || 1.5;
  }
  const ratio = size.h / size.w;
  let iw = o.w, ih = o.w * ratio;
  if (o.fit === "contain" && o.h) {
    if (ih > o.h) { ih = o.h; iw = o.h / ratio; }
  }
  const x = o.fit === "contain" && o.h ? o.x + (o.w - iw) / 2 : o.x;
  const y = o.y;

  const bar = o.dark ? P.CHROME_BAR_D : P.CHROME_BAR;
  const brd = o.dark ? P.CHROME_BORDER_D : P.CHROME_BORDER;
  const dot = o.dark ? P.CHROME_DOT_D : P.CHROME_DOT;
  const urlbg = o.dark ? P.CHROME_URLBG_D : P.CHROME_URLBG;
  const urltx = o.dark ? P.CHROME_URLTXT_D : P.CHROME_URLTXT;

  // 地址栏
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: iw, h: barH,
    fill: { color: bar },
    line: { color: brd, width: 0.75 },
  });
  const r = barH * 0.16;
  [0.14, 0.24, 0.34].forEach((dx) => {
    s.addShape(pres.shapes.OVAL, {
      x: x + dx, y: y + barH / 2 - r / 2, w: r, h: r,
      fill: { color: dot }, line: { type: "none" },
    });
  });
  if (o.url) {
    const ux = x + 0.44, uw = iw - 0.54;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: ux, y: y + barH * 0.16, w: uw, h: barH * 0.68,
      fill: { color: urlbg }, line: { color: brd, width: 0.5 },
      rectRadius: barH * 0.18,
    });
    s.addText(o.url, {
      x: ux + 0.08, y: y + barH * 0.16, w: uw - 0.16, h: barH * 0.68,
      fontSize: o.urlSize || 8.5, fontFace: "Consolas", color: urltx,
      valign: "middle", margin: 0,
    });
  }
  // 主图
  s.addImage({ path: o.path, x, y: y + barH, w: iw, h: ih });
  if (o.border !== false) {
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: iw, h: barH + ih,
      fill: { type: "none" }, line: { color: brd, width: 0.75 },
    });
  }
  let total = barH + ih;
  if (o.caption) {
    const capH = o.captionH || 0.28;
    s.addText(o.caption, {
      x, y: y + barH + ih + 0.06, w: iw, h: capH,
      fontSize: o.captionSize || 12, fontFace: FONT, color: o.dark ? P.MUTED_ON_DARK : P.TXT_GRAY,
      margin: 0,
    });
    total += 0.06 + capH;
  }
  return total;
}

/**
 * 并排两张截图（等宽、等高对齐，按较高的定高）
 */
function shotPair(ctx, s, o) {
  const gap = o.gap || 0.16;
  const w = (o.w - gap) / 2;
  let hMax = 0;
  const hs = o.items.map((it) => {
    const size = imageSize(it.path);
    return size ? w * (size.h / size.w) : 1;
  });
  hMax = Math.max.apply(null, hs);
  o.items.forEach((it, i) => {
    const size = imageSize(it.path);
    const ih = size ? w * (size.h / size.w) : 1;
    // 用 contain 让高度不一的图对齐到同一底边顶部
    shotBox(ctx, s, {
      path: it.path, x: o.x + i * (w + gap), y: o.y, w, h: hMax,
      fit: "w", url: it.url, caption: it.caption,
      captionH: it.caption ? 0.3 : 0, captionSize: o.captionSize || 11.5,
      dark: o.dark, urlSize: o.urlSize || 7.5, barH: o.barH || 0.28,
    });
    void ih;
  });
  return hMax + (o.barH || 0.28) + (o.items.some((x) => x.caption) ? 0.36 : 0);
}

module.exports = { init, shotBox, shotPair, imageSize, PALETTE, FONT, pptxgen };
