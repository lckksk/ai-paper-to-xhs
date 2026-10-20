/**
 * fetch_shots.js —— 通用「真实网页截图」抓取器
 *
 * 用途：给小红书成稿准备真实素材，替代纯排版卡的空洞感。
 *       支持元素级截图、精确裁剪、首屏、全页、高清 2x、去弹窗、解锁 sticky。
 *
 * 用法：
 *   node fetch_shots.js --task task.json [--out <dir>] [--proxy http://127.0.0.1:7897]
 *   node fetch_shots.js --url <url> --out <dir> --name cover        # 最简：截首屏
 *
 * task.json 结构：
 * {
 *   "viewport": { "width": 1280, "height": 900 },
 *   "scale": 2,
 *   "proxy": "http://127.0.0.1:7897",
 *   "storageState": "C:/path/state.json",     // 可选，需要登录的站点
 *   "shots": [
 *     { "name": "arxiv-abs", "url": "https://arxiv.org/abs/2510.12345",
 *       "sel": "#abs", "pad": 18 },
 *     { "name": "hf-papers", "url": "https://huggingface.co/papers",
 *       "clip": { "x": 0, "y": 0, "width": 1280, "height": 1200 } },
 *     { "name": "gh-head", "url": "https://github.com/x/y",
 *       "sel": "main", "maxH": 900 },
 *     { "name": "page-top", "url": "https://example.com" }        // 默认首屏
 *   ]
 * }
 *
 * 每个 shot 可用字段：
 *   name      输出文件名（不含扩展名），必填
 *   url       页面地址，必填
 *   sel       CSS 选择器，截该元素（外扩 pad 像素）
 *   clip      {x,y,width,height} 页面坐标精确裁剪（优先于 sel）
 *   pad       sel 模式外扩像素，默认 0
 *   maxH      结果高度上限（px，按截图后 1x 逻辑像素算），超出从顶部截断
 *   fullPage  true 截整页
 *   wait      额外等待毫秒，默认 1200
 *   waitSel   等待该选择器可见后再截
 *   hide      [CSS 选择器]，注入 display:none（关弹窗/浮层/广告）
 *   unstick   false 则不解锁 fixed/sticky（默认 true，避免导航遮挡）
 *   scrollTo  先滚到该选择器再截
 *
 * 输出：<out>/<name>.png + <out>/shots.json（title / finalUrl / 尺寸 / 失败原因）
 */
const fs = require("fs");
const path = require("path");

const CHROME =
  process.env.SHOT_CHROME ||
  "C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe";

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    a[key] = v;
  }
  return a;
}

const args = parseArgs(process.argv);
if (!args.task && !args.url) {
  console.log("用法：node fetch_shots.js --task task.json --out <dir>");
  console.log("  或：node fetch_shots.js --url <url> --out <dir> --name cover");
  process.exit(64);
}

const OUT = path.resolve(args.out || "./shots");
fs.mkdirSync(OUT, { recursive: true });

let cfg = { viewport: { width: 1280, height: 900 }, scale: 2, shots: [] };
if (args.task) {
  cfg = Object.assign(cfg, JSON.parse(fs.readFileSync(args.task, "utf8")));
} else {
  cfg.shots = [
    { name: args.name || "shot", url: args.url, sel: args.sel, fullPage: !!args.full },
  ];
}
if (args.proxy) cfg.proxy = args.proxy;
if (!cfg.shots || !cfg.shots.length) {
  console.error("没有要截的 shot");
  process.exit(64);
}

// 注入式去噪：关掉常见 cookie/订阅弹窗 + 解锁 sticky 导航
const CSS_HIDE_COMMON = `
  [class*="cookie" i], [id*="cookie" i],
  [class*="consent" i], [id*="consent" i],
  [class*="gdpr" i],
  [class*="subscribe-popup" i], [class*="newsletter-popup" i],
  [class*="modal-backdrop" i],
  [class*="intercom" i], [id*="intercom" i],
  [class*="chat-widget" i], [id*="launcher" i]
`;
const CSS_UNSTICK = `
  * { --unstick-note: 1; }
  header, nav, [class*="navbar" i], [class*="topbar" i], [class*="toolbar" i], [class*="sticky" i], [class*="fixed" i] {
    position: static !important;
  }
`;

