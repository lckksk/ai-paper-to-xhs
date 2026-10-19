/* 《许愿式编程》84 秒 · 竖屏 1080×1440 · 无旁白、无配音，纯合成配乐 + 字幕
 * 分镜表见同目录 storyboard.md。
 * 一个世界：一块屏幕。镜头只推近、拉远，不换场。
 *
 * 事实（2026-10-17 DeepSeek 官方发布，已双源核实）：
 *   「许愿式编程」= 一句话描述需求，模型从零生成完整可运行的工程（故宫 3D / 赛车游戏 / 传送门复刻）；
 *   训练用自反馈强化学习（self-feedback RL），奖励信号从"下一个词是否合理"变成"整个项目能否运行"。
 * 示意（片尾小字写明）：代码与报错内容为示意；错误数 5→3→1→0 为示意的修复轮次；
 *   「词级得分 99 / 跑通得分 0→100」是示意，用来说明两种奖励尺子的区别，不是任何具体模型的分数。
 *   官方演示画面来自 DeepSeek 官方发布。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit, P = K.PAL.night;

/* ---------- 素材：官方演示画面（画在底层，不参加辉光，保持真实） ---------- */
const SRC = { car: 'assets/art-03-480.png', palace: 'assets/art-02-480.png', portal: 'assets/art-04-480.png' };
const IMG = {};
window.__assetsReady = Promise.all(Object.keys(SRC).map(k => new Promise(res => {
  const im = new Image(); im.onload = im.onerror = () => { IMG[k] = im; res(); }; im.src = SRC[k];
})));

/* ---------- 时间表：挪动时只改这里 ---------- */
const T = {
  type0: .85, type1: 2.3, files: 2.5, play: 4.2, press: 4.95, win: 5.35,
  s1: 8.9, lit: 9.55, pull: 15.5, reds: 18.3,
  s2: 22.15, run1: 23.55, err1: 23.95, fix1: 26.95, run2: 28.6, err2: 28.95,
  fix2: 31.15, run3: 32.5, err3: 32.85, fix3: 34.55, run4: 35.7, ok: 36.1,
  s3: 39.3, ring0: 39.9, spin: 41.2, pillars: 47.7,
  s4: 54.35, p1: 54.7, p2: 58.9, p3: 63.1,
  outro: 68.2, flash: 76.6,
  end: 84,
};

/* ---------- 字幕：一句一行，和分镜表对着写；{词} 金，{!词} 玫红 ---------- */
const SUBS = [
  { a: .8,  b: 4.7,  zh: '它现在，凭一句话，就能搭出一整个{能跑}的程序。', en: 'One sentence in. A whole program out.' },
  { a: 5.1, b: 8.5,  zh: '不是一段代码，是整个项目。', en: 'Not a snippet — the whole project.' },
  { a: 9.2, b: 13.0, zh: '以前的训练，只教它一件事：{下一个词}，猜得准不准。', en: 'Training used to teach one thing: guess the next word.' },
  { a: 13.4, b: 17.4, zh: '每一个词，都打上了对勾。', en: 'Every word gets a tick.' },
  { a: 17.8, b: 21.5, zh: '可合起来——程序{!跑不起来}。', en: 'Put together, it does not run.' },
  { a: 22.3, b: 26.2, zh: '现在，它写完，先自己{跑一遍}。', en: 'Now it runs the thing before it answers.' },
  { a: 26.6, b: 30.7, zh: '一屏红字，错在哪，写得清清楚楚。', en: 'A screen of red: every mistake spelled out.' },
  { a: 31.1, b: 35.2, zh: '它把错捡回去，改一行，再跑。', en: 'It picks the error up, fixes a line, runs again.' },
  { a: 35.6, b: 38.9, zh: '红字，越来越少。', en: 'Less red, every time.' },
  { a: 39.9, b: 43.9, zh: '这个循环，就是{强化学习}。', en: 'That loop is reinforcement learning.' },
  { a: 44.3, b: 48.4, zh: '奖励不再是"像不像答案"，是"{!跑不跑得起来}"。', en: 'Not "does it look right" — "does it run".' },
  { a: 48.8, b: 52.6, zh: '一个词猜对，不算数；整个项目跑通，才算。', en: 'One right word proves nothing. A running project does.' },
  { a: 54.6, b: 58.5, zh: '于是一句话，一个赛车游戏。', en: 'So: one sentence, one racing game.' },
  { a: 58.9, b: 62.8, zh: '一句话，一座故宫。', en: 'One sentence, one palace.' },
  { a: 63.2, b: 66.9, zh: '一句话，一个能走进去的传送门。', en: 'One sentence, a portal you can walk into.' },
  { a: 68.8, b: 72.4, zh: '它不是在猜你想说什么，', en: 'It is not guessing what you meant.' },
  { a: 72.8, b: 76.2, zh: '它是在把东西{做出来}。', en: 'It is making the thing.' },
];
const MARKS = [
  { t: .35, no: '00', zh: '许', en: 'THE WISH' }, { t: T.s1, no: '01', zh: '猜', en: 'THE GUESS' },
  { t: T.s2, no: '02', zh: '跑', en: 'THE RUN' }, { t: T.s3, no: '03', zh: '环', en: 'THE LOOP' },
  { t: T.s4, no: '04', zh: '成', en: 'THE MAKING' },
];
const INK = '#F8F9F8', DIM = '#879399', RED = '#E84B75', ICE = '#64E3F6', GOLD = '#F8D893';

