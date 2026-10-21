/**
 * cards.js —— 小红书 3:4 卡片渲染引擎（HTML + CSS + Playwright）
 *
 * 为什么不用 pptxgenjs：卡片「AI 味」的三个病根（字重饥饿 / 零材质 / 过度规整）
 * 在 pptx 管线里修不了。HTML+CSS 能拿到可变字体全字重、渐变、阴影、滤镜、
 * 混合模式、SVG 手绘、3D 旋转——这些是「看着像人做的」的物理基础。
 *
 * 尺寸：1242 x 1656（3:4），渲染时 deviceScaleFactor=2 出 2484x3312 高清图。
 *
 * 四个主题：
 *   editorial   杂志编辑风 —— 米白纸底 + 宋体 900 巨标 + 砖红点睛。周刊 / 收藏向
 *   stage       深色舞台   —— 近黑底 + 金色渐变 + 发光截图。每日热点封面
 *   notebook    手绘批注   —— 楷体 + 荧光笔 + 红圈箭头 + 纸胶带。社会话题
 *   instrument  实验室仪器 —— 近黑 + 荧光青 + 等宽 + 网格取景框。硬技术选题
 *
 * 用法见 skill/references/卡片视觉规范.md，参考实现见
 * posts/2026-W42/周刊-2026-10-18-本周AI前沿TOP7/卡片.js
 */
const path = require("path");
const fs = require("fs");

const W = 1242;
const H = 1656;
const M = 96; // 页边距
const CW = W - M * 2; // 内容宽 1050

// ---------------- 字体 ----------------
// 用绝对 file:// 路径，避免依赖系统字体注册名（本机已确认存在思源可变字体）
const FONT_DIR = "file:///C:/Windows/Fonts/";
const FACE = `
@font-face{font-family:'NSerifSC';src:url('${FONT_DIR}NotoSerifSC-VF.ttf');font-weight:100 900;font-display:block;}
@font-face{font-family:'NSansSC';src:url('${FONT_DIR}NotoSansSC-VF.ttf');font-weight:100 900;font-display:block;}
@font-face{font-family:'KaiTiSC';src:url('${FONT_DIR}simkai.ttf');font-weight:400;font-display:block;}
@font-face{font-family:'DengXianL';src:url('${FONT_DIR}Dengl.ttf');font-weight:300;font-display:block;}
`;
const F = {
  serif: "'NSerifSC','Songti SC',serif",
  sans: "'NSansSC','PingFang SC',sans-serif",
  mono: "Consolas,'JetBrains Mono',monospace",
  kai: "'KaiTiSC','KaiTi',serif",
  light: "'DengXianL',sans-serif",
};

// ---------------- 主题 ----------------
const THEMES = {
  editorial: {
    bg: "#F5F2EA",
    fg: "#16150F",
    muted: "#8A8578",
    faint: "#B0AA9D",
    accent: "#B3341E",
    line: "rgba(22,21,15,.20)",
    hair: "rgba(22,21,15,.10)",
    body: F.serif,
    head: F.serif,
    label: F.sans,
    noise: 0.16,
    noiseBlend: "multiply",
  },
  stage: {
    bg: "#08090C",
    fg: "#FFFFFF",
    muted: "rgba(255,255,255,.58)",
    faint: "rgba(255,255,255,.34)",
    accent: "#F0C674",
    line: "rgba(255,255,255,.16)",
    hair: "rgba(255,255,255,.09)",
    body: F.sans,
    head: F.sans,
    label: F.sans,
    noise: 0.30,
    noiseBlend: "overlay",
  },
  notebook: {
    bg: "#FBF7EE",
    fg: "#1D1B16",
    muted: "#6B6558",
    faint: "#9C9484",
    accent: "#C0392B",
    ink: "#1B3A6B",
    line: "rgba(29,27,22,.26)",
    hair: "rgba(29,27,22,.14)",
    body: F.kai,
    head: F.kai,
    label: F.kai,
    noise: 0.22,
    noiseBlend: "multiply",
  },
  instrument: {
    bg: "#0A0B0D",
    fg: "#E8EAE6",
    muted: "#5C6660",
    faint: "#3C443F",
    accent: "#35F0A0",
    line: "rgba(255,255,255,.13)",
    hair: "rgba(255,255,255,.06)",
    body: F.sans,
    head: F.sans,
    label: F.mono,
    noise: 0,
    noiseBlend: "overlay",
  },
};

