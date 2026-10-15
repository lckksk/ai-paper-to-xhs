#!/usr/bin/env node
// xhs_auto_publish.js —— 小红书通用发布器（每日双发工作流核心件）
// 由 publish_v12（当场版）+ publish_v13（定时+AI声明版）合并泛化，2026-10-15 两版均实测成功
//
// 用法：
//   node xhs_auto_publish.js --dir "<成稿目录>" --mode immediate              # 当场发布
//   node xhs_auto_publish.js --dir "<成稿目录>" --mode schedule               # 定时 now+6h
//   node xhs_auto_publish.js --dir "<成稿目录>" --mode schedule --at "2026-10-16 20:30"
//   任意模式加 --dry 走完全流程但不点发布（验证用）；加 --no-declare 跳过AI声明（默认必带）
//
// 成稿目录约定（与 jiedu-lunwen skill 产出一致）：
//   正文.md  —— 含 ## 标题 / ## 正文 / ## 配图 三节；正文末尾的 #标签 行自动识别为话题
//   *.png    —— 卡片图；有「## 配图」清单按清单顺序，否则全部 png（封面卡优先）
//
// 退出码：0 成功 / 1 失败 / 2 发布结果不确定 / 3 定时安全线中止（绝不误发即时）
// 依赖：playwright-core + better-sqlite3（自动从 WorkBuddy 托管 workspace 解析，无需 NODE_PATH）
const { createRequire } = require('module');
const req2 = createRequire('C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/noop.js');
const { chromium } = req2('playwright-core');
const Database = req2('better-sqlite3');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const DB = 'C:/Users/Lenovo/.xhs-mcp/data.db';            // xhs-mcp 账号库（登录态来源）
const STATE_TMP = 'C:/Users/Lenovo/.xhs-mcp/state-live.json';

// ── 参数解析 ──
const args = process.argv.slice(2);
const getArg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const hasFlag = (k) => args.includes(k);
const DIR = getArg('--dir');
const MODE = getArg('--mode') || 'immediate';   // immediate | schedule
const AT = getArg('--at');                      // "YYYY-MM-DD HH:mm"，仅 schedule 用
const DRY = hasFlag('--dry');
const DECLARE = !hasFlag('--no-declare');
if (!DIR || !fs.existsSync(DIR)) { console.error('❌ --dir 成稿目录不存在'); process.exit(1); }
if (!['immediate', 'schedule'].includes(MODE)) { console.error('❌ --mode 只能是 immediate|schedule'); process.exit(1); }