/* ========== 通用小件 ========== */

/* 一个窗口：暗底 + 标题栏 + 三个圆点 */
function windowBox(fr, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= .004 || w <= 2) return;
  const r = Math.min(o.r == null ? 20 : o.r, w / 2, h / 2);
  fr.rect(x, y, w, h, { r, fill: rgba('#070B12', .88 * a), color: o.edge || '#33465C', w: 1.6, a });
  if (o.bar !== false && h > 60) {
    fr.g({ a }, () => {
      fr.rect(x + 1.5, y + 1.5, w - 3, 44, { r: [r, r, 2, 2], fill: rgba('#101A27', .92) });
      [RED, GOLD, ICE].forEach((c, i) => fr.circle(x + 30 + i * 24, y + 23, 5.5, { fill: c, a: .7 }));
      if (o.title) fr.text(o.title, x + 104, y + 24, { font: 'mono', size: 16, color: '#6E8090', align: 'l', a: .95 });
    });
  }
}

/* 一小段横线（代码的笔画） */
function hline(fr, x, y, w, o = {}) {
  if (w <= 0) return;
  fr.line(x, y, x + w, y, { color: o.color || '#4B5E71', w: o.w || 1.1, a: o.a == null ? .8 : o.a, cap: 'round' });
}

/* ✓ ✕ */
function tick(fr, x, y, s, a, color = ICE) {
  if (a <= .004) return;
  fr.poly([[x - s * .5, y + s * .02], [x - s * .12, y + s * .42], [x + s * .55, y - s * .46]], { color, w: Math.max(1.6, s * .16), a, cap: 'round', glow: 8, glowA: .35 });
}
function cross(fr, x, y, s, a, color = RED) {
  if (a <= .004) return;
  const w = Math.max(1.6, s * .16);
  fr.line(x - s * .42, y - s * .42, x + s * .42, y + s * .42, { color, w, a, cap: 'round', glow: 8, glowA: .3 });
  fr.line(x + s * .42, y - s * .42, x - s * .42, y + s * .42, { color, w, a, cap: 'round', glow: 8, glowA: .3 });
}

/* 播放键 */
function playBtn(fr, cx, cy, r, a, k = 1) {
  if (a <= .004) return;
  fr.circle(cx, cy, r * k, { fill: rgba('#0B1520', .85 * a), color: mix('#2C3D50', ICE, .6), w: 2.2, a: a * .95, glow: 16, glowA: .3 });
  const s = r * .42 * k;
  fr.poly([[cx - s * .55, cy - s], [cx - s * .55, cy + s], [cx + s * .95, cy]], { fill: rgba(ICE, a * .95), close: true });
}

/* 一枚文件 */
function fileIcon(fr, cx, cy, w, h, label, a, k = 1) {
  if (a <= .004 || k <= .01) return;
  const hw = w / 2 * k, hh = h / 2 * k;
  fr.g({ at: [cx, cy], s: k, a }, () => {
    fr.rect(-hw, -hh, w, h, { r: 10, fill: rgba('#0C1724', .94), color: '#40566E', w: 1.6, glow: 8, glowA: .18 });
    fr.rect(-hw + 10, -hh + 14, w * .42, 5, { r: 2.5, fill: rgba(ICE, .42) });
    fr.rect(-hw + 10, -hh + 30, w * .62, 4, { r: 2, fill: rgba('#7E93A8', .32) });
    fr.rect(-hw + 10, -hh + 44, w * .48, 4, { r: 2, fill: rgba('#7E93A8', .24) });
  });
  fr.text(label, cx, cy + h / 2 * k + 27, { font: 'mono', size: 17, color: DIM, a: a * ss(k, .6, 1) });
}

/* 把官方演示画面放进板子里（画在底层：不吃辉光，颜色保住） */
function shotPlate(fr, key, x, y, w, h, a, zoom = 1) {
  const im = IMG[key]; if (!im || !im.width || a <= .004) return;
  const c2 = fr.x; c2.save(); c2.globalAlpha = clamp(a);
  c2.beginPath(); c2.roundRect(x, y, w, h, 16); c2.clip();
  c2.fillStyle = '#05080D'; c2.fillRect(x, y, w, h);
  const sc = Math.max(w / im.width, h / im.height) * zoom;
  const dw = im.width * sc, dh = im.height * sc;
  c2.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  c2.restore();
}

/* ========== 镜 1 · 许愿（0.35–8.6）==========
 * 这是什么：一个输入框。它在干什么：一句话写进去，长出一个项目，然后跑起来。 */
