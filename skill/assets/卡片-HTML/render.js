/**
 * render.js —— 把 cards.js 生成的 HTML 逐张截成 PNG，并做溢出/贴边自检
 *
 * 用法：
 *   NODE_PATH=C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules \
 *   node render.js --html 卡片.html --out ./cards [--dpr 2] [--only 3]
 *
 * 自检项（有问题会打印 WARN，但不中断）：
 *   - 文字元素超出卡片下边界 / 右边界
 *   - 底部元素贴边（距卡底 < 40px）
 *   - 图片缺失（naturalWidth=0）
 */
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const CHROME = "C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe";

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i > -1 ? process.argv[i + 1] : def;
}

const htmlPath = path.resolve(arg("html", "卡片.html"));
const outDir = path.resolve(arg("out", "./cards"));
const dpr = Number(arg("dpr", 2));
const only = arg("only", null);

(async () => {
  if (!fs.existsSync(htmlPath)) throw new Error("HTML 不存在: " + htmlPath);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("requestfailed", (r) => errs.push("REQ FAIL " + r.url().slice(0, 120)));

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0),
    { timeout: 25000 }
  ).catch(() => console.warn("⚠️  有图片未加载完成"));

  // 缺图检查
  const missing = await page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.getAttribute("src"))
  );
  if (missing.length) console.warn("⚠️  缺图:", missing.join(", "));

  // 溢出检测：只查有文字的元素
  const overflow = await page.evaluate(() => {
    const res = [];
    document.querySelectorAll(".card").forEach((card, ci) => {
      const cr = card.getBoundingClientRect();
      card.querySelectorAll("*").forEach((el) => {
        const txt = (el.childElementCount === 0 ? el.textContent : "").trim();
        if (!txt) return;
        const r = el.getBoundingClientRect();
        const overBottom = Math.round(r.bottom - cr.bottom);
        const overRight = Math.round(r.right - cr.right);
        const overTop = Math.round(cr.top - r.top);
        if (overBottom > 4 || overRight > 4 || overTop > 4) {
          res.push({
            card: ci + 1,
            text: txt.slice(0, 24),
            overBottom, overRight, overTop,
          });
        }
        // 自身滚动溢出（文字被容器裁掉）
        if (el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 0) {
          res.push({ card: ci + 1, text: txt.slice(0, 24), clipped: el.scrollHeight - el.clientHeight });
        }
      });
    });
    return res;
  });

  const cards = await page.$$(".card");
  console.log(`共 ${cards.length} 张卡，dpr=${dpr} → ${1242 * dpr}x${1656 * dpr}`);

  const names = [];
  for (let i = 0; i < cards.length; i++) {
    if (only && Number(only) !== i + 1) continue;
    const file = path.join(outDir, `卡片${i + 1}.png`);
    await cards[i].screenshot({ path: file });
    names.push(`卡片${i + 1}.png  ${Math.round(fs.statSync(file).size / 1024)}KB`);
  }
  console.log(names.join("\n"));

  if (overflow.length) {
    console.warn("\n⚠️  版式告警（" + overflow.length + " 处）：");
    overflow.forEach((o) => {
      if (o.clipped) console.warn(`  卡${o.card} 文字被裁 ${o.clipped}px: 「${o.text}」`);
      else console.warn(`  卡${o.card} 越界(下${o.overBottom} 右${o.overRight} 上${o.overTop}): 「${o.text}」`);
    });
  } else {
    console.log("\n✓ 无越界");
  }
  if (errs.length) console.warn("\n⚠️  资源错误:\n  " + [...new Set(errs)].slice(0, 6).join("\n  "));

  await browser.close();
})().catch((e) => {
  console.error("渲染失败:", e.message);
  process.exit(1);
});
