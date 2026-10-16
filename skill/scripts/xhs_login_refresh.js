// login_refresh.js —— 刷新小红书登录态并写回 xhs-mcp 账号库
// 流程：带旧 state 打开创作中心 → 已登录则直接回写；未登录则弹二维码等扫码（5 分钟）→ 登录成功回写 DB
const { createRequire } = require('module');
const req2 = createRequire('C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/noop.js');
const { chromium } = req2('playwright-core');
const Database = req2('better-sqlite3');
const fs = require('fs');

const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const DB = 'C:/Users/Lenovo/.xhs-mcp/data.db';
const STATE_TMP = 'C:/Users/Lenovo/.xhs-mcp/state-live.json';
const QR_PNG = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data/xhs-login-qr.png';
const OUT = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data';
const ACCT = 'Master的小红书';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');

(async () => {
  const db = new Database(DB, { readonly: true });
  const acct = db.prepare("SELECT state FROM accounts WHERE name=? OR status='active' ORDER BY rowid DESC LIMIT 1").get(ACCT);
  db.close();
  if (!acct || !acct.state) throw new Error('账号库无状态可导出');
  fs.writeFileSync(STATE_TMP, acct.state, 'utf-8');

  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState: STATE_TMP });
  const page = await ctx.newPage();
  await page.goto('https://creator.xiaohongshu.com/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);

  const loggedIn = () => page.evaluate(() => {
    const t = document.body.innerText || '';
    return !/creator\.xiaohongshu\.com\/login|passport\.xiaohongshu\.com/.test(location.href) &&
           (t.includes('发布笔记') || t.includes('笔记管理') || t.includes('创作中心'));
  });

  if (await loggedIn()) {
    log('✅ 旧登录态其实有效，直接回写');
  } else {
    // 去登录页，切二维码登录
    await page.goto('https://creator.xiaohongshu.com/login', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    // 默认短信登录，64x64 img 是「切二维码」按钮
    await page.evaluate(() => {
      const img = [...document.querySelectorAll('img')].find(e => {
        const r = e.getBoundingClientRect();
        return r.width >= 50 && r.width <= 90 && r.height >= 50 && r.height <= 90;
      });
      if (img) img.click();
    }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: QR_PNG });
    log('📸 二维码已出:', QR_PNG, '——等待扫码（最多 5 分钟）');
    let ok = false;
    for (let t = 0; t < 100; t++) {
      await page.waitForTimeout(3000);
      if (await loggedIn().catch(() => false)) { ok = true; break; }
      if (t % 10 === 9) { // 每 30 秒刷新一次截图（二维码会轮换）
        await page.screenshot({ path: QR_PNG }).catch(() => {});
        log('📸 二维码已刷新');
      }
    }
    if (!ok) throw new Error('5 分钟内未完成扫码登录');
    log('✅ 扫码登录成功');
  }
  await page.waitForTimeout(2000);
  const state = await ctx.storageState();
  fs.writeFileSync(STATE_TMP, JSON.stringify(state), 'utf-8');
  // 写回账号库
  const w = new Database(DB);
  const info = w.prepare('UPDATE accounts SET state=?, status=? WHERE name=?').run(JSON.stringify(state), 'active', ACCT);
  if (info.changes === 0) w.prepare('INSERT INTO accounts (name, status, state) VALUES (?,?,?)').run(ACCT, 'active', JSON.stringify(state));
  w.close();
  log('✅ 新登录态已写回账号库（', ACCT, '）');
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