const TYPED = '做一个能开的赛车游戏';
function m1(fr, t) {
  if (t > 8.65) return;
  const out = 1 - ss(t, 8.05, 8.6);

  /* 输入框 + 打字 */
  const ia = ss(t, .5, .95) * out * (1 - ss(t, 5.1, 5.55)), boxY = 216, boxH = 104;
  const n = Math.floor(clamp((t - T.type0) / (T.type1 - T.type0)) * TYPED.length + 1e-6);
  if (ia > 0) {
    const w = lerp(140, 880, E.out3(ss(t, .5, 1.15)));
    fr.rect(W / 2 - w / 2, boxY, w, boxH, { r: 16, fill: rgba('#080E17', .9 * ia), color: rgba('#3B5170', ia), w: 1.8, glow: 18, glowA: .16 * ia });
    fr.text('›', W / 2 - w / 2 + 40, boxY + boxH / 2 + 2, { font: 'mono', size: 38, color: rgba(ICE, .8 * ia), glow: 12, glowA: .4 });
    const s = TYPED.slice(0, n);
    if (s) fr.text(s, W / 2 - w / 2 + 70, boxY + boxH / 2 + 2, { font: 'serifr', size: 40, track: 3, color: rgba(INK, ia), align: 'l', glow: 9, glowA: .2 });
    const cw = fr.measure(s, { font: 'serifr', size: 40, track: 3 });
    if (t < T.type1 + .5 || Math.floor(t * 3) % 2 === 0) fr.rect(W / 2 - w / 2 + 74 + cw, boxY + 30, 2.6, 46, { fill: rgba(ICE, .85 * ia) });
  }
  if (t > T.type0 && t < T.type1 + .1) for (let i = 0; i < n; i++) fr.sfx(T.type0 + i * (.95 / TYPED.length), 'tick', { pitch: i % 5, gain: .32 });

  /* 三个文件：从输入框分叉长出来 */
  const filesGone = 1 - ss(t, 4.95, 5.5);
  if (t > T.files && filesGone > .01) {
    const FY = [['index', 268], ['style', 540], ['game', 812]], fy = 520;
    fr.g({ a: filesGone }, () => {
      FY.forEach(([nm, fx], i) => {
        const k = E.outBack(seg(t, T.files + i * .22, T.files + i * .22 + .5), 1.7);
        if (k <= 0) return;
        const mx = lerp(W / 2, fx, .55), my = lerp(boxY + boxH, fy - 58, .55);
        fr.line(W / 2, boxY + boxH, mx, my, { color: rgba('#3E5A75', .45), w: 1.4, cap: 'butt' });
        fr.line(mx, my, fx, fy - 58, { color: rgba('#3E5A75', .45), w: 1.4, cap: 'butt' });
        fileIcon(fr, fx, fy, 92, 112, nm, .95, k);
        fr.sfx(T.files + i * .22 + .1, 'tock', { pitch: 2 + i, gain: .45 });
      });
    });
  }

  /* 播放键 */
  const pOn = ss(t, T.play, T.play + .45);
  if (pOn > .01) {
    const pr = .94 + .06 * E.outBack(seg(t, T.press, T.press + .22));
    fr.g({ a: pOn * (1 - ss(t, 5.35, 5.9)) }, () => {
      fr.glow(W / 2, 752, 160, ICE, .14 * pOn);
      playBtn(fr, W / 2, 752, 42, .95, pr);
      const rp = seg(t, T.press, T.press + .95);
      if (rp > 0 && rp < 1) fr.circle(W / 2, 752, 42 + 200 * E.out3(rp), { color: ICE, w: 2, a: (1 - rp) * .75 });
    });
    if (t > T.press) fr.sfx(T.press, 'chord', { root: 2, gain: .5 });
  }

  /* 窗口张开 → 赛车跑起来 */
  const wk = E.out3(ss(t, T.win, T.win + .85));
  if (t > T.win) {
    const ww = lerp(160, 1020, wk), wh = ww * 9 / 16, wx = W / 2 - ww / 2, wy = 380 + (574 - wh) / 2;
    const shine = ss(t, T.win + .45, T.win + 1.1);
    if (shine > .01) fr.look.under = c2 => shotPlate(fr, 'car', wx + 2, wy + 46, ww - 4, wh - 48, shine * out, 1 + .04 * ss(t, T.win, 8.6));
    windowBox(fr, wx, wy, ww, wh, { a: out, title: wk > .85 ? 'game · 运行中' : '', r: 18 });
    if (shine > 0) fr.rect(wx, wy, ww, wh, { r: 18, color: rgba(ICE, .3 * shine * out), w: 1.8, glow: 24, glowA: .2 * shine });
    if (t > T.win + .45) fr.sfx(T.win + .5, 'bloom', { gain: .45 });
    const ca = ss(t, T.win + .9, T.win + 1.5) * out;
    fr.text('一句话 · 一个项目 · 真的能跑', W / 2, 1032, { font: 'serifr', size: 30, track: 9, color: rgba(DIM, .82 * ca) });
    if (ca > 0) {
      const pk = ss(t, T.win + 1.0, T.win + 2.4);
      fr.rect(190, 1092, 700, 5, { r: 3, fill: rgba('#1E2C3A', .9) });
      fr.rect(190, 1092, 700 * pk, 5, { r: 3, fill: rgba(ICE, .55 * ca) });
      fr.text(['已生成 3 个文件', '已生成 3 个文件 · 依赖就绪', '已生成 3 个文件 · 依赖就绪 · 运行中'][pk < .34 ? 0 : pk < .7 ? 1 : 2], 190, 1130, { font: 'mono', size: 15, track: 2, color: rgba('#5E7183', .85 * ca), align: 'l' });
    }
  }
}

