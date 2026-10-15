// v13：定时发布 + AI 声明版
// 目标：Reflex 定时 2026-10-15 20:43 发布（与 Player-1 14:43 间隔 6h）
// 安全线：定时时间没写入成功就中止，绝不即时发布
const { chromium } = require('playwright-core');
const fs = require('fs');
const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const STATE = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data/mcp-xhs-state.json';
const OUT = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data';
const CARD_DIR = 'E:/自媒体运营/论文与博客解读/posts/2026-W42/2026-10-14-Reflex-G1接箱子';
const IMAGES = [`${CARD_DIR}/封面卡.png`, `${CARD_DIR}/内容卡1-怎么学.png`, `${CARD_DIR}/内容卡2-成绩单.png`];
const TITLE = '机器人学会用眼睛接箱子';
const TAGS = ['人工智能', '机器人', '人形机器人', 'AI论文', '具身智能'];
const SCHED_DATE = '2026-10-15';
const SCHED_TIME = '20:43';
const BODY = `1 秒钟，你能接住一个飞过来的纸箱吗？宇树 G1 现在能：2.5 米外接住 65%，是人类水平（85%）的七成六。

新加坡国立、北卡教堂山和 AI2 的团队训练人形机器人接住人手扔的箱子。难点不在「接」，在三个条件捆在一起：全身协调、飞行时间只有一秒、视角是机器人自己头上的摄像头。以前的同类工作全靠动捕或外部相机标定物体，Reflex 第一次只靠机器人自己的 RGB-D 眼睛。

他们把难题拆成三级台阶。第一级，用强化学习学全身接箱动作，人类动作数据当参考。第二级，学预判：箱子快、画面有延迟，机器人得从迟到的残缺信息里推出箱子下一秒在哪。第三级才是视觉：从 RGB-D 画面直接恢复这种预判能力，控制部分冻结不动。

成绩单分两层。仿真里，纯视觉接箱 85.7%，跟开上帝视角的 87.9% 几乎打平。真机更诚实：2.5 米成功率 65%，5 米 40%，分别是人类的 76% 和 59%。补一刀：7 米外，人类受试者也只接住 28.3%。

最值得看的细节是消融实验：把视觉的时间历史删掉，成功率直接掉 35 到 40 个点。机器人接箱靠的不是「看到」，是「连起来看」。

这套能力还能串成完整流程：接住、抱走 7.8 米、递给人、再走回 7.3 米，四步累计成功率 25%。

边界：只做了接箱子一种任务，纸箱是普通物体里最简单的形态；真机成功率离人类还有距离。

这篇留下一句话：机器人要从被投喂的环境信息，走向用自己的眼睛看世界，预判比反应值钱。

来源：arXiv 2610.12772（NUS × UNC × AI2，2026-10-12 提交）`;
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);
const shot = (page, name) => page.screenshot({ path: `${OUT}/v13-${name}.png` }).then(() => log('📸', name));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState: STATE });
  const page = await ctx.newPage();
  await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  if (page.url().includes('login') || page.url().includes('passport')) throw new Error('登录态失效');

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
  await page.locator('.upload-input').first().setInputFiles(IMAGES);
  for (let t = 0; t < 30; t++) {
    await page.waitForTimeout(2000);
    const n = await page.evaluate(() => document.querySelectorAll('.img-preview-area .pr').length);
    if (n >= 3) { log(`图片 ${n}/3`); break; }
    if (t === 29) throw new Error('图片上传超时');
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelectorAll('button.feature-guide__btn, button.feature-guide__close').forEach(b => b.click());
  });

  // 2. 标题 + 正文
  const titleOk = await page.evaluate((t) => {
    const el = document.querySelector('div.d-input input');
    if (!el) return false;
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, t); el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, TITLE);
  log('标题:', titleOk);
  const ed = page.locator('div.tiptap, div.ProseMirror, [role="textbox"]').first();
  await ed.click();
  await page.keyboard.insertText(BODY);
  await page.waitForTimeout(1200);

  // 3. 话题
  for (const tag of TAGS) {
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

  // 4. AI 内容类型声明
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
  log('AI合成内容选项:', JSON.stringify(rect));
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
  await shot(page, '4-declared');
  if (!declared) throw new Error('AI声明选择未生效');

  // 5. 定时发布开关（唯一选择器）
  await page.evaluate(() => {
    const el = document.querySelector('.post-time-switch-container .d-switch');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(1200);
  rect = await page.evaluate(() => {
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
  log('定时开关已开:', checked);
  if (!checked) throw new Error('定时开关未能打开');

  // 6. 填日期和时间：d-date-picker 单框，默认值=当前时间，如 "2026-10-15 16:47"
  await page.waitForTimeout(800);
  let dtBox = await page.evaluate(() => {
    const ins = [...document.querySelectorAll('input')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.height > 0 && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(e.value || '');
    }).map(e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, v: e.value }; });
    return ins[0] || null;
  });
  log('定时输入框:', JSON.stringify(dtBox));
  if (!dtBox) { await shot(page, '6-no-inputs'); throw new Error('定时时间输入框未出现'); }
  // 点击输入框 → 全选 → 重打 → 回车
  await page.mouse.click(dtBox.x, dtBox.y);
  await page.waitForTimeout(1000);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(300);
  await page.keyboard.type(SCHED_DATE + ' ' + SCHED_TIME, { delay: 40 });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  // 点击别处收起弹层
  await page.mouse.click(400, 700);
  await page.waitForTimeout(1000);
  const schedVal = await page.evaluate(() => {
    return [...document.querySelectorAll('input')].map(e => (e.value || '')).filter(v => /^\d{4}-\d{2}-\d{2}/.test(v));
  });
  log('定时输入值:', JSON.stringify(schedVal));
  await shot(page, '6-schedule-filled');
  // ── 安全线：时间必须是 20:43 ──
  const okTime = schedVal.some(v => v.includes(SCHED_DATE) && v.includes(SCHED_TIME));
  if (!okTime) {
    log('‼️ 定时时间未改成 ' + SCHED_TIME + '，中止（不会点发布）');
    process.exit(3);
  }

  // 7. 点发布（坐标兜底法）
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
    // 可能页面滚动导致按钮不在原位，滚动到底再试
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1000);
  }
  await shot(page, '7-before-publish');
  await page.mouse.click(951, 1050);
  log('🖱️ 已点击发布（定时模式）');
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
  log(ok ? '✅ 定时发布成功' : '⚠️ 未捕获成功标志', 'URL=' + finalUrl);
  fs.writeFileSync(`${OUT}/publish_result_v13.txt`, `${ok ? 'OK' : 'UNCERTAIN'} ${new Date().toISOString()} url=${finalUrl}`);
  await ctx.storageState({ path: STATE });
  await browser.close();
  process.exit(ok ? 0 : 2);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