// ── 定时时间：--at 优先，否则 now+6h ──
let SCHED_DATE = '', SCHED_TIME = '';
if (MODE === 'schedule') {
  let d;
  if (AT) {
    const m = AT.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/);
    if (!m) { console.error('❌ --at 格式须为 "YYYY-MM-DD HH:mm"'); process.exit(1); }
    d = new Date(AT.replace(' ', 'T') + ':00');
  } else {
    d = new Date(Date.now() + 6 * 3600 * 1000);
  }
  if (d.getTime() - Date.now() < 5 * 60 * 1000) { console.error('❌ 定时时间必须晚于当前 5 分钟以上'); process.exit(1); }
  const p = (n) => String(n).padStart(2, '0');
  SCHED_DATE = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  SCHED_TIME = `${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── 解析正文.md ──
const LOG_DIR = path.join(DIR, 'publish-logs');
fs.mkdirSync(LOG_DIR, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const T0 = Date.now();
const shot = (page, name) => page.screenshot({ path: `${LOG_DIR}/${MODE}-${name}.png` }).then(() => log('📸', name));

function parsePost(dir) {
  const md = fs.readFileSync(path.join(dir, '正文.md'), 'utf-8');
  const lines = md.split(/\r?\n/);
  const section = (name) => {
    const i = lines.findIndex(l => l.trim() === '## ' + name);
    if (i < 0) return [];
    const out = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^## /.test(lines[j])) break;
      out.push(lines[j]);
    }
    return out;
  };
  const title = section('标题').map(l => l.trim()).filter(Boolean)[0] || '';
  let bodyLines = section('正文');
  const tags = [];
  bodyLines = bodyLines.filter(l => {
    const t = l.trim();
    if (/^#[^\s#]+(\s+#[^\s#]+)*$/.test(t)) { t.split(/\s+/).forEach(x => tags.push(x.replace(/^#/, ''))); return false; }
    return true;
  });
  const body = bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  // 配图：按「## 配图」名字清单匹配文件（名字可能多个挤一行，按 / , 空格拆），缺省则全 png（封面卡优先 + 自然排序）
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g)$/i.test(f));
  let order = [];
  const imgNames = section('配图').flatMap(l => l.trim().split(/[/,，、\s]+/)).filter(Boolean);
  if (imgNames.length) {
    for (const n of imgNames) {
      const f = files.find(f => f.startsWith(n) || f.includes(n));
      if (f) order.push(f); else log('⚠️ 配图清单项未找到文件:', n);
    }
  }
  if (!order.length) {
    order = files.slice().sort((a, b) => (b.startsWith('封面') - a.startsWith('封面')) || a.localeCompare(b, 'zh', { numeric: true }));
  }
  if (!title || !body || !order.length) throw new Error(`解析失败: title=${!!title} body=${!!body} images=${order.length}`);
  return { title, body, tags, images: order.map(f => path.join(dir, f)) };
}

(async () => {
  const { title, body, tags, images } = parsePost(DIR);
  log(`成稿解析 ✓ 标题「${title}」${images.length}图 ${tags.length}话题 模式=${MODE}${DRY ? ' [DRY]' : ''}`);
  if (MODE === 'schedule') log(`定时目标: ${SCHED_DATE} ${SCHED_TIME}`);

  // ── 登录态：从 xhs-mcp 账号库实时导出 ──
  const db = new Database(DB, { readonly: true });
  const acct = db.prepare("SELECT name, state FROM accounts WHERE status='active' ORDER BY rowid DESC LIMIT 1").get();
  db.close();
  if (!acct || !acct.state) throw new Error('xhs-mcp 账号库中无有效登录态（先 xhs_add_account 扫码）');
  fs.writeFileSync(STATE_TMP, acct.state, 'utf-8');

  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState: STATE_TMP });
  const page = await ctx.newPage();
  await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  if (page.url().includes('login') || page.url().includes('passport')) throw new Error('登录态失效，需重新扫码');

  // 1. tab + 传图
  for (let t = 0; t < 20; t++) {
    const ok = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const el = [...document.querySelectorAll('div.creator-tab, span.title')].find(x => strip(x.textContent) === '上传图文');
      if (el) { el.click(); return true; } return false;
    });
    if (ok) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1500);
  await page.locator('.upload-input').first().setInputFiles(images);
  for (let t = 0; t < 30; t++) {
    await page.waitForTimeout(2000);
    const n = await page.evaluate(() => document.querySelectorAll('.img-preview-area .pr').length);
    if (n >= images.length) { log(`图片 ${n}/${images.length}`); break; }
    if (t === 29) throw new Error('图片上传超时');
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelectorAll('button.feature-guide__btn, button.feature-guide__close').forEach(b => b.click());
  });

  // 2. 标题 + 正文（Tiptap/ProseMirror）
  const titleOk = await page.evaluate((t) => {
    const el = document.querySelector('div.d-input input');
    if (!el) return false;
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, t); el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, title);
  log('标题:', titleOk);
  const ed = page.locator('div.tiptap, div.ProseMirror, [role="textbox"]').first();
  await ed.click();
  await page.keyboard.insertText(body);
  await page.waitForTimeout(1200);

  // 3. 话题
  for (const tag of tags) {
    await page.keyboard.type('#' + tag, { delay: 30 });
    await page.waitForTimeout(1200);
    const hit = await page.evaluate((tg) => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const items = [...document.querySelectorAll('#creator-editor-topic-container .item, [class*="topic"] li, [class*="topic"] [class*="item"]')];
      const el = items.find(e => strip(e.textContent).includes(tg) && e.getBoundingClientRect().height > 0);
      if (el) { el.click(); return true; } return false;
    }, tag);
    if (!hit) await page.keyboard.press('Space');
    log('话题', tag, hit ? '✓' : '✓空格');
    await page.waitForTimeout(600);
  }

  // 4. AI 内容类型声明（默认必带）
  if (DECLARE) {
    await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const row = [...document.querySelectorAll('*')].find(e => strip(e.textContent) === '添加内容类型声明' && e.children.length === 0 && e.getBoundingClientRect().height > 0);
      if (row) row.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(1200);
    let rect = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const leaf = [...document.querySelectorAll('*')].find(e => strip(e.textContent) === '添加内容类型声明' && e.children.length === 0 && e.getBoundingClientRect().height > 0);
      if (!leaf) return null;
      let t = leaf;
      while (t && t !== document.body) { const r = t.getBoundingClientRect(); if (r.width >= 150 && r.width <= 500) break; t = t.parentElement; }
      const r = t.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    log('声明行:', JSON.stringify(rect));
    if (!rect) throw new Error('声明行未找到');
    await page.mouse.click(rect.x, rect.y);
    await page.waitForTimeout(1800);
    rect = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const opt = [...document.querySelectorAll('span, div, li')].find(e => {
        const t = strip(e.textContent);
        return t === '笔记含AI合成内容' && e.children.length === 0 && e.getBoundingClientRect().height > 0;
      });
      if (!opt) return null;
      const r = opt.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!rect) { await shot(page, '4-no-option'); throw new Error('AI声明选项未出现'); }
    await page.mouse.click(rect.x, rect.y);
    await page.waitForTimeout(1200);
    const declared = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const sel = [...document.querySelectorAll('.d-select-placeholder, [class*="select"]')].find(e => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && /AI合成/.test(strip(e.textContent)) && strip(e.textContent).length < 40;
      });
      return sel ? strip(sel.textContent).slice(0, 30) : null;
    });
    log('声明已选:', declared);
    if (!declared) throw new Error('AI声明选择未生效');
  }

  // 5. 定时开关（唯一安全选择器 .post-time-switch-container .d-switch；页面第一个 custom-switch-wrapper 是原创声明，别碰）
  if (MODE === 'schedule') {
    await page.evaluate(() => {
      const el = document.querySelector('.post-time-switch-container .d-switch');
      if (el) el.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(1200);
    let rect = await page.evaluate(() => {
      const sw = document.querySelector('.post-time-switch-container .d-switch');
      if (!sw) return null;
      const r = sw.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, checked: !!sw.querySelector('input:checked') };
    });
    log('定时开关:', JSON.stringify(rect));
    if (!rect) throw new Error('定时开关未找到');
    if (!rect.checked) {
      await page.mouse.click(rect.x, rect.y);
      await page.waitForTimeout(2000);
    }
    const checked = await page.evaluate(() => {
      const sw = document.querySelector('.post-time-switch-container .d-switch');
      return !!sw && !!sw.querySelector('input:checked');
    });
    if (!checked) throw new Error('定时开关未能打开');

    // 6. 填时间：d-date-picker 单框带默认值（=当前时间），Ctrl+A 重打 + Enter
    await page.waitForTimeout(800);
    const dtBox = await page.evaluate(() => {
      const ins = [...document.querySelectorAll('input')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(e.value || '');
      }).map(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, v: e.value }; });
      return ins[0] || null;
    });
    log('定时输入框:', JSON.stringify(dtBox));
    if (!dtBox) { await shot(page, '6-no-inputs'); throw new Error('定时时间输入框未出现'); }
    await page.mouse.click(dtBox.x, dtBox.y);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    await page.keyboard.type(SCHED_DATE + ' ' + SCHED_TIME, { delay: 40 });
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await page.mouse.click(400, 700);
    await page.waitForTimeout(1000);
    const schedVal = await page.evaluate(() =>
      [...document.querySelectorAll('input')].map(e => (e.value || '')).filter(v => /^\d{4}-\d{2}-\d{2}/.test(v)));
    log('定时输入值:', JSON.stringify(schedVal));
    await shot(page, '6-schedule-filled');
    // ── 安全线：时间必须是目标值，否则中止绝不发布 ──
    const okTime = schedVal.some(v => v.includes(SCHED_DATE) && v.includes(SCHED_TIME));
    if (!okTime) {
      log('‼️ 定时时间未改成 ' + SCHED_TIME + '，中止（不会点发布）');
      await ctx.storageState({ path: STATE_TMP });
      await browser.close();
      process.exit(3);
    }
  } else if (DRY) {
    log('[DRY] immediate 模式验证到此为止');
  }

  if (DRY) {
    await shot(page, 'dry-final');
    log('✅ DRY 全流程通过（未点发布）');
    await ctx.storageState({ path: STATE_TMP });
    await browser.close();
    process.exit(0);
  }

  // 7. 点发布（发布按钮是 Shadow DOM 自定义元素 <xhs-publish-btn>，DOM 搜索无效，坐标兜底）
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const probe = await page.evaluate(() => {
    const e = document.elementFromPoint(951, 1050);
    if (!e) return null;
    let n = e, d = 0, txt = '';
    while (n && d < 8) { txt = (n.textContent || '').replace(/\s/g, '').slice(0, 10); if (txt) break; n = n.parentElement; d++; }
    return { tag: e.tagName, text: txt };
  });
  log('发布落点探测:', JSON.stringify(probe));
  if (!probe || !/发布|定时/.test(probe.text)) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1000);
  }
  await shot(page, '7-before-publish');
  await page.mouse.click(951, 1050);
  log('🖱️ 已点击发布' + (MODE === 'schedule' ? '（定时模式）' : ''));
  await page.waitForTimeout(3000);

  // 8. 确认结果
  let ok = false, finalUrl = '';
  for (let t = 0; t < 20; t++) {
    await page.waitForTimeout(1500);
    finalUrl = page.url();
    const html = await page.content().catch(() => '');
    if (/发布成功|定时发布成功|publish\/success|success/.test(html) || /success/.test(finalUrl)) { ok = true; break; }
  }
  await shot(page, '8-result');
  log(ok ? '✅ 发布成功' : '⚠️ 未捕获成功标志', 'URL=' + finalUrl);
  fs.writeFileSync(`${LOG_DIR}/result-${MODE}.txt`,
    `${ok ? 'OK' : 'UNCERTAIN'} mode=${MODE} sched=${SCHED_DATE + ' ' + SCHED_TIME} ${new Date().toISOString()} url=${finalUrl}`);
  await ctx.storageState({ path: STATE_TMP });
  await browser.close();
  process.exit(ok ? 0 : 2);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