/* ========== 镜 2 · 猜（8.9–21.9）==========
 * 这是什么：一句话被一个字一个字认出来。它在干什么：每个字都对，程序跑不起来。 */
const LINES = ['故宫是一座皇城，', '屋顶金黄，墙是红的，', '门上有九排钉子。'];
const LN = LINES.map(x => Array.from(x).length), ST = .152;
const OFFS = LN.reduce((a, n, i) => (a.push(i ? a[i - 1] + LN[i - 1] : 0), a), []);
const litAt = i => T.lit + i * ST;
function m2(fr, t) {
  if (t < T.s1) return;
  const out = 1 - ss(t, 21.4, 21.9);
  if (out <= .004) return;
  const pull = E.io3(seg(t, T.pull, T.pull + 1.3));
  const sc = lerp(1, .66, pull), baseY = lerp(510, 200, pull);

  fr.g({ a: out }, () => {
    /* 文字（整组缩放上移） */
    const x = fr.x;
    x.save(); x.translate(W / 2, baseY); x.scale(sc, sc); x.translate(-W / 2, -baseY);
    /* 文字在拉远时只缩一点、变暗，绝不让观众读不清 */
    const dim = 1 - .42 * pull;
    LINES.forEach((str, li) => {
      const y = 442 + li * 92, i0 = OFFS[li];
      fr.chars(str, 76, y, { font: 'serifr', size: 58, track: 5, color: '#2E3A46', align: 'l' }, (i) => {
        const k = E.out3(seg(t, litAt(i0 + i), litAt(i0 + i) + .2));
        if (k <= .002) return null;
        return { color: mix('#2E3A46', INK, k), a: dim, glow: 11 * k, glowA: .28 * k };
      });
      const lay = fr.layout(str, 76, { font: 'serifr', size: 58, track: 5, align: 'l' });
      lay.forEach((c, i) => {
        const k = ss(t, litAt(i0 + i) + .08, litAt(i0 + i) + .3) * (.62 + .38 * ss(t, 14.6, 15.4));
        tick(fr, c.cx, y - 50, 19, k * .9);
      });
    });
    /* 框住三行 */
    const ba = ss(t, 14.0, 14.6);
    if (ba > 0) {
      fr.rect(50, 380, 980, 300, { r: 16, color: rgba(ICE, .26 * ba), w: 1.4, a: ba * dim });
      fr.text('每个词都对', 78, 340, { font: 'serifr', size: 32, track: 6, color: rgba(ICE, .92 * ba * dim), align: 'l', glow: 10, glowA: .3 });
      tick(fr, 266, 340, 21, ba * dim, ICE);
    }
    x.restore();

    /*
     * 下一个词的概率条 —— 观众看见"猜"这件事发生
     */
    const pbA = ss(t, 11.2, 11.7) * (1 - ss(t, T.pull - .1, T.pull + .6));
    if (pbA > .01) {
      const vals = [.78, .47, .32, .21, .12, .06], cy = 1040, HMAX = 216;
      fr.g({ a: pbA }, () => {
        fr.text('下一个词 · 它给每个候选打分', 540, 820, { font: 'serifr', size: 22, track: 4, color: rgba(DIM, .85) });
        fr.line(170, cy, 916, cy, { color: rgba('#4A5D70', .45), w: 1.1, cap: 'butt' });
        vals.forEach((v, i) => {
          const k = E.out3(seg(t, 11.35 + i * .09, 11.85 + i * .09));
          if (k <= 0) return;
          const x = 200 + i * 122, h2 = HMAX * v * k, gold = i === 0;
          fr.rect(x, cy - h2, 58, h2, { r: [5, 5, 0, 0], fill: rgba(gold ? GOLD : '#3E5872', .3 * k), color: rgba(gold ? GOLD : '#4C6C8C', .7 * k), w: 1.2, glow: gold ? 16 : 0, glowA: .3 });
          fr.text(v.toFixed(2), x + 29, cy - h2 - 26, { font: 'latin', size: 25, color: rgba(gold ? GOLD : '#7E93A8', .9 * k) });
          if (gold) { tick(fr, x + 29, cy + 40, 20, k, GOLD); fr.text('选它', x + 29, cy + 76, { font: 'serifr', size: 17, track: 3, color: rgba(GOLD, .85 * k) }); }
        });
      });
    }

    /*
     * 下面的程序窗口
     */
    const wk = E.out3(seg(t, T.pull + .35, T.pull + 1.2));
    if (wk > .01) {
      const wy = 536, wh = 624;
      windowBox(fr, 84, wy, 912, wh, { a: wk * out, title: 'game.js', r: 16 });
      for (let i = 0; i < 6; i++) {
        const ry = wy + 92 + i * 42;
        hline(fr, 148 + (i % 3) * 26, ry, 180 + hash(i * 3.7) * 190, { a: wk * .8 });
        hline(fr, 400 + (i % 3) * 26, ry, 130 + hash(i * 5.1) * 170, { a: wk * .6 });
      }
      /* 红叉一片：3 行 × 5 列 */
      for (let i = 0; i < 15; i++) {
        const cx2 = 168 + (i % 5) * 188, cy2 = wy + 398 + Math.floor(i / 5) * 60;
        const k = ss(t, T.reds + i * .075, T.reds + i * .075 + .3);
        if (k <= .002) continue;
        fr.glow(cx2, cy2, 70, RED, .12 * k * out);
        cross(fr, cx2, cy2, 30 * (1 + .24 * (1 - E.out3(k))), k);
      }
      /* 底部状态条 */
      const ea = ss(t, T.reds + .85, T.reds + 1.4);
      if (ea > 0) {
        fr.rect(86, wy + wh - 56, 908, 54, { r: [0, 0, 14, 14], fill: rgba('#2A0A14', .8 * ea) });
        fr.text('跑不起来', 540, wy + wh - 29, { font: 'serifr', size: 30, track: 10, color: rgba(RED, .96 * ea), glow: 16, glowA: .35 });
      }
    }
  });
  if (t > T.lit && t < 14.0) for (let i = 0; i < LN.reduce((a, b) => a + b, 0); i++) fr.sfx(litAt(i), 'tick', { pitch: i % 6, gain: .28 });
  fr.sfx(14.1, 'chord', { root: 4, gain: .5 });
  for (let i = 0; i < 15; i++) fr.sfx(T.reds + i * .075, 'thud', { gain: .15 });
  fr.sfx(T.reds, 'thud', { gain: .75 });
}