const NOISE_URI = (op) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)' opacity='${op}'/></svg>")`;

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ============================================================
// 基线 CSS
// ============================================================
function baseCSS(t) {
  return `
${FACE}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}
body{background:#4a4a4a;padding:0;margin:0;}
.card{
  width:${W}px;height:${H}px;position:relative;overflow:hidden;
  background:${t.bg};color:${t.fg};
  font-family:${t.body};
  font-feature-settings:"palt" 1;
}
.card .pad{position:absolute;left:${M}px;right:${M}px;top:0;bottom:0;}
/* 纸纹 / 颗粒 */
.grain{position:absolute;inset:0;pointer-events:none;background-image:${NOISE_URI("0.9")};opacity:${t.noise};mix-blend-mode:${t.noiseBlend};}
/* 角标行 */
.kicker{position:absolute;left:${M}px;right:${M}px;top:96px;display:flex;justify-content:space-between;align-items:baseline;
  font-family:${t.label};font-weight:500;font-size:19px;letter-spacing:.30em;color:${t.muted};text-transform:uppercase;}
.kicker .r{letter-spacing:.10em;}
/* 底部来源 */
.source{position:absolute;left:${M}px;right:${M}px;bottom:78px;font-family:${t.label};font-weight:300;font-size:17px;
  letter-spacing:.04em;color:${t.faint};}
.source.with-rule{padding-top:0;}
.rule-top{position:absolute;left:${M}px;right:${M}px;top:0;height:1px;background:${t.line};}
/* 数值行 */
.stats{display:flex;align-items:flex-start;}
.stats .item{flex:1;}
.stats .v{font-family:${t.head};font-weight:900;font-size:66px;line-height:1;letter-spacing:-.03em;}
.stats .k{font-family:${t.label};font-weight:400;font-size:18px;letter-spacing:.18em;color:${t.muted};margin-top:14px;}
.stats .sep{width:1px;background:${t.hair};margin:8px 42px 0;}
/* 截图框（裸图，无地址栏；需要地址栏用 shot 组件的 chrome 选项） */
.shot{position:relative;overflow:hidden;background:#fff;}
.shot img{width:100%;height:100%;object-fit:cover;display:block;}
`;
}

// ============================================================
// 组件
// ============================================================

