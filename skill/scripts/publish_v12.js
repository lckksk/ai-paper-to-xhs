// 发布脚本 v12：基于 v11 侦察修正
// 关键修正：①先关「图片可以编辑啦」弹窗 ②探测范围扩到视口底缘 y1000-1075 ③兜底真实坐标点击 ④AI声明先dump再选
const { chromium } = require('playwright-core');
const fs = require('fs');
const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const STATE = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data/mcp-xhs-state.json';
const OUT = 'C:/Users/Lenovo/WorkBuddy/2026-10-14-13-18-54/xhs_data';
const CARD_DIR = 'E:/自媒体运营/论文与博客解读/posts/2026-W42/2026-10-15-Player1-深度版';
const IMAGES = [1,2,3,4,5,6].map(n => `${CARD_DIR}/卡片${n}.png`);
const TITLE = 'AI 不看攻略了，自己打游戏练出来的';
const TAGS = ['人工智能', 'AI论文', '大模型', '游戏AI', 'AI智能体'];
const BODY = `小时候学游戏，看别人通关录像看一百遍，自己还是过不了关。

死上几十次，才会。

腾讯 ARC Lab 把这件事教给了 AI。

论文叫 Player-1，新加坡国立大学、腾讯 ARC Lab、南洋理工联合出品，10 月 14 日挂上 arXiv，代码开源。

先说结论：一个从没玩过《看门狗2》的 AI，进去就能走路、上车、开车。

它分三步学。

第一步，补操作。日常 AI 用鼠标是「点到某个位置」，打游戏不够用：镜头要转，按键要按住，还得边跑边跳边瞄准。论文给动作表补了三类：相对位移、长按、复合动作。

第二步，看录像。6,044 条人类游玩轨迹、29.5 万个操作回合，用视觉模型逐回合标注「这一步为什么这么按」，给 90 亿参数的模型打底。

第三步，自己练。真游戏没法自动判分，他们干脆造了 16 个合成小游戏，覆盖瞄准、战斗、驾驶、导航、界面操作五类，判分规则写死在程序里，画面和操控手感随机生成。AI 在里面用强化学习练了 200 轮。

成绩单：Minecraft 300 个任务，只看录像成功率 10.54%，自己练完 38.33%。同一套规则下测过的最强外部模型，只有 12.63%。

更值得看的是两件事。

一是换考场不拉胯。打枪游戏 ViZDoom 不在训练清单里，换过去直接打，35B 版成绩比最强外部基线高 83.7%。

二是它自己搓出了连招。复合操作占比从 64.7% 涨到 93.2%，没人教过它「边瞄准边射击」，练着练着就会了。

边界摆在明处：训练全在自己造的合成环境里，商业游戏只演示了《看门狗2》一个案例，没有成功率数字；外部模型是按统一协议测的，未必都在各自最优条件下。

这套配方的本质：看录像打底，合成环境练兵，真场景验收。

凡是结果能自动判对错的领域，都会被这样重做一遍。

判分器在哪里，AI 的练习场就在哪里。

来源：arXiv 2610.20584（新加坡国立 × 腾讯 ARC Lab × 南洋理工，2026-10-14 提交）`;
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);
const shot = (page, name) => page.screenshot({ path: `${OUT}/v12-${name}.png` }).then(() => log('📸', name));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, storageState: STATE });
  const page = await ctx.newPage();
  log('打开发布页');
  await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);
  if (page.url().includes('login') || page.url().includes('passport')) throw new Error('登录态失效');

  // ── 1. 上传图文 tab ──
  for (let t = 0; t < 20; t++) {
    const ok = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const el = [...document.querySelectorAll('div.creator-tab, span.title')].find(x => strip(x.textContent) === '上传图文');
      if (el) { el.click(); return true; } return false;
    });
    if (ok) break;
    await page.waitForTimeout(800);
  }
  log('tab 完成');
  await page.waitForTimeout(1500);

  // ── 2. 传图 ──
  await page.locator('.upload-input').first().setInputFiles(IMAGES);
  for (let t = 0; t < 30; t++) {
    await page.waitForTimeout(2000);
    const n = await page.evaluate(() => document.querySelectorAll('.img-preview-area .pr').length);
    if (n >= 6) { log(`图片上传完成 ${n}/6`); break; }
    if (t === 29) throw new Error('图片上传超时');
  }
  await page.waitForTimeout(2000);

  // ── 2.5 关「图片可以编辑啦」等功能弹窗 ──
  const dismissed = await page.evaluate(() => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    let hits = 0;
    for (const sel of ['button.feature-guide__btn', 'button.feature-guide__close']) {
      document.querySelectorAll(sel).forEach(b => { try { b.click(); hits++; } catch {} });
    }
    const btns = [...document.querySelectorAll('button, div[class*="btn"], span')].filter(e => {
      const t = strip(e.textContent);
      return /^(我知道了|知道了|关闭)$/.test(t) && e.getBoundingClientRect().height > 0;
    });
    btns.slice(0, 3).forEach(b => { try { b.click(); hits++; } catch {} });
    return hits;
  });
  log('关闭引导弹窗:', dismissed);
  await page.waitForTimeout(800);

  // ── 3. 标题 ──
  const titleOk = await page.evaluate((t) => {
    const el = document.querySelector('div.d-input input');
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, t);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, TITLE);
  log('标题:', titleOk);
  if (!titleOk) throw new Error('标题输入框未找到');
  await page.waitForTimeout(800);

  // ── 4. 正文（Tiptap）──
  const ed = page.locator('div.tiptap, div.ProseMirror, [role="textbox"]').first();
  await ed.click();
  await page.keyboard.insertText(BODY);
  await page.waitForTimeout(1500);
  log('正文已输入');

  // ── 5. AI 内容类型声明：先展开 dump 再选 ──
  const declared = await page.evaluate(() => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const row = [...document.querySelectorAll('div,span,section')].find(e => {
      const t = strip(e.textContent);
      return t.includes('添加内容类型声明') && t.length < 30 && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 60;
    });
    if (row) { row.click(); return true; } return false;
  });
  log('声明入口:', declared);
  if (declared) {
    await page.waitForTimeout(1500);
    const options = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      return [...document.querySelectorAll('label, li, [class*="radio"], [class*="option"], [class*="item"]')]
        .filter(e => { const t = strip(e.textContent); const r = e.getBoundingClientRect(); return t.length > 0 && t.length <= 20 && r.height > 0 && r.height < 60 && /AI|虚拟|演绎|生成/.test(t); })
        .map(e => ({ tag: e.tagName, cls: (e.className||'').toString().slice(0,40), text: strip(e.textContent).slice(0,20) }));
    });
    console.log('声明选项 dump:', JSON.stringify(options));
    const picked = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      const el = [...document.querySelectorAll('label, li, [class*="radio"], [class*="option"], [class*="item"], div, span')].find(e => {
        const t = strip(e.textContent);
        return t.length <= 25 && /AI/.test(t) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 60;
      });
      if (el) { el.click(); return strip(el.textContent).slice(0, 20); } return null;
    });
    log('AI 声明选项:', picked || '未选择（继续发布）');
    await shot(page, '5-declare');
    await page.waitForTimeout(800);
  }

  // ── 6. 话题 ──
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
  await shot(page, '6-form-done');

  // ── 7. 定位并点击「发布」──
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);

  // 7a. 主文档深搜（含 shadow root）
  let btn = await page.evaluate(() => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const collect = (root, acc) => {
      for (const e of root.querySelectorAll('*')) {
        if (e.shadowRoot) collect(e.shadowRoot, acc);
        if (e.children.length === 0) acc.push(e);
      }
      return acc;
    };
    const leaves = collect(document, []);
    const el = leaves.find(e => { const t = strip(e.textContent); return t === '发布' && e.getBoundingClientRect().width > 40; })
      || leaves.find(e => strip(e.textContent) === '发布');
    if (el) {
      let t = el;
      while (t && t.getBoundingClientRect().width < 60) t = t.parentElement;
      const r = (t || el).getBoundingClientRect();
      return { mode: 'dom', x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }
    return null;
  });
  log('DOM 深搜:', JSON.stringify(btn));

  // 7b. iframe 深搜
  if (!btn) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        const r = await frame.evaluate(() => {
          const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
          const el = [...document.querySelectorAll('*')].find(e => {
            const t = strip(e.textContent); return t === '发布' && e.children.length === 0 && e.getBoundingClientRect().width > 40;
          });
          if (el) { let t = el; while (t && t.getBoundingClientRect().width < 60) t = t.parentElement; const r = (t||el).getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; }
          return null;
        });
        if (r) { btn = { mode: 'iframe', ...r }; log('iframe 内找到:', frame.url().slice(0, 50)); break; }
      } catch {}
    }
  }

  // 7c. 坐标探测（扩到视口底缘）
  if (!btn) {
    btn = await page.evaluate(() => {
      const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
      for (let yy = 1070; yy >= 1000; yy -= 5) {
        for (let xx = 900; xx <= 1010; xx += 10) {
          const t0 = document.elementFromPoint(xx, yy);
          if (!t0) continue;
          let n = t0, depth = 0;
          while (n && depth < 8) {
            if (strip(n.textContent || '') === '发布') { const r = n.getBoundingClientRect(); return { mode: 'probe', x: r.x + r.width / 2, y: r.y + r.height / 2, at: `${xx},${yy}` }; }
            n = n.parentElement; depth++;
          }
        }
      }
      return null;
    });
    log('坐标探测:', JSON.stringify(btn));
  }

  // 7d. 最终兜底：截图实测坐标 (951, 1050)，先探测落点再真点
  if (!btn) {
    const probe = await page.evaluate(() => {
      const e = document.elementFromPoint(951, 1050);
      if (!e) return null;
      let n = e, d = 0, txt = '';
      while (n && d < 8) { txt = (n.textContent || '').replace(/\s/g, '').slice(0, 20); if (txt) break; n = n.parentElement; d++; }
      return { tag: e.tagName, cls: (e.className || '').toString().slice(0, 50), text: txt };
    });
    log('兜底落点探测:', JSON.stringify(probe));
    await shot(page, '7-before-blind');
    btn = { mode: 'blind', x: 951, y: 1050 };
  }

  log('🖱️ 点击发布:', JSON.stringify(btn));
  await page.mouse.click(btn.x, btn.y);
  await page.waitForTimeout(3000);

  // 7e. 处理可能的确认弹窗
  const modal = await page.evaluate(() => {
    const strip = (s) => (s || '').replace(/[\s\u200b-\u200f\u2028\u2029\u2060\ufeff]/g, '');
    const btns = [...document.querySelectorAll('button, [class*="btn"]')].filter(e => {
      const t = strip(e.textContent);
      return /^(确认发布|确认|继续发布|确定|发布)$/.test(t) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 70;
    });
    if (btns.length) { btns[0].click(); return strip(btns[0].textContent); }
    return null;
  });
  if (modal) { log('确认弹窗已点:', modal); await page.waitForTimeout(2500); }
  await shot(page, '8-after-click');

  // ── 8. 确认结果 ──
  let ok = false, finalUrl = '';
  for (let t = 0; t < 20; t++) {
    await page.waitForTimeout(1500);
    finalUrl = page.url();
    const html = await page.content().catch(() => '');
    if (/发布成功|发布完成|成功发布|publish\/success/.test(html) || /success/.test(finalUrl)) { ok = true; break; }
  }
  await shot(page, '9-result');
  log(ok ? '✅ 发布成功' : '⚠️ 未捕获成功标志', 'URL=' + finalUrl);
  fs.writeFileSync(`${OUT}/publish_result_v12.txt`, `${ok ? 'OK' : 'UNCERTAIN'} ${new Date().toISOString()} url=${finalUrl}`);
  await ctx.storageState({ path: STATE });
  await browser.close();
  process.exit(ok ? 0 : 2);
})().catch(e => { console.error('❌ 失败:', e.message); process.exit(1); });