/* ========== 镜 3 · 跑（22.15–39.4）==========
 * 这是什么：一个报错窗口。它在干什么：错被捡回去、改掉、再跑，红字一行行消失。 */
const FIX = [{ row: 3 }, { row: 6 }, { row: 2 }];
const FIXAT = [26.95, 31.15, 34.55];
function m3(fr, t) {
  if (t < T.s2) return;
  const out = 1 - ss(t, 38.9, 39.4);
  if (out <= .004) return;
  const wk = E.out3(seg(t, T.s2, T.s2 + .8));
  const wx = 70, wy = 240, ww = 940, wh = 856;

  fr.g({ a: out }, () => {
    const vw = lerp(140, ww, wk), vh = lerp(90, wh, wk);
    const vx = W / 2 - vw / 2, vy = wy + (wh - vh) / 2;
    windowBox(fr, vx, vy, vw, vh, { a: 1, title: wk > .85 ? 'game.js' : '', r: 20 });
    if (wk < .995) return;

    const codeY0 = wy + 96, RH = 37;
    const fixesDone = FIXAT.map(ft => ss(t, ft + .3, ft + .75));
    const okAll = ss(t, T.ok, T.ok + .75);
    const NCODE = 12;
    const ROWC = ['#6E86C8', '#4B5E71', '#4B5E71', '#5C9E86'];   // 关键字 / 普通 / 普通 / 字符串

    for (let i = 0; i < NCODE; i++) {
      const ry = codeY0 + i * RH;
      fr.text(String(i + 4), 130, ry, { font: 'mono', size: 13, color: '#333F4A', align: 'r', a: .85 });
      const ind = (i >= 4 && i <= 9) ? 1 : 0;
      const baseX = 158 + ind * 34;
      const fi = FIX.findIndex(f => f.row === i);
      const fixedK = fi >= 0 ? fixesDone[fi] : 0;
      const nP = 3 + (i % 2);
      const parts = Array.from({ length: nP }, (_, k) => 1.1 + hash(i * 13.7 + k * 5.3) * 1.5);
      let cx2 = baseX;
      parts.forEach((pp, k) => {
        const w2 = pp * 78 + hash(i * 5 + k) * 40;
        let col = ROWC[k === 0 ? 0 : k === parts.length - 1 ? 3 : 1];
        if (okAll > .3) col = mix(col, '#7FD4A8', okAll * .85);
        else if (fixedK > .01) col = mix(col, ICE, .5 * fixedK);
        hline(fr, cx2, ry, w2, { color: col, a: .9 });
        cx2 += w2 + 24;
      });
      /* 刚被改过：整行闪一下金色 */
      if (fi >= 0) {
        const since = t - FIXAT[fi];
        if (since > -.05 && since < 1.3) {
          const kk = Math.exp(-Math.pow(since / .35, 2));
          fr.glow(baseX + 240, ry, 180, GOLD, .13 * kk);
          fr.line(baseX, ry + 13, baseX + 520, ry + 13, { color: GOLD, w: 1.2, a: .45 * kk, cap: 'round' });
        }
      }
    }

    /* 运行按钮 */
    const bt = { x: 818, y: wy + wh - 66, w: 144, h: 46 };
    const runs = [T.run1, T.run2, T.run3, T.run4];
    const pressK = runs.reduce((m, rt) => Math.max(m, Math.exp(-Math.pow((t - rt - .07) / .13, 2))), 0);
    const done = ss(t, T.run4 + .4, T.run4 + .9);
    fr.rect(bt.x, bt.y, bt.w, bt.h, { r: 12, fill: rgba(mix('#12212E', '#1B7A5B', done), .95), color: rgba(ICE, .45), w: 1.3, glow: 14 * pressK + 4, glowA: .32 });
    fr.poly([[bt.x + 24, bt.y + 14], [bt.x + 24, bt.y + 32], [bt.x + 38, bt.y + 23]], { fill: rgba(ICE, .95), close: true });
    fr.text(pressK > .35 ? '运行中' : '运行', bt.x + 54, bt.y + 24, { font: 'serifr', size: 22, track: 3, color: rgba(INK, .9), align: 'l' });

    /* 底部报错区 */
    const eY = wy + wh - 300, eH = 200;
    fr.rect(86, eY, 908, eH, { r: 12, fill: rgba('#0A0A12', .75), color: rgba('#3A2432', .85), w: 1.2 });
    /* 当前该显示几行错 */
    const stage = t < T.run1 + .3 ? -1
      : t < FIXAT[0] + .25 ? 5
      : t < T.run2 + .3 ? 4
      : t < FIXAT[1] + .25 ? 3
      : t < T.run3 + .3 ? 2
      : t < FIXAT[2] + .25 ? 1
      : t < T.run4 + .3 ? 1 : 0;
    const lines = Math.max(0, stage);
    const errA = ss(t, T.err1, T.err1 + .2);
    for (let i = 0; i < lines; i++) {
      const ry = eY + 50 + i * 30;
      const a2 = ss(t, T.err1 + i * .1, T.err1 + i * .1 + .28);
      if (a2 <= .01) continue;
      fr.text('✕', 116, ry, { font: 'sansm', size: 16, color: rgba(RED, .9 * a2), align: 'l', a: a2 });
      hline(fr, 144, ry, 300 + hash(i * 3.3 + lines) * 420, { color: RED, a: .62 * a2, w: 1.2 });
    }
    if (errA > 0) fr.text(lines === 0 ? '0 errors' : `${lines} errors`, 968, eY + 24, { font: 'mono', size: 15, color: rgba(lines === 0 ? '#7FD4A8' : RED, .85 * errA), align: 'r', track: 1 });
    if (okAll > .01) {
      fr.text('运行成功', 100, eY + 26, { font: 'serifr', size: 21, track: 4, color: rgba('#7FD4A8', .95 * okAll), align: 'l', glow: 12, glowA: .35 });
      tick(fr, 540, eY + 120, 46, okAll, '#7FD4A8');
      fr.glow(540, eY + 120, 240, '#7FD4A8', .15 * okAll * (1 - ss(t, T.ok + .9, T.ok + 2.2)));
    }
  });

  /* 声音 */
  [T.run1, T.run2, T.run3, T.run4].forEach(rt => fr.sfx(rt, 'tock', { pitch: 3, gain: .55 }));
  [T.err1, T.err2, T.err3].forEach(et => { for (let i = 0; i < 5; i++) fr.sfx(et + i * .1, 'thud', { gain: .13, pitch: 1 }); });
  FIXAT.forEach(ft => { fr.sfx(ft, 'tick', { pitch: 2, gain: .45 }); fr.sfx(ft + .4, 'tick', { pitch: 5, gain: .4 }); });
  fr.sfx(T.ok + .2, 'chord', { root: 3, gain: .65 });
}