/** 封面：杂志编辑风 */
function coverEditorial(o, t) {
  const titleLines = o.title || [];
  const titleHTML = titleLines
    .map((ln, i) => {
      const style =
        i === titleLines.length - 1 && o.accentWord
          ? `font-style:italic;font-weight:300;font-size:${o.accentSize || 150}px;color:${t.accent};margin-top:${o.accentGap == null ? 14 : o.accentGap}px;`
          : "";
      return `<div style="${style}">${esc(ln)}</div>`;
    })
    .join("");

  const s = o.shot || {};
  const shot = o.shot
    ? `
  <div style="position:absolute;left:${s.x || 848}px;top:${s.y || 700}px;width:${s.w || 470}px;height:${s.h || 610}px;
    background:#fff;transform:rotate(${s.rotate == null ? 1.2 : s.rotate}deg);box-shadow:-16px 20px 48px rgba(22,21,15,.19);
    border:1px solid rgba(22,21,15,.10);overflow:hidden;">
    <img src="${esc(s.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
  </div>
  ${o.shotNote ? `<div style="position:absolute;left:${(s.x || 848) - 44}px;top:${(s.y || 700) + 8}px;writing-mode:vertical-rl;
    font-family:${t.label};font-size:14px;letter-spacing:.26em;color:${t.faint};">${esc(o.shotNote)}</div>` : ""}`
    : "";

  return `
<div class="card" style="--x:0">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.date || "")}</span>
  </div>

  <div style="position:absolute;left:${M}px;top:${o.titleTop || 236}px;width:${o.titleW || 760}px;
    font-family:${t.head};font-weight:900;font-size:${o.titleSize || 172}px;line-height:.94;letter-spacing:-.045em;">
    ${titleHTML}
  </div>

  ${o.lead ? `<div style="position:absolute;left:${M}px;top:${o.leadTop || 820}px;width:${o.leadW || 700}px;
    font-family:${t.body};font-size:29px;line-height:1.80;color:${t.fg};opacity:.86;">${o.lead}</div>` : ""}

  <div style="position:absolute;left:${M}px;top:${(o.leadTop || 820) - 46}px;width:70px;height:5px;background:${t.accent};"></div>

  ${shot}

  ${o.stats ? `<div class="stats" style="position:absolute;left:${M}px;right:${M}px;bottom:${o.statsBottom || 168}px;
    border-top:1px solid ${t.line};padding-top:32px;">${o.stats}</div>` : ""}

  <div class="source" style="bottom:${o.sourceBottom || 88}px;">${esc(o.source || "")}</div>
</div>`;
}

/** 封面：深色舞台 */
function coverStage(o, t) {
  const titleLines = (o.title || []).map((ln) => `<div>${esc(ln)}</div>`).join("");
  const accentLine = o.accentLine
    ? `<div style="display:flex;align-items:baseline;gap:30px;margin-top:8px;">
         <div style="font-family:${t.head};font-weight:900;font-size:${o.accentSize || 138}px;line-height:1.0;letter-spacing:-.05em;
           background:linear-gradient(96deg,#F7DFA8,#E9B04F 62%,#C98A2E);-webkit-background-clip:text;background-clip:text;color:transparent;">${esc(o.accentLine)}</div>
         ${o.accentSide ? `<div style="font-family:${t.body};font-weight:300;font-size:31px;color:${t.muted};letter-spacing:.03em;padding-bottom:22px;">${esc(o.accentSide)}</div>` : ""}
       </div>`
    : "";

  const shot = o.shot
    ? `<div style="position:absolute;left:${o.shotX || 121}px;top:${o.shotTop || 592}px;width:${o.shotW || 1000}px;height:${o.shotH || 700}px;
        border-radius:16px;background:#fff;overflow:hidden;transform:rotate(-.7deg);
        box-shadow:0 0 0 1px rgba(255,255,255,.55),0 0 90px 18px rgba(240,198,116,.20),0 54px 110px rgba(0,0,0,.72);">
        <img src="${esc(o.shot.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
      </div>
      ${o.shotCaption ? `<div style="position:absolute;left:${(o.shotX || 121) + 5}px;top:${(o.shotTop || 592) + (o.shotH || 700) + 26}px;
        font-family:${t.label};font-size:18px;letter-spacing:.05em;color:${t.faint};">${esc(o.shotCaption)}</div>` : ""}`
    : "";

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div style="position:absolute;inset:0;background:radial-gradient(760px 520px at 50% -6%,rgba(240,198,116,.22),transparent 68%),
    radial-gradient(1100px 700px at 50% 108%,rgba(70,110,255,.14),transparent 70%);"></div>
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>

  <div class="kicker" style="top:92px;"><span>${esc(o.kicker || "")}</span><span class="r" style="font-family:${t.mono};">${esc(o.date || "")}</span></div>

  <div style="position:absolute;left:${M - 8}px;top:${o.titleTop || 186}px;width:1100px;font-family:${t.head};
    font-weight:900;font-size:${o.titleSize || 138}px;line-height:1.0;letter-spacing:-.05em;">
    ${titleLines}
    ${accentLine}
  </div>

  ${shot}

  ${o.statsHTML ? `<div style="position:absolute;left:${M - 8}px;right:${M - 8}px;bottom:106px;border-top:1px solid ${t.line};padding-top:32px;
    display:flex;justify-content:space-between;align-items:flex-end;">${o.statsHTML}</div>` : ""}
</div>`;
}

/** 内容卡：杂志编辑风（截图 + 编号要点） */
function contentEditorial(o, t) {
  const shotBlock = o.shot
    ? `<div style="position:absolute;left:${M}px;top:${o.shotTop || 470}px;width:${o.shotW || CW}px;height:${o.shotH || 480}px;
        background:#fff;overflow:hidden;border:1px solid ${t.hair};box-shadow:0 12px 34px rgba(22,21,15,.13);">
        <img src="${esc(o.shot.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
      </div>
      ${o.shotCaption ? `<div style="position:absolute;left:${M}px;top:${(o.shotTop || 470) + (o.shotH || 480) + 16}px;
        font-family:${t.label};font-size:16px;letter-spacing:.05em;color:${t.faint};">${esc(o.shotCaption)}</div>` : ""}`
    : "";

  const items = (o.items || [])
    .map(
      (it, i) => `
    <div style="display:flex;gap:26px;padding:${i === 0 ? "0 0 26px" : "26px 0"};${i < (o.items.length - 1) ? `border-bottom:1px solid ${t.hair};` : ""}">
      <div style="font-family:${t.serif};font-weight:900;font-size:30px;line-height:1.25;color:${t.accent};min-width:52px;">${esc(it.n)}</div>
      <div style="flex:1;">
        <div style="font-family:${t.head};font-weight:700;font-size:31px;line-height:1.35;letter-spacing:-.01em;">${esc(it.lead)}</div>
        ${it.desc ? `<div style="font-family:${t.body};font-size:22px;line-height:1.75;color:${t.muted};margin-top:8px;">${esc(it.desc)}</div>` : ""}
      </div>
    </div>`
    )
    .join("");

  const listTop = o.listTop || (o.shot ? (o.shotTop || 470) + (o.shotH || 480) + 78 : 700);

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.page || "")}</span>
  </div>

  ${o.eyebrow ? `<div style="position:absolute;left:${M}px;top:${o.headTop || 196}px;font-family:${t.label};font-weight:600;
    font-size:20px;letter-spacing:.26em;color:${t.accent};">${esc(o.eyebrow)}</div>` : ""}

  <div style="position:absolute;left:${M}px;top:${(o.headTop || 196) + 44}px;width:${o.titleW || CW}px;
    font-family:${t.head};font-weight:900;font-size:${o.titleSize || 74}px;line-height:1.14;letter-spacing:-.035em;">
    ${esc(o.title || "")}
  </div>

  ${o.sub ? `<div style="position:absolute;left:${M}px;top:${(o.headTop || 196) + 44 + (o.titleSize || 74) * 1.16 * (o.titleLines || 1) + 18}px;
    width:${o.subW || CW}px;font-family:${t.body};font-size:27px;line-height:1.7;color:${t.muted};">${o.sub}</div>` : ""}

  ${shotBlock}

  ${items ? `<div style="position:absolute;left:${M}px;top:${listTop}px;width:${CW}px;">${items}</div>` : ""}

  <div class="source" style="bottom:78px;">${esc(o.source || "")}</div>
</div>`;
}

/** 内容卡：手绘批注风（截图 + 红圈 + 箭头 + 批注） */
function contentNotebook(o, t) {
  const rot = o.rotate || -1.5;
  const shotTop = o.shotTop || 640;
  const shotH = o.shotH || 540;
  const ann = o.annotation || {};
  const circle = ann.circle
    ? `<ellipse cx="${ann.circle.cx}" cy="${ann.circle.cy}" rx="${ann.circle.rx}" ry="${ann.circle.ry}"
        stroke="${ann.color || t.accent}" stroke-width="3.6" fill="none" opacity=".82"
        transform="rotate(${ann.circle.rot || -6} ${ann.circle.cx} ${ann.circle.cy})"/>`
    : "";
  const arrow = ann.arrow
    ? `<path d="${ann.arrow.d}" stroke="${ann.color || t.ink}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".85"/>
       <path d="${ann.arrow.head}" stroke="${ann.color || t.ink}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".85"/>`
    : "";

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${(W - 250) / 2}px;top:-26px;width:250px;height:74px;background:rgba(226,196,120,.62);
    transform:rotate(-2.4deg);box-shadow:0 3px 10px rgba(0,0,0,.08);"></div>

  <div style="position:absolute;left:${M}px;top:150px;font-family:${t.label};font-size:34px;color:${t.muted};letter-spacing:.06em;">
    ${esc(o.eyebrow || "")}
  </div>

  <div style="position:absolute;left:${M}px;top:${o.titleTop || 206}px;width:${CW}px;font-family:${t.head};
    font-size:${o.titleSize || 118}px;line-height:1.26;letter-spacing:.01em;">
    ${(o.titleLines || [])
      .map((ln) =>
        ln.mark
          ? `<div><span style="padding:0 12px;color:${t.accent};background:linear-gradient(transparent 44%,rgba(255,214,64,.66) 44%,rgba(255,214,64,.66) 93%,transparent 93%);">${esc(ln.text)}</span></div>`
          : `<div>${esc(ln.text)}</div>`
      )
      .join("")}
  </div>

  ${o.sub ? `<div style="position:absolute;left:${M}px;top:${o.subTop || 560}px;width:${CW}px;font-family:${t.body};
    font-size:${o.subSize || 40}px;line-height:1.5;color:${t.fg};">${esc(o.sub)}</div>` : ""}

  ${o.shot ? `<div style="position:absolute;left:${o.shotX || 158}px;top:${shotTop}px;width:${o.shotW || 900}px;height:${shotH}px;
    background:#fff;transform:rotate(${rot}deg);padding:16px 16px 0;border:1px solid rgba(0,0,0,.07);
    box-shadow:0 18px 46px rgba(0,0,0,.22),0 2px 6px rgba(0,0,0,.10);">
    <img src="${esc(o.shot.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
  </div>` : ""}

  <svg style="position:absolute;left:0;top:0;pointer-events:none;" width="${W}" height="${H}">${circle}${arrow}</svg>

  ${ann.text ? `<div style="position:absolute;left:${ann.tx}px;top:${ann.ty}px;width:${ann.tw || 620}px;font-family:${t.body};
    font-size:${ann.size || 36}px;line-height:1.4;color:${t.ink};">${esc(ann.text)}</div>` : ""}

  <div style="position:absolute;left:${M}px;right:${M}px;bottom:96px;border-top:2px dashed ${t.line};padding-top:26px;
    display:flex;justify-content:space-between;font-family:${t.body};font-size:30px;color:${t.muted};">
    <span>${esc(o.footerL || "")}</span><span style="color:${t.accent};">${esc(o.footerR || "")}</span>
  </div>
</div>`;
}

/** 内容卡：仪器风 */
function contentInstrument(o, t) {
  const shotBlock = o.shot
    ? `<div style="position:absolute;left:${M}px;right:${M}px;top:${o.shotTop || 830}px;">
        <div style="display:flex;justify-content:space-between;font-family:${t.label};font-size:16px;
          letter-spacing:.14em;color:${t.muted};margin-bottom:14px;">
          <span>SOURCE ─ ${esc(o.shotUrl || "")}</span><span style="color:${t.accent};">● RAW</span>
        </div>
        <div style="position:relative;border:1px solid rgba(53,240,160,.42);padding:8px;background:rgba(53,240,160,.03);">
          <div style="position:absolute;left:-1px;top:-1px;width:16px;height:16px;border-left:2px solid ${t.accent};border-top:2px solid ${t.accent};"></div>
          <div style="position:absolute;right:-1px;top:-1px;width:16px;height:16px;border-right:2px solid ${t.accent};border-top:2px solid ${t.accent};"></div>
          <div style="position:absolute;left:-1px;bottom:-1px;width:16px;height:16px;border-left:2px solid ${t.accent};border-bottom:2px solid ${t.accent};"></div>
          <div style="position:absolute;right:-1px;bottom:-1px;width:16px;height:16px;border-right:2px solid ${t.accent};border-bottom:2px solid ${t.accent};"></div>
          <div style="height:${o.shotH || 400}px;overflow:hidden;">
            <img src="${esc(o.shot.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;filter:saturate(.92) contrast(1.04);">
          </div>
        </div>
      </div>`
    : "";

  const items = (o.items || [])
    .map(
      (it, i) => `<div style="display:flex;gap:22px;margin-top:${i === 0 ? 0 : 34}px;">
        <div style="font-family:${t.label};font-size:22px;color:${t.accent};min-width:64px;letter-spacing:.06em;">${esc(it.n)}</div>
        <div style="flex:1;">
          <div style="font-family:${t.head};font-weight:700;font-size:30px;line-height:1.34;">${esc(it.lead)}</div>
          ${it.desc ? `<div style="font-family:${t.body};font-weight:300;font-size:21px;line-height:1.72;color:${t.muted};margin-top:8px;">${esc(it.desc)}</div>` : ""}
        </div>
      </div>`
    )
    .join("");

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div style="position:absolute;inset:0;background:radial-gradient(900px 700px at 88% 8%,rgba(53,240,160,.10),transparent 62%);"></div>
  <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.045) 0 1px,transparent 1px 60px),
    repeating-linear-gradient(90deg,rgba(255,255,255,.045) 0 1px,transparent 1px 60px);"></div>

  <div style="position:absolute;left:56px;top:56px;width:44px;height:44px;border-left:1px solid rgba(53,240,160,.55);border-top:1px solid rgba(53,240,160,.55);"></div>
  <div style="position:absolute;right:56px;top:56px;width:44px;height:44px;border-right:1px solid rgba(53,240,160,.55);border-top:1px solid rgba(53,240,160,.55);"></div>
  <div style="position:absolute;left:56px;bottom:56px;width:44px;height:44px;border-left:1px solid rgba(53,240,160,.55);border-bottom:1px solid rgba(53,240,160,.55);"></div>
  <div style="position:absolute;right:56px;bottom:56px;width:44px;height:44px;border-right:1px solid rgba(53,240,160,.55);border-bottom:1px solid rgba(53,240,160,.55);"></div>

  <div style="position:absolute;left:${M}px;right:${M}px;top:104px;display:flex;justify-content:space-between;
    font-family:${t.label};font-size:17px;letter-spacing:.22em;color:${t.accent};">
    <span>◤ ${esc(o.kicker || "")}</span><span style="color:${t.muted};">${esc(o.page || "")}</span>
  </div>

  ${o.eyebrow ? `<div style="position:absolute;left:${M}px;top:${o.headTop || 250}px;font-family:${t.label};font-size:20px;
    letter-spacing:.3em;color:${t.muted};">// ${esc(o.eyebrow)}</div>` : ""}

  <div style="position:absolute;left:${M}px;top:${(o.headTop || 250) + 54}px;width:${CW}px;font-family:${t.head};
    font-weight:800;font-size:${o.titleSize || 92}px;line-height:1.1;letter-spacing:-.03em;">
    ${o.title || ""}
  </div>

  ${o.sub ? `<div style="position:absolute;left:${M}px;top:${o.subTop || 560}px;width:${CW}px;font-family:${t.body};
    font-weight:300;font-size:26px;line-height:1.65;color:${t.muted};">${o.sub}</div>` : ""}

  ${items ? `<div style="position:absolute;left:${M}px;top:${o.listTop || 690}px;width:${CW}px;">${items}</div>` : ""}

  ${shotBlock}
</div>`;
}

/** 对比卡：两张截图并排 + 结论色带（editorial） */
function compareEditorial(o, t) {
  const gap = 26;
  const w = (CW - gap) / 2;
  const [a, b] = o.shots || [];
  const box = (s, i) => `
    <div style="position:absolute;left:${M + i * (w + gap)}px;top:${o.shotTop || 340}px;width:${w}px;height:${o.shotH || 520}px;
      background:#fff;overflow:hidden;border:1px solid ${t.hair};box-shadow:0 12px 30px rgba(22,21,15,.12);">
      <img src="${esc(s.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
      ${s.caption ? `<div style="position:absolute;left:0;right:0;bottom:0;padding:14px 18px;background:linear-gradient(transparent,rgba(0,0,0,.62));">
        <span style="font-family:${t.label};font-size:16px;letter-spacing:.06em;color:#fff;">${esc(s.caption)}</span></div>` : ""}
    </div>`;

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.page || "")}</span>
  </div>

  <div style="position:absolute;left:${M}px;top:196px;width:${CW}px;font-family:${t.head};font-weight:900;
    font-size:${o.titleSize || 68}px;line-height:1.16;letter-spacing:-.03em;">${esc(o.title || "")}</div>

  ${box(a || {}, 0)}${box(b || {}, 1)}

  ${o.items ? `<div style="position:absolute;left:${M}px;top:${(o.shotTop || 340) + (o.shotH || 520) + 70}px;width:${CW}px;">
    ${(o.items || []).map((it, i) => `<div style="display:flex;gap:24px;padding:${i === 0 ? "0 0 22px" : "22px 0"};${i < o.items.length - 1 ? `border-bottom:1px solid ${t.hair};` : ""}">
      <div style="font-family:${t.serif};font-weight:900;font-size:26px;color:${t.accent};min-width:46px;">${esc(it.n)}</div>
      <div style="flex:1;font-family:${t.body};font-size:25px;line-height:1.68;">${esc(it.text)}</div>
    </div>`).join("")}
  </div>` : ""}

  ${o.quote ? `<div style="position:absolute;left:0;right:0;bottom:150px;background:rgba(179,52,30,.055);
    border-top:1px solid ${t.hair};border-bottom:1px solid ${t.hair};padding:44px ${M}px;">
    <div style="font-family:${t.body};font-size:${o.quoteSize || 34}px;line-height:1.62;color:${t.fg};">
      <span style="color:${t.accent};font-weight:900;margin-right:10px;">「</span>${esc(o.quote)}<span style="color:${t.accent};font-weight:900;margin-left:6px;">」</span>
    </div>
  </div>` : ""}

  <div class="source" style="bottom:78px;">${esc(o.source || "")}</div>
</div>`;
}

/** 目录卡：N 篇一行（editorial） */
function tocEditorial(o, t) {
  const rows = (o.rows || [])
    .map(
      (r, i) => `
    <div style="display:flex;align-items:baseline;gap:26px;padding:${i === 0 ? "0 0 30px" : "30px 0"};
      ${i < o.rows.length - 1 ? `border-bottom:1px solid ${t.hair};` : ""}">
      <div style="font-family:${t.serif};font-weight:900;font-size:27px;line-height:1.2;color:${t.accent};min-width:48px;letter-spacing:.02em;">${esc(r.n)}</div>
      <div style="flex:1;">
        <div style="display:flex;align-items:baseline;gap:16px;">
          <span style="font-family:${t.head};font-weight:700;font-size:30px;line-height:1.3;letter-spacing:-.01em;">${esc(r.en)}</span>
          ${r.cn ? `<span style="font-family:${t.body};font-size:23px;line-height:1.5;color:${t.muted};">${esc(r.cn)}</span>` : ""}
        </div>
      </div>
      ${r.likes ? `<div style="font-family:${t.label};font-size:17px;letter-spacing:.08em;color:${t.faint};">${esc(r.likes)}</div>` : ""}
    </div>`
    )
    .join("");

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.page || "")}</span>
  </div>

  <div style="position:absolute;left:${M}px;top:${o.titleTop || 190}px;width:${CW}px;font-family:${t.head};
    font-weight:900;font-size:${o.titleSize || 78}px;line-height:1.16;letter-spacing:-.035em;">${esc(o.title || "")}</div>

  ${o.sub ? `<div style="position:absolute;left:${M}px;top:${(o.titleTop || 190) + 110}px;width:${CW}px;
    font-family:${t.body};font-size:26px;line-height:1.7;color:${t.muted};">${o.sub}</div>` : ""}

  <div style="position:absolute;left:${M}px;top:${o.listTop || 470}px;width:${CW}px;">${rows}</div>

  ${o.punch ? `<div style="position:absolute;left:${M}px;top:${o.punchTop || 1258}px;width:${CW}px;
    border-left:3px solid ${t.accent};padding-left:26px;">
    <div style="font-family:${t.body};font-size:${o.punchSize || 30}px;line-height:1.72;color:${t.fg};">${o.punch}</div>
  </div>` : ""}

  ${o.note ? `<div style="position:absolute;left:${M}px;right:${M}px;bottom:${o.noteBottom || 150}px;border-top:1px solid ${t.hair};
    padding-top:22px;font-family:${t.body};font-size:21px;line-height:1.65;color:${t.muted};">${o.note}</div>` : ""}

  <div class="source" style="bottom:78px;">${esc(o.source || "")}</div>
