// delete_agent_swe_v2.js —— 悬停卡片 dump 操作区，删除 AgentSWE 残篇
const { createRequire } = require('module');
const req2 = createRequire('C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/noop.js');
const { chromium } = req2('playwright-core');
const Database = req2('better-sqlite3');
const fs = require('fs');

const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const DB = 'C:/Users/Lenovo/.xhs-mcp/data.db';
const STATE_TMP = 'C:/Users/Lenovo/.xhs-mcp/state-live.json';
const OUT = 'E:/自媒体运营/论文与博客解读/posts/2026-W42/2026-10-16-AgentSWE/publish-logs';
const TARGET = 'AI造AI：演示90分，交付9.9分';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const shot = (page, name) => page.screenshot({ path: `${OUT}/del2-${name}.png` }).then(() => log('📸', name));

(async () => {
  const db = new Database(DB, { readonly: true });
  const acct = db.prepare("SELECT state FROM accounts WHERE name='Master的小红书'").get();
  db.close();
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState: JSON.parse(acct.state) });
  const page = await ctx.newPage();
  await page.goto('https://creator.xiaohongshu.com/new/note-manager', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);

  // 定位目标卡片容器（宽 > 300 的最近祖先）
  const rowInfo = await page.evaluate((TARGET) => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const leaf = [...document.querySelectorAll('*')].find(e =>
      strip(e.textContent).includes(strip(TARGET)) && e.children.length === 0 && e.getBoundingClientRect().height > 0);
    if (!leaf) return null;
    let c = leaf;
    while (c && c !== document.body) { const r = c.getBoundingClientRect(); if (r.width > 300 && r.height > 100) break; c = c.parentElement; }
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, TARGET);
  log('目标卡片:', JSON.stringify(rowInfo));
  if (!rowInfo) { await shot(page, '0-norow'); throw new Error('未找到目标卡片'); }

  // 悬停触发操作区
  await page.mouse.move(rowInfo.x, rowInfo.y);
  await page.waitForTimeout(1500);
  await page.mouse.move(rowInfo.x + 5, rowInfo.y + 5);
  await page.waitForTimeout(800);
  await shot(page, '1-hover');

  // dump 卡片容器内所有可见元素
  const dump = await page.evaluate((TARGET) => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const leaf = [...document.querySelectorAll('*')].find(e => strip(e.textContent).includes(strip(TARGET)) && e.children.length === 0);
    let c = leaf;
    while (c && c !== document.body) { const r = c.getBoundingClientRect(); if (r.width > 300 && r.height > 100) break; c = c.parentElement; }
    return [...c.querySelectorAll('*')].map(e => {
      const r = e.getBoundingClientRect();
      if (r.height === 0 || r.width === 0) return null;
      const t = strip(e.textContent);
      return { tag: e.tagName, cls: String(e.className).slice(0, 60), txt: t.slice(0, 20), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter(Boolean);
  }, TARGET);
  fs.writeFileSync(`${OUT}/hover-dump.json`, JSON.stringify(dump, null, 1));
  log('容器内元素已 dump（', dump.length, '个）');

  // 找「删除」入口：优先类名 note-card__action-btn--del（图标按钮无文本），其次文本匹配
  let del = dump.filter(e => /--del/.test(e.cls));
  log('删除入口(--del):', JSON.stringify(del));
  if (!del.length) {
    del = dump.filter(e => ['删除', '删除笔记'].includes(e.txt));
    log('删除入口(文本):', JSON.stringify(del));
  }

  if (!del.length) { await shot(page, '3-nodel'); throw new Error('悬停后仍未找到删除入口，看 hover-dump.json'); }
  await page.mouse.click(del[0].x, del[0].y);
  await page.waitForTimeout(1500);
  await shot(page, '4-confirm-dialog');

  // 确认弹窗
  const conf = await page.evaluate(() => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const btns = [...document.querySelectorAll('button, [class*="modal"] *, [class*="dialog"] *, [class*="btn"] *')].filter(e => {
      const t = strip(e.textContent);
      return ['确定', '确认', '删除'].includes(t) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().width < 300 && e.children.length === 0;
    });
    return btns.map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: strip(e.textContent) }; });
  });
  log('确认按钮:', JSON.stringify(conf));
  if (!conf.length) { await shot(page, '5-noconfirm'); throw new Error('未找到确认按钮'); }
  await page.mouse.click(conf[0].x, conf[0].y);
  await page.waitForTimeout(2500);
  await shot(page, '6-after');

  // 校验消失
  await page.reload({ waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(4000);
  const gone = await page.evaluate((TARGET) => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    return ![...document.querySelectorAll('*')].some(e => strip(e.textContent).includes(strip(TARGET)) && e.children.length === 0 && e.getBoundingClientRect().height > 0);
  }, TARGET);
  log(gone ? '✅ 目标笔记已删除' : '⚠️ 列表仍可见目标笔记');
  await shot(page, '7-verify');
  await ctx.storageState({ path: STATE_TMP });
  await browser.close();
  process.exit(gone ? 0 : 2);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