/* ========== 镜 4 · 环（39.75–53.5）==========
 * 这是什么：一个回路。它在干什么：光点绕圈，圈中间的分数一档档涨上去。 */
const NODES = [{ ang: -Math.PI / 2, zh: '写', en: 'WRITE' }, { ang: 0, zh: '跑', en: 'RUN' }, { ang: Math.PI / 2, zh: '看', en: 'READ' }, { ang: Math.PI, zh: '改', en: 'FIX' }];
const TURNS = 3, SPAN = 6.6;
function m4(fr, t) {
  if (t < T.s3) return;
  const out = 1 - ss(t, 53.0, 53.5);
  if (out <= .004) return;
  const shrink = E.io3(seg(t, T.pillars, T.pillars + 1.3));
  const cx = W / 2, cy = lerp(700, 404, shrink), R = lerp(262, 158, shrink);
  const spinK = seg(t, T.spin, T.spin + SPAN);

  fr.g({ a: out }, () => {
    /* 环 */
    const rk = E.out3(seg(t, T.ring0, T.ring0 + 1.1));
    if (rk > 0) {
      fr.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rk, { color: rgba('#4C6C8C', .5 * out), w: 1.6, glow: 10, glowA: .18 });
      for (let i = 0; i < 4; i++) {
        const a0 = -Math.PI / 2 + i * Math.PI / 2 + .34;
        const px = cx + R * Math.cos(a0), py = cy + R * Math.sin(a0), ta = a0 + Math.PI / 2;
        fr.poly([[px + 9 * Math.cos(ta + 2.4), py + 9 * Math.sin(ta + 2.4)], [px + 9 * Math.cos(ta), py + 9 * Math.sin(ta)], [px + 9 * Math.cos(ta - 2.4), py + 9 * Math.sin(ta - 2.4)]], { color: rgba('#6E8CA8', .5 * rk), w: 1.5, cap: 'round' });
      }
    }
    /* 四个节点 */
    NODES.forEach((nd, i) => {
      const k = E.outBack(seg(t, T.ring0 + .25 + i * .13, T.ring0 + .72 + i * .13), 1.5);
      if (k <= 0) return;
      const px = cx + R * Math.cos(nd.ang), py = cy + R * Math.sin(nd.ang);
      let lit = 0;
      if (spinK > 0 && spinK < 1) for (let tt = 0; tt < TURNS; tt++) {
        const pass = T.spin + SPAN * (tt + i / 4) / TURNS;
        lit = Math.max(lit, Math.exp(-Math.pow((t - pass) / .26, 2)));
      }
      const rr = R * .21 * k;
      fr.circle(px, py, rr, { fill: rgba(mix('#0D1622', '#12303F', lit), .94), color: rgba(mix('#3E5872', ICE, lit), .75), w: 1.6, glow: 16 * lit + 4, glowA: .3 * lit + .08 });
      fr.text(nd.zh, px, py + 1, { font: 'serifr', size: rr * 1.05, track: 2, color: rgba(mix('#9FB0C0', INK, lit), .95), glow: 14 * lit, glowA: .45 * lit });
      const la = (1 - shrink) * (1 - ss(t, T.spin + SPAN, T.spin + SPAN + .8));
      if (la > .02) fr.text(nd.en, px, py + rr + 30, { font: 'mono', size: 12, track: 3, color: rgba('#5E7183', .7 * la) });
    });
    /* 光点 */
    if (spinK > 0 && spinK < 1) {
      const ang2 = -Math.PI / 2 + Math.PI * 2 * TURNS * E.lin(spinK);
      const px = cx + R * Math.cos(ang2), py = cy + R * Math.sin(ang2);
      fr.comet(px, py, 150, 9, '#DCEBFF', 1, ang2 + Math.PI / 2);
      fr.glow(px, py, 96, ICE, .14);
    }
    /* 中心分数 */
    if (t > T.ring0 + .5) {
      const scoreK = E.out3(spinK), score = Math.round(lerp(0, 100, scoreK));
      const sa = ss(t, T.ring0 + .5, T.ring0 + 1.0) * (1 - ss(t, T.pillars + .2, T.pillars + .85));
      if (sa > 0) {
        fr.text(String(score), cx, cy + 6, { font: 'latinm', size: 106, color: rgba(mix('#8FA3B5', GOLD, scoreK), .97), track: 2, glow: 24, glowA: .28 });
        fr.text('分', cx, cy + 76, { font: 'serifr', size: 22, track: 6, color: rgba(DIM, .8 * sa) });
        fr.text('奖励 · REWARD', cx, cy - 84, { font: 'serifr', size: 17, track: 5, color: rgba('#6E8090', .8 * sa) });
      }
    }
    /* 两根对比柱 */
    const pk = E.out3(seg(t, T.pillars + .5, T.pillars + 1.9));
    if (pk > 0) {
      const baseY = 1120, HMAX = 328, bw = 104;
      const bars = [{ x: 268, h: 1, c: '#7E8B98', t: '猜下一个词', s: '99' }, { x: 690, h: pk, c: GOLD, t: '整个项目跑通', s: String(Math.round(100 * pk)) }];
      bars.forEach((b, i) => {
        const h2 = HMAX * b.h * pk;
        fr.rect(b.x, baseY - h2, bw, h2, { r: [6, 6, 0, 0], fill: rgba(b.c, .18 * pk), color: rgba(b.c, .65 * pk), w: 1.4 });
        if (h2 > 4) fr.rect(b.x, baseY - h2, bw, 5, { r: 3, fill: rgba(b.c, .85 * pk) });
        fr.text(b.s, b.x + bw / 2, baseY - h2 - 32, { font: 'latinm', size: 38, color: rgba(i === 0 ? '#9AA7B3' : GOLD, .95 * pk), glow: 12, glowA: .22 });
        fr.text(b.t, b.x + bw / 2, baseY + 34, { font: 'serifr', size: 23, track: 3, color: rgba('#C8D2DC', .95 * pk) });
      });
      fr.line(200, baseY, 940, baseY, { color: rgba('#4A5D70', .55 * pk), w: 1.2, cap: 'butt' });
      fr.text('示意', 944, baseY + 32, { font: 'serifr', size: 15, color: rgba('#5A6A78', .75 * pk), align: 'r' });
    }
  });

  for (let i = 0; i < 4; i++) fr.sfx(T.ring0 + .25 + i * .13, 'tock', { pitch: 4 + i, gain: .38 });
  for (let tt = 0; tt < TURNS; tt++) {
    fr.sfx(T.spin + SPAN * tt / TURNS, 'rise', { dur: .5, gain: .26 });
    for (let i = 0; i < 4; i++) fr.sfx(T.spin + SPAN * (tt + i / 4) / TURNS, 'tick', { pitch: 2 + i, gain: .3 });
  }
  fr.sfx(T.pillars + 1.2, 'bloom', { gain: .45 });
}