</div>`;
}

/** 论文精华卡：arXiv 截图为证 + 关键数字 + 为什么值得看（editorial） */
function paperEditorial(o, t) {
  const s = o.shot || {};
  const numSize = (o.num || "").length <= 2 ? 76 : (o.num || "").length <= 4 ? 62 : 44;

  return `
<div class="card" style="background:${t.bg};color:${t.fg};font-family:${t.body};">
  <div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.page || "")}</span>
  </div>

  <div style="position:absolute;left:${M}px;top:${o.headTop || 186}px;width:${CW}px;">
    <div style="display:flex;align-items:baseline;gap:18px;font-family:${t.label};font-weight:600;font-size:20px;
      letter-spacing:.20em;color:${t.accent};">
      <span>${esc(o.no || "")}</span><span style="color:${t.faint};letter-spacing:.10em;">${esc(o.tag || "")}</span>
    </div>
    <div style="font-family:${t.head};font-weight:900;font-size:${o.titleSize || 72}px;line-height:1.16;
      letter-spacing:-.035em;margin-top:20px;">${o.title || ""}</div>
  </div>

  <div style="position:absolute;left:${M}px;top:${s.y || 450}px;width:${s.w || CW}px;height:${s.h || 430}px;
    background:#fff;overflow:hidden;border:1px solid ${t.hair};box-shadow:0 14px 38px rgba(22,21,15,.14);">
    <img src="${esc(s.src)}" style="width:100%;height:100%;object-fit:cover;object-position:left top;display:block;">
  </div>

  <div style="position:absolute;left:${M}px;top:${(s.y || 450) + (s.h || 430) + 14}px;width:${CW}px;
    font-family:${t.label};font-size:16px;letter-spacing:.04em;color:${t.faint};">${esc(o.caption || "")}</div>

  <div style="position:absolute;left:${M}px;right:${M}px;top:${o.numTop || 1000}px;display:flex;align-items:center;gap:34px;">
    <div style="font-family:${t.head};font-weight:900;font-size:${numSize}px;line-height:1;letter-spacing:-.03em;
      color:${t.accent};white-space:nowrap;">${esc(o.num || "")}</div>
    <div style="font-family:${t.body};font-size:23px;line-height:1.6;color:${t.muted};flex:1;">${esc(o.numLabel || "")}</div>
  </div>

  <div style="position:absolute;left:0;right:0;${o.bandTop != null ? `top:${o.bandTop}px;` : `bottom:${o.bandBottom || 96}px;`}background:rgba(179,52,30,.055);
    border-top:1px solid ${t.hair};border-bottom:1px solid ${t.hair};padding:34px ${M}px;">
    <div style="font-family:${t.label};font-weight:700;font-size:18px;letter-spacing:.22em;color:${t.accent};margin-bottom:12px;">为什么值得看</div>
    <div style="font-family:${t.body};font-size:29px;line-height:1.62;color:${t.fg};">${esc(o.why || "")}</div>
  </div>
