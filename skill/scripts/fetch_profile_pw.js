#!/usr/bin/env node
/**
 * WorkBuddy 适配版：抓取小红书账号主页（用户信息 + 第一页笔记 + 封面下载）
 *
 * 背景：2026-10 实测小红书已收紧匿名 SSR——curl/urllib 拿到的 __INITIAL_STATE__
 * 里 userPageData 为空，数据改由客户端签名 API 加载。本脚本用 Playwright 驱动
 * 真实 Chrome 渲染页面（自动带 x-s 签名），拦截 user_posted API 响应拿数据。
 *
 * 输出契约与原版 fetch_profile.py 一致：
 *   profile.json / notes_list.json / covers/cover1..N.jpg
 *
 * 用法:
 *   node fetch_profile_pw.js "<账号链接或user_id>" -o ./work/<账号名>/ [--account 账号名] [--state storageState.json]
 *
 * 登录态来源（二选一）:
 *   --state <storageState.json>   直接给 Playwright storageState 文件
 *   --account <名称>              从 xhs-mcp 数据库 C:/Users/Lenovo/.xhs-mcp/data.db 读（默认）
 *
 * 依赖: playwright-core + better-sqlite3（NODE_PATH 指向 WorkBuddy node workspace）
 *       Chrome: C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe
 * 注意: 会弹出可见浏览器窗口，运行期间不要动它；必须后台运行。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const MCP_DB = 'C:/Users/Lenovo/.xhs-mcp/data.db';

// 依赖解析：优先 NODE_PATH，找不到则用绝对路径兜底
function req(name) {
  try { return require(name); } catch (e) {
    return require('C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/' + name);
  }
}
const { chromium } = req('playwright-core');

function parseArgs(argv) {
  const args = { out: '.', account: 'Master的小红书' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--out') args.out = argv[++i];
    else if (a === '--account') args.account = argv[++i];
    else if (a === '--state') args.stateFile = argv[++i];
    else args.target = a;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.target) { console.error('用法: node fetch_profile_pw.js "<主页链接或user_id>" -o <输出目录>'); process.exit(2); }
  const log = (...a) => console.log('[pw]', ...a);

  // 1. 解析 user_id
  let userId = args.target.trim();
  const m = userId.match(/user\/profile\/([0-9a-fA-F]{24})/);
  if (userId.startsWith('http')) {
    if (!m) { console.error('[error] 链接中未找到 /user/profile/<24位id>: ' + userId); process.exit(2); }
    userId = m[1];
  } else if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    console.error('[error] 目标不是有效主页链接或 24 位 user_id: ' + userId); process.exit(2);
  }

  // 2. 登录态说明：主站会话绑定在持久化浏览器 pw-profile 上（首次运行会弹窗等扫码），
  //    --account/--state 参数保留兼容但主站抓取已不依赖账号库
  if (args.stateFile) log('提示: --state 已忽略（主站会话绑定持久化浏览器，不外灌 cookie）');

  // 3. 起浏览器（可见窗口 + 持久化配置目录：会话与设备指纹绑定，一次扫码长期复用）
  //    注意：不注入账号库 cookie——主站会校验设备指纹，注入外来会话必弹「设备登录超限」
  const out = path.resolve(args.out);
  fs.mkdirSync(path.join(out, 'covers'), { recursive: true });
  const userDataDir = 'C:/Users/Lenovo/.xhs-mcp/pw-profile';
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    executablePath: CHROME,
    headless: false,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();

  // 拦截 user_posted API 响应
  const apiNotes = [];
  let userInfoFromApi = null;
  page.on('response', async (resp) => {
    const url = resp.url();
    if (!/api\/sns\/web\/v\d+\/user_posted/.test(url)) return;
    try {
      const j = await resp.json();
      const d = j.data || {};
      if (Array.isArray(d.notes)) {
        for (const n of d.notes) {
          if (n.note_id) apiNotes.push(n);           // note_card 模式
          else if (n.notes) for (const x of n.notes) apiNotes.push(x); // 嵌套模式
        }
      }
      if (d.userInfo && !userInfoFromApi) userInfoFromApi = d.userInfo;
    } catch (e) { /* 忽略非 JSON */ }
  });

  log('打开主页 user/profile/' + userId);
  await page.goto('https://www.xiaohongshu.com/user/profile/' + userId,
    { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(4000);

  // 登录墙自愈：主站把会话绑在设备指纹上，未登录/被踢时弹登录墙（笔记模糊、API 不调）
  const walled = () => page.evaluate(() => {
    const t = document.body.innerText || '';
    return t.includes('登录超限') || t.includes('扫码登录') || t.includes('手机号登录');
  });
  if (await walled().catch(() => false)) {
    log('⌛ 主站登录墙：请在弹出的窗口里扫码登录（用小红书 App，5 分钟内有效）');
    let ok = false;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(5000);
      if (!(await walled().catch(() => true))) { ok = true; break; }
    }
    if (!ok) {
      await ctx.close();
      console.error('[error] 等待扫码超时（5 分钟）。重跑本脚本可重新弹出窗口。');
      process.exit(3);
    }
    log('✅ 扫码成功，刷新页面继续');
    await page.reload({ waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(4000);
  }

  // 4. DOM 提取用户信息（API 没给时的兜底）
  const domUser = await page.evaluate(() => {
    const t = (sel) => { const e = document.querySelector(sel); return e ? e.textContent.trim() : null; };
    // .user-info 文本形如「昵称 | 小红书号：xxx | IP属地：xx | 简介 | 53 | 关注 | 6 | 粉丝 | 26 | 获赞与收藏」
    let follows = null, fans = null, likeAndCollect = null, redId = null;
    const ui = document.querySelector('.user-info');
    if (ui) {
      const txt = ui.innerText || '';
      redId = (txt.match(/小红书号[：:]\s*(\S+)/) || [])[1] || null;
      const pick = (label) => { const m = txt.match(new RegExp('(\\d+)\\s*' + label)); return m ? +m[1] : null; };
      follows = pick('关注');
      fans = pick('粉丝');
      likeAndCollect = pick('获赞与收藏');
    }
    return {
      nickname: t('.user-nickname') || t('.user-name'),
      redId,
      desc: t('.user-desc'),
      fansText: fans,
      followsText: follows,
      likeCollectText: likeAndCollect,
    };
  }).catch(() => ({}));

  // 等笔记列表渲染 + API 响应（最长 25s，每 2s 轻滚动一次促加载）
  for (let i = 0; i < 12 && apiNotes.length === 0; i++) {
    await page.mouse.wheel(0, 300).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // DOM 兜底：API 拦截落空时直接从笔记卡提取（data-note-id + 标题 + 封面 + 互动数）
  // 反复提取直到数量不再增长（笔记卡是逐步渲染出 data-note-id 的）
  if (apiNotes.length === 0) {
    log('API 拦截为空，改用 DOM 提取');
    const extract = () => page.evaluate(() => {
      return [...document.querySelectorAll('section.note-item')].map((sec, i) => {
        const id = sec.getAttribute('data-note-id') || '';
        if (!id) return null;
        const a = sec.querySelector('a.cover') || sec.querySelector('a[href*="/explore/"]');
        const href = a ? a.getAttribute('href') || '' : '';
        const token = (href.match(/xsec_token=([^&]+)/) || [])[1] || null;
        const img = sec.querySelector('img');
        let cover = (img && (img.getAttribute('src') || '')) || '';
        if (cover.startsWith('//')) cover = 'https:' + cover;
        const title = sec.querySelector('a.title, .title, a[class*="title"]');
        const counts = [...sec.querySelectorAll('.count')]
          .map(e => e.textContent.trim()).filter(t => /^\d+(万|[\d,.]*)?$/.test(t));
        return {
          idx: i + 1, id, xsec_token: token, _fromDom: true,
          title: title ? title.textContent.trim() : null,
          type: sec.querySelector('[class*="play"]') ? 'video' : 'normal',
          likes: counts[0] ?? null, collects: counts[1] ?? null, comments: counts[2] ?? null,
          sticky: !!sec.querySelector('[class*="sticky"]'),
          cover_url: cover,
        };
      }).filter(Boolean);
    }).catch(() => []);
    let domNotes = [];
    for (let i = 0; i < 8; i++) {
      const cur = await extract();
      if (cur.length && cur.length >= domNotes.length) domNotes = cur;
      if (cur.length === domNotes.length && i > 2) break;  // 连续两轮不增长就收
      await page.waitForTimeout(2500);
    }
    if (domNotes.length) { apiNotes.push(...domNotes); log('DOM 提取到', domNotes.length, '篇'); }
  }

  // 5. 组装输出（契约与原版一致）
  const ui = userInfoFromApi || {};
  const profile = {
    user_id: userId,
    nickname: ui.nickname || domUser.nickname || null,
    red_id: ui.redId || domUser.redId || null,
    desc: ui.desc || domUser.desc || null,
    fans: ui.fans ?? domUser.fansText ?? null,
    follows: ui.follows ?? domUser.followsText ?? null,
    like_and_collect: ui.liked ?? ui.likeAndCollect ?? domUser.likeCollectText ?? null,
    collections: ui.collections || null,
    fetch_mode: 'playwright-rendered',
    fetched_at: new Date().toISOString(),
  };

  const num = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const s = String(v).trim();
    const wan = s.match(/^([\d.]+)万$/);
    return wan ? Math.round(parseFloat(wan[1]) * 10000) : (isNaN(+s) ? s : +s);
  };

  const notes = apiNotes.slice(0, 30).map((n, i) => {
    // DOM 兜底产物已带成品字段，直接透传
    if (n._fromDom) {
      const { _fromDom, ...rest } = n;
      return { ...rest, idx: i + 1, cover_file: 'covers/cover' + (i + 1) + '.jpg' };
    }
    const card = n.note_card || n;
    const interact = card.interact_info || {};
    const coverObj = card.cover || {};
    let cover = (coverObj.url_default || coverObj.url || (coverObj.info_list && coverObj.info_list[0] && coverObj.info_list[0].url) || '');
    if (cover.startsWith('//')) cover = 'https:' + cover;
    return {
      idx: i + 1,
      id: n.note_id || card.note_id,
      xsec_token: n.xsec_token || null,           // 深度拆解 fetch_note 直接可用！
      title: card.display_title || card.title || null,
      type: card.type || null,
      likes: num(interact.liked_count),
      collects: num(interact.collected_count),
      comments: num(interact.comment_count),
      sticky: !!card.is_sticky,
      cover_url: cover,
      cover_file: 'covers/cover' + (i + 1) + '.jpg',
    };
  });

  fs.writeFileSync(path.join(out, 'profile.json'), JSON.stringify(profile, null, 1), 'utf-8');
  fs.writeFileSync(path.join(out, 'notes_list.json'), JSON.stringify(notes, null, 1), 'utf-8');

  // 6. 下载封面（串行限速）
  for (const n of notes) {
    if (!n.cover_url) continue;
    try {
      const resp = await ctx.request.get(n.cover_url, { timeout: 25000 });
      if (resp.ok()) {
        fs.writeFileSync(path.join(out, n.cover_file), Buffer.from(await resp.body()));
      } else { log('封面下载失败 HTTP', resp.status(), n.cover_file); }
    } catch (e) { log('封面下载异常:', n.cover_file, e.message.slice(0, 60)); }
    await page.waitForTimeout(600); // 串行限速
  }

  // 7. 汇报
  console.log('[ok] ' + (profile.nickname || '(昵称未知)') + ' | 粉丝 ' + (profile.fans ?? '?') + ' | 赞藏 ' + (profile.like_and_collect ?? '?'));
  console.log('[ok] 笔记 ' + notes.length + ' 篇(第一页), 封面已存 ' + path.join(out, 'covers'));
  for (const n of notes) {
    console.log('  ' + n.idx + '. [' + (n.type || '?') + '] ' + (n.title || '(无题)') + '  赞' + n.likes + ' 藏' + n.collects + ' 评' + n.comments);
  }
  const tokened = notes.filter(n => n.xsec_token).length;
  if (tokened) console.log('[note] 其中 ' + tokened + ' 篇带 xsec_token，可直接深度拆解（fetch_note_pw.js）');

  await ctx.close();
  process.exit(notes.length ? 0 : 4);
}

main().catch(e => { console.error('[error]', e.message); process.exit(1); });
