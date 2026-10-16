#!/usr/bin/env node
/**
 * WorkBuddy 适配版：抓取单条小红书笔记详情（正文 + 全部图片）。
 * 原版 fetch_note.py 依赖笔记级 xsec_token 的匿名 SSR，2026-10 实测 SSR 已收紧，
 * 本版用持久化浏览器渲染（会话绑定 pw-profile 设备指纹），URL 里带不带 token 都能抓。
 *
 * 输出契约与原版一致: meta.json / desc.md / img1..N.jpg
 *
 * 用法:
 *   node fetch_note_pw.js "<笔记链接(可带xsec_token)或note_id>" -o ./work/<账号名>/notes/<noteId>/
 *
 * 注意: 会弹可见窗口；若 pw-profile 未登录会等扫码（5 分钟）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';

function req(name) {
  try { return require(name); } catch (e) {
    return require('C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/' + name);
  }
}
const { chromium } = req('playwright-core');

async function main() {
  const argv = process.argv.slice(2);
  let target = null, out = '.';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-o' || argv[i] === '--out') out = argv[++i];
    else target = argv[i];
  }
  if (!target) { console.error('用法: node fetch_note_pw.js "<笔记链接或note_id>" -o <输出目录>'); process.exit(2); }
  const log = (...a) => console.log('[pw]', ...a);

  let url = target.trim();
  if (!url.startsWith('http')) url = 'https://www.xiaohongshu.com/explore/' + url;
  const noteId = (url.match(/\/explore\/([0-9a-f]{24})/) || [])[1];
  if (!noteId) { console.error('[error] 链接中未找到 24 位笔记 id'); process.exit(2); }

  fs.mkdirSync(path.resolve(out), { recursive: true });

  const ctx = await chromium.launchPersistentContext('C:/Users/Lenovo/.xhs-mcp/pw-profile', {
    executablePath: CHROME, headless: false, viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();
  log('打开笔记', noteId);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);

  const walled = () => page.evaluate(() => {
    const t = document.body.innerText || '';
    return t.includes('登录超限') || t.includes('扫码登录') || t.includes('手机号登录');
  });
  if (await walled().catch(() => false)) {
    log('⌛ 登录墙：请在弹出的窗口扫码（5 分钟内）');
    let ok = false;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(5000);
      if (!(await walled().catch(() => true))) { ok = true; break; }
    }
    if (!ok) { await ctx.close(); console.error('[error] 等待扫码超时'); process.exit(3); }
    await page.reload({ waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(4000);
  }

  const data = await page.evaluate(() => {
    const t = (sel) => { const e = document.querySelector(sel); return e ? e.textContent.trim() : null; };
    const tags = [...document.querySelectorAll('#detail-desc a.tag, .tag')].map(e => e.textContent.trim()).filter(x => x.startsWith('#'));
    const imgs = [...document.querySelectorAll('div.media-container img, .swiper-slide img, [class*="note-scroller"] img')]
      .map(i => i.getAttribute('src') || '').filter(s => s && !s.includes('avatar')).map(s => s.startsWith('//') ? 'https:' + s : s);
    return {
      title: t('#detail-title') || t('.title'),
      desc: t('#detail-desc') || t('.desc'),
      date: t('.bottom-container .date') || t('.date'),
      interact: {
        likes: (document.querySelector('.like-wrapper .count') || {}).textContent || null,
        collects: (document.querySelector('.collect-wrapper .count') || {}).textContent || null,
        comments: (document.querySelector('.chat-wrapper .count') || {}).textContent || null,
      },
      author: t('.username') || t('[class*="author"] .name'),
      tags, imgs,
    };
  });

  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({
    note_id: noteId, url,
    title: data.title, author: data.author, date: data.date,
    interact: data.interact, tags: data.tags, fetched_at: new Date().toISOString(),
  }, null, 1), 'utf-8');
  fs.writeFileSync(path.join(out, 'desc.md'),
    (data.title || '') + '\n\n' + (data.desc || '') + '\n\n' + data.tags.join(' '), 'utf-8');

  // 下载全部图片
  let n = 0;
  for (const u of [...new Set(data.imgs)].slice(0, 20)) {
    n++;
    try {
      const resp = await ctx.request.get(u, { timeout: 25000 });
      if (resp.ok()) fs.writeFileSync(path.join(out, 'img' + n + '.jpg'), Buffer.from(await resp.body()));
      else log('图片下载失败 HTTP', resp.status());
    } catch (e) { log('图片下载异常:', e.message.slice(0, 60)); }
    await page.waitForTimeout(600);
  }

  console.log('[ok] ' + (data.title || '(无题)'));
  console.log('[ok] 作者: ' + (data.author || '?') + ' | 日期: ' + (data.date || '?') + ' | 图: ' + n + ' 张');
  console.log('[ok] 正文 ' + (data.desc || '').length + ' 字, 已存 ' + path.resolve(out));

  await ctx.close();
  process.exit(data.desc ? 0 : 4);
}

main().catch(e => { console.error('[error]', e.message); process.exit(1); });