</div>`;
}

/** 尾卡 */
function tail(o, t) {
  const isDark = o.dark;
  const dark = isDark
    ? `background:${t.bg};color:${t.fg};`
    : ``;
  return `
<div class="card" style="${dark}">
  ${isDark ? `<div style="position:absolute;inset:0;background:radial-gradient(760px 520px at 50% -6%,rgba(240,198,116,.20),transparent 68%);"></div><div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>` : `<div class="grain" style="opacity:${t.noise};mix-blend-mode:${t.noiseBlend};"></div>`}
  <div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;border-top:2px solid ${t.fg};padding-top:18px;
    display:flex;justify-content:space-between;font-family:${t.label};font-weight:500;font-size:19px;
    letter-spacing:.30em;color:${t.muted};text-transform:uppercase;">
    <span>${esc(o.kicker || "")}</span><span style="letter-spacing:.10em;">${esc(o.date || "")}</span>
  </div>

  <div style="position:absolute;left:${M}px;top:${o.top || 420}px;width:${CW}px;font-family:${t.head};
    font-weight:900;font-size:${o.size || 148}px;line-height:1.02;letter-spacing:-.045em;">
    ${(o.lines || []).map((ln) => `<div${ln.color ? ` style="color:${ln.color}"` : ""}>${esc(ln.text)}</div>`).join("")}
  </div>

  ${o.sub ? `<div style="position:absolute;left:${M}px;top:${(o.top || 420) + 460}px;width:${CW}px;
    font-family:${t.body};font-size:34px;line-height:1.7;color:${t.muted};">${o.sub}</div>` : ""}

  ${o.index ? `<div style="position:absolute;left:${M}px;right:${M}px;top:${o.indexTop || 1120}px;border-top:1px solid ${t.hair};padding-top:26px;
    display:flex;justify-content:space-between;font-family:${t.label};font-size:17px;letter-spacing:.24em;color:${t.faint};">
    ${o.index.map((x) => `<span>${esc(x)}</span>`).join("")}
  </div>` : ""}

  <div style="position:absolute;left:${M}px;right:${M}px;bottom:96px;border-top:1px solid ${t.line};padding-top:24px;
    font-family:${t.label};font-size:17px;letter-spacing:.05em;color:${t.faint};">${esc(o.source || "")}</div>