(async () => {
  const { chromium } = require("playwright-core");
  const launchOpts = { executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] };
  if (cfg.proxy) launchOpts.proxy = { server: cfg.proxy };

  const browser = await chromium.launch(launchOpts);
  const ctxOpts = {
    viewport: cfg.viewport,
    deviceScaleFactor: cfg.scale || 2,
    locale: "zh-CN",
  };
  if (cfg.storageState && fs.existsSync(cfg.storageState)) ctxOpts.storageState = cfg.storageState;
  const ctx = await browser.newContext(ctxOpts);

  const report = [];
  for (const shot of cfg.shots) {
    const rec = { name: shot.name, url: shot.url, ok: false };
    const page = await ctx.newPage();
    try {
      await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 60000 });
      // 触发懒加载：滚一遍到底再回顶
      await page.evaluate(async () => {
        await new Promise((res) => {
          let y = 0;
          const t = setInterval(() => {
            window.scrollBy(0, 700);
            y += 700;
            if (y >= document.body.scrollHeight) { clearInterval(t); res(); }
          }, 120);
        });
        window.scrollTo(0, 0);
      }).catch(() => {});
      await page.waitForTimeout(shot.wait || 1200);

      if (shot.hide || shot.unstick !== false) {
        let css = "";
        if (shot.hide) css += shot.hide.map((s) => `${s}{display:none !important;}`).join("\n");
        if (shot.unstick !== false) css += CSS_UNSTICK;
        css += CSS_HIDE_COMMON + "{display:none !important;}";
        await page.addStyleTag({ content: css }).catch(() => {});
        await page.waitForTimeout(300);
      }

      if (shot.scrollTo) {
        await page.locator(shot.scrollTo).first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
      if (shot.waitSel) {
        await page.waitForSelector(shot.waitSel, { state: "visible", timeout: 20000 }).catch(() => {});
      }

      rec.title = await page.title().catch(() => "");
      rec.finalUrl = page.url();

      // 等图片真正解码完（HF 这类站点懒加载图片占位会被截成空白块）
      await page.evaluate(() => {
        const pend = Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0);
        return Promise.race([
          Promise.all(pend.map((i) => new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
      }).catch(() => {});
      await page.waitForTimeout(400);

      const file = path.join(OUT, `${shot.name}.png`);
      const opts = { path: file, type: "png" };

      if (shot.clip) {
        const c = { ...shot.clip };
        const doc = await page.evaluate(() => ({
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
        }));
        c.width = Math.min(c.width, doc.w - c.x);
        c.height = Math.min(c.height, doc.h - c.y);
        if (shot.maxW) c.width = Math.min(c.width, shot.maxW);
        if (shot.maxH) c.height = Math.min(c.height, shot.maxH);
        opts.clip = c;
        rec.clip = c;
      } else if (shot.fullPage) {
        opts.fullPage = true;
      } else if (shot.sel) {
        const loc = page.locator(shot.sel).first();
        await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
        const box = await loc.boundingBox();
        if (!box) throw new Error(`选择器无 boundingBox: ${shot.sel}`);
        const pad = shot.pad || 0;
        let c = {
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad),
          width: box.width + pad * 2,
          height: box.height + pad * 2,
        };
        if (shot.maxW) c.width = Math.min(c.width, shot.maxW);
        if (shot.maxH) c.height = Math.min(c.height, shot.maxH);
        opts.clip = c;
        rec.clip = c;
      } else {
        // 默认：首屏（viewport 高度，可被 maxH 压）
        const h = Math.min(cfg.viewport.height, shot.maxH || cfg.viewport.height);
        opts.clip = { x: 0, y: 0, width: cfg.viewport.width, height: h };
        rec.clip = opts.clip;
      }

      await page.screenshot(opts);
      const st = fs.statSync(file);
      rec.ok = true;
      rec.file = file;
      rec.bytes = st.size;
      console.log(`✓ ${shot.name}.png  ${rec.clip ? `${rec.clip.width}x${rec.clip.height}@${cfg.scale}x` : "fullpage"}  ${(st.size / 1024).toFixed(0)}KB  ${rec.title.slice(0, 50)}`);
    } catch (e) {
      rec.error = e.message.slice(0, 200);
      console.log(`✗ ${shot.name}: ${rec.error}`);
    }
    report.push(rec);
    await page.close().catch(() => {});
  }

  fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify(report, null, 2), "utf8");
  await ctx.close();
  await browser.close();
  const ok = report.filter((r) => r.ok).length;
  console.log(`\n完成 ${ok}/${report.length} → ${OUT}`);
  if (!ok) process.exit(1);
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
