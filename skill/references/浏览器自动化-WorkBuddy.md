# 浏览器自动化：WorkBuddy 环境标准方案（2026-10-14 定案）

> 适用范围：小红书创作中心等需要登录态的网页操作（抓数据、发布、存草稿）。
> 本方案在多轮实测后定案，**agent-browser CLI 已弃用**，别再回头试。

## 一、为什么弃用 agent-browser（已实验证实，勿复踩）

- **守护进程活不过单条命令**：Bash/PowerShell 工具每条命令结束时，它启动的整棵
  子进程树被连带清杀，agent-browser 的守护进程和 Chrome 都算子进程。
  于是跨命令操作必然回 `about:blank`——下一条命令连到的是自动重启的新守护进程。
- **双实例打架**：守护进程被杀后自动重启，而前一个可能还残喘，两个实例抢
  `default.pid`/`default.port`，状态文件会被写坏（实测出现过非法 pid `3244850838`）。
- **`snapshot -i` 永久挂起**：多个对话复现，无解。
- 结论：任何跨多轮的浏览器操作（扫码登录、先点后取）在 agent-browser 下都不可靠。

## 二、标准方案：Playwright 直驱 Chrome

单进程自管理，没有守护进程就没有打架。全流程塞进一个自包含脚本，
用 `run_in_background` 后台运行（后台任务受任务协议保护，不会被清杀）。

### 依赖（一次性，已就位）

| 项 | 路径 |
|---|---|
| node | `C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-6/node.exe` |
| playwright-core | `NODE_PATH=C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules`（npm install 装进去） |
| Chrome | `C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe`（playwright 用 `executablePath` 指向它） |

运行命令模板：
```bash
NODE_PATH="C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules" \
  "C:/Users/Lenovo/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" 脚本.js
```
（`dangerouslyDisableSandbox` + `run_in_background`，脚本内部全流程自包含）

### 骨架

```js
const { chromium } = require('playwright-core');
const CHROME = 'C:/Users/Lenovo/.agent-browser/browsers/chrome-155.0.8059.79/chrome.exe';
const STATE  = '<工作区>/xhs-storage.json';  // 登录态存档

const browser = await chromium.launch({ executablePath: CHROME, headless: false });
const ctx = await browser.newContext({ viewport:{width:1340,height:900}, storageState: STATE });
const page = await ctx.newPage();
// …操作…
await ctx.storageState({ path: STATE });  // 登录成功后立刻存，下次免扫码
await browser.close();
```

## 三、登录：storageState 持久化

- 有登录态：`storageState` 直接加载，秒进。
- 无登录态：脚本里弹可见窗口（`headless:false`）切二维码登录页 →
  轮询 URL/页面变化等用户扫码（上限 8 分钟）→ 成功后**立刻存 storageState**。
- 实测可用入口：`https://creator.xiaohongshu.com/login`；
  页面上 64×64 的 `<img>`（class 形如 `css-xxxx`）是「切二维码」按钮，用 JS 直点。
- ⚠️ 旧 cookie 不可跨账号重登录复用：重扫码会把旧 `web_session` 踢掉（服务端单点），
  cookie 注入那条路实测无效，别浪费时间。

## 四、小红书创作中心可用 URL 与页面事实（2026-10-14 实测）

- `/data/note` 是 **404**；数据入口在首页「笔记数据总览」卡片；笔记列表在左侧「笔记管理」菜单
- 笔记管理页每行 5 个数字顺序：**浏览 / 评论 / 点赞 / 收藏 / 分享**（从图标确认）
- 发布页 `https://creator.xiaohongshu.com/publish/publish?source=official`
  默认落在**视频上传 tab**；tab 文本 `上传图文`/`上传视频`（class `creator-tab`），
  JS 直点切换，Playwright 的 `click()` 可能因可点性检查超时
- 图片 file input 的 accept 是**扩展名形式** `.jpg,.jpeg,.png,.webp`（不是 `image/*`），
  且可能不可见——按 `state:'attached'` 等，不要等 visible
- AI 声明：表单里「添加内容类型声明」下拉 → 选「笔记含AI合成内容」，可自动化
- ⚠️ 底部「发布」「暂存离开」按钮**在所有 frame 的 DOM 中都搜不到**（疑似特殊渲染），
  目前只能人工点。半自动分工：脚本填完表单停住，人只点发布/暂存
- 表单中断时小红书会**自动存草稿**，反复试跑会留垃圾草稿，注意清理

## 五、脚本纪律

1. 每步都 `log()` 打进度 + 关键节点截图存盘——跨进程看不到现场，事后全靠日志和截图排障
2. 整个流程 try/catch 包住，失败时先截图再 throw，现场不能丢
3. 选择器优先 JS `evaluate` 直点（文本归一化后再匹配），Playwright locator 的
   严格可点性检查在这类 React 页面上容易假失败
4. 等待用轮询（页面状态）而不是固定 sleep；登录等待给足 8 分钟
5. 取完数立刻 `browser.close()`，不留悬挂 Chrome