/* ========== 镜 5 · 成（54.35–67.3）==========
 * 这是什么：一块屏幕里的画面。它在干什么：一句话生成的东西，一张张真的出现。 */
const SHOTS = [
  { k: 'car', t: 54.7, b: 58.6, label: 'NEON VELOCITY', sub: '赛车游戏 · 官方演示', ar: 9 / 16 },
  { k: 'palace', t: 58.9, b: 62.8, label: '故宫 · 3D', sub: '可旋转的建筑 · 官方演示', ar: 207 / 480 },
  { k: 'portal', t: 63.1, b: 67.6, label: '传送门 2', sub: '复刻可玩关卡 · 官方演示', ar: 9 / 16 },
];
function m5(fr, t) {
  if (t < T.s4) return;
  SHOTS.forEach(s => {
    const a = fade(t, s.t, s.b, .5, .45);
    if (a <= .004) return;
    const k = E.out3(seg(t, s.t, s.t + .7));
    const w2 = lerp(830, 920, k), h2 = w2 * s.ar;
    const y = 640 - h2 / 2 + (1 - k) * 24, x2 = W / 2 - w2 / 2;
    fr.look.under = c2 => shotPlate(fr, s.k, x2, y, w2, h2, a, 1.02 + .03 * ss(t, s.t, s.b));
    windowBox(fr, x2, y, w2, h2, { a: a * k, title: '', r: 18, bar: false });
    fr.rect(x2, y, w2, h2, { r: 18, color: rgba(ICE, .22 * a * k), w: 1.6, glow: 26, glowA: .16 });
    fr.text(s.label, W / 2, y + h2 + 64, { font: 'serifm', size: 36, track: 10, color: rgba(INK, .94 * a), glow: 14, glowA: .2 });
    fr.text(s.sub, W / 2, y + h2 + 108, { font: 'serifr', size: 20, track: 4, color: rgba(DIM, .85 * a) });
    if (a > .5) fr.sfx(s.t + .25, 'soft', { gain: .5 });
  });
}