</div>`;
}

// ============================================================
// 构建
// ============================================================
function build(opts) {
  const themeName = opts.theme || "editorial";
  const t = THEMES[themeName];
  if (!t) throw new Error("未知主题: " + themeName);
  const cards = (opts.cards || []).join("\n");
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(opts.title || "cards")}</title>
<style>${baseCSS(t)}
body{display:flex;flex-direction:column;align-items:center;gap:0;}
</style></head><body>
${cards}
</body></html>`;
}

// 主题化组件工厂
function makeTheme(themeName) {
  const t = THEMES[themeName];
  return {
    theme: themeName,
    t,
    W, H, M, CW, F,
    cover(o) {
      if (themeName === "stage") return coverStage(o, t);
      if (themeName === "notebook") return coverEditorial(o, t);
      return coverEditorial(o, t);
    },
    content(o) {
      if (themeName === "notebook") return contentNotebook(o, t);
      if (themeName === "instrument") return contentInstrument(o, t);
      return contentEditorial(o, t);
    },
    compare(o) {
      return compareEditorial(o, t);
    },
    toc(o) {
      return tocEditorial(o, t);
    },
    paper(o) {
      return paperEditorial(o, t);
    },
    tail(o) {
      return tail(o, t);
    },
  };
}

module.exports = { build, makeTheme, THEMES, W, H, M, CW, F };
