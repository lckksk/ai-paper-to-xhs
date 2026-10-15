// 把 Player-1 成稿直接写入 xhs-mcp 的 note_drafts 表（绕过坏掉的 AI 生图环节）
import Database from 'file:///C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/better-sqlite3/lib/index.js';
import { randomUUID } from 'crypto';

const DB = 'C:/Users/Lenovo/.xhs-mcp/data.db';
const CARD_DIR = 'E:/自媒体运营/论文与博客解读/posts/2026-W42/2026-10-15-Player1-深度版';

const title = 'AI 不看攻略了，自己打游戏练出来的';
const content = `小时候学游戏，看别人通关录像看一百遍，自己还是过不了关。

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

来源：arXiv 2610.20584（新加坡国立 × 腾讯 ARC Lab × 南洋理工，2026-10-14 提交）

#人工智能 #AI论文 #大模型 #游戏AI #AI智能体`;
const tags = ['人工智能', 'AI论文', '大模型', '游戏AI', 'AI智能体'];
const images = [1, 2, 3, 4, 5, 6].map(n => `${CARD_DIR}/卡片${n}.png`);

// 确认图片都在
const fs = await import('fs');
for (const p of images) {
  if (!fs.existsSync(p)) { console.error('MISSING IMAGE: ' + p); process.exit(1); }
}

const db = new Database(DB);
const id = randomUUID();
const now = new Date().toISOString();
db.prepare(`INSERT INTO note_drafts (id, title, content, tags, images, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)`)
  .run(id, title, content, JSON.stringify(tags), JSON.stringify(images), now, now);
db.close();
console.log(JSON.stringify({ success: true, draftId: id, title, imageCount: images.length }, null, 2));