/* ========== 镜 6 · 收（68.2–84）==========
 * 这是什么：一句结论，然后片名。 */
function m6(fr, t) {
  if (t < T.outro) return;
  const ga = ss(t, T.outro, T.outro + 1.0) * (1 - ss(t, T.flash - .1, T.flash + .4));
  if (ga > 0) {
    fr.glow(W / 2, 700, 560, '#1E3A5C', .24 * ga);
    const core = ss(t, T.outro + 1.6, T.flash - .1);
    if (core > 0) { fr.glow(W / 2, 700, 90 + 260 * core, '#6FA8D8', .08 + .3 * core); fr.spark(W / 2, 700, 6 + 26 * core, GOLD, .3 + .6 * core); }
    /* 光点从四周一边转一边收向中心 —— 接片名卡的"点聚成字" */
    const cv = E.io3(seg(t, T.outro + .6, T.flash - .25));
    for (let i = 0; i < 240; i++) {
      const ang = hash(i * 2.13) * 6.2832, r0 = 360 + hash(i * 5.7) * 620;
      const rr = lerp(r0, 40 + hash(i * 9.1) * 120, cv * (.6 + .4 * hash(i * 1.7)));
      const a2 = ang + cv * 1.9 * (.5 + hash(i * 4.3));
      const px = W / 2 + rr * Math.cos(a2), py = 700 + rr * Math.sin(a2) * .84;
      const tw = .62 + .38 * Math.sin(t * 1.7 + i * .93);
      fr.spark(px, py, 1.8 + hash(i * 6.1) * 2.2, i % 4 === 0 ? GOLD : ICE, ga * (.2 + .62 * hash(i + 2)) * tw * (.5 + .5 * cv));
    }
  }
  K.flash(fr, t, T.flash, { rise: .06, fall: .38, color: '#E8F1FF' });
  const lt = t - T.flash;
  if (lt > -.05) {
    K.titleNight(fr, lt, { zh: '许愿式编程', sub: '一句话，一整个项目', en: 'WISHFUL  CODING', a: 1, cy: 690, size: 132, track: 26, lineY: 830 });
    const sa = ss(t, 81.4, 82.4);
    if (sa > 0) {
      fr.text('DeepSeek V4.1-Flash · 2026-10-17 官方发布', W / 2, 1232, { font: 'serifr', size: 17, track: 3, color: rgba('#5E7080', .9 * sa) });
      fr.text('代码与分数为示意；演示画面来自 DeepSeek 官方发布', W / 2, 1264, { font: 'serifr', size: 15, track: 2, color: rgba('#4E606E', .85 * sa) });
    }
  }
  fr.sfx(T.flash, 'shimmer', { gain: .55 });
  fr.sfx(79.6, 'chord', { root: -3, gain: .65 });
}

/* ---------- 总装 ---------- */
VK.film({
  dur: T.end, theme: 'night',
  meta: { title: '许愿式编程', root: -2, noise: [[24.0, 36.0, .32]], silence: [[T.flash - .05, T.flash + .55]] },
  draw(fr, t) {
    fr.look.bloom = .62;
    fr.look.bgo = { stars: t > T.flash - .3 ? .95 : .42, core: 1 };
    fr.look.under = null;
    m1(fr, t); m2(fr, t); m3(fr, t); m4(fr, t); m5(fr, t); m6(fr, t);
    K.chapterMark(fr, t, MARKS, T.outro - .3);
    fr.sfx(.4, 'chord', { root: 0, gain: .55 });
    K.subs(fr, t, SUBS, 'night');
  },
});
})();
