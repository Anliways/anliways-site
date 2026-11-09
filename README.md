# anliways-site

anliways.com 的源码仓库。零依赖、纯静态个人主页：单页应用结构 + 客户端 Markdown 渲染 + 中英双语，托管在 Vercel。

## 项目结构

```
├── index.html              # 页面骨架（HTML 结构，无内联样式/脚本）
├── style.css               # 全部样式（暗色主题 + 响应式）
├── main.js                 # 全部交互逻辑（视图切换 / 语言切换 / 数据加载）
├── projects.json           # 「项目橱窗」数据（与代码解耦，改这里即可）
├── posts.json              # 博客文章列表
├── posts/                  # 文章 Markdown 正文（文件名 = 文章 id）
├── assets/
│   ├── og-image.png        # 社交分享图（1200×630）
│   └── bg.jpg              # 主页自定义背景（Discord 风格 splash）
├── site-config.json        # 站点个性化配置（主页背景等）
├── favicon.svg             # 站点图标
├── codeleaf/
│   └── index.html          # 「编码叶」编辑器独立应用（访问 /codeleaf/）
└── scripts/
    └── validate-posts.js   # 内容数据校验脚本
```

## 日常维护

### 新增一篇博客文章

1. 在 `posts/` 目录新建 `文章id.md`（文件名即 id，建议英文短横线命名）；
2. 在 `posts.json` 数组中追加一条记录，`id` 与文件名一致：

```json
{ "id": "my-new-post", "title": "文章标题", "date": "2026年11月6日", "author": "anliways" }
```

3. 提交前运行 `node scripts/validate-posts.js` 自检（GitHub Actions 也会自动校验）。

`posts.json` 支持的可选字段：`summary`（一行摘要，展示在侧边栏文章卡片上并写入 RSS）、
`author`（默认 anliways）、`fullUrl`（外链文章地址，RSS 条目优先使用它）。

### 修改「项目橱窗」

编辑 `projects.json`：每个项目包含中英文标题/描述/图标和 `subItems` 子项列表。
子项 `link` 留空或为 `#` 时，页面会自动显示「即将上线」标记且不可点击。

项目预览支持多种切换方式：详情面板右上角的 ← / → 按钮、键盘方向键
（项目橱窗可见时生效）、移动端详情屏左右滑动手势；切换循环播放并带方向感
过渡动画，选中状态通过 `sessionStorage`（键 `pj_selected_id`）持久化。

### 本地预览

由于页面通过 `fetch` 加载 JSON 和 Markdown，需通过 HTTP 服务预览（直接双击打开会因 CORS 失效）：

```bash
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 路由说明

视图切换基于 hash 路由，可直接分享对应链接：

- `https://www.anliways.com/#/` — 主页菜单
- `https://www.anliways.com/#/projects` — 项目橱窗
- `https://www.anliways.com/#/blog` — 博客文章
- `https://www.anliways.com/#/blog/<文章id>` — 单篇文章（如 `#/blog/test-article`）
- `https://www.anliways.com/#/about` — 关于我

## 自定义主页背景（Discord 风格）

主页支持全屏背景图 + 暗色遮罩 + 毛玻璃卡片的沉浸式效果（类似 Discord 邀请页）。
编辑仓库根目录的 `site-config.json`：

```json
{
  "homeBackground": {
    "image": "assets/bg.jpg",   // 背景图片路径（也可以填外部 https 图片地址）
    "overlay": 0.45,            // 暗色遮罩强度，0-1，越大越暗
    "blur": 0                   // 背景模糊半径（px），建议 0-20
  }
}
```

三种用法：

1. **换图片**：把新图替换 `assets/bg.jpg`（或改 `image` 字段指向新路径/外部链接）；
2. **纯渐变背景**：删掉 `image` 字段，改用 `"gradient": "radial-gradient(circle at 50% 40%, #1e3a5f 0%, #121212 70%)"`（任意合法 CSS 渐变）；
3. **关闭自定义背景**：把 `image` 和 `gradient` 都删掉，站点回退为默认纯色暗夜背景。

背景仅在主页视图显示；进入项目橱窗、博客、关于我时自动恢复纯色，保证阅读体验。
主页名片卡片会自动切换为半透明毛玻璃（backdrop blur）效果。

## 集成应用：编码叶 CodeLeaf

`https://www.anliways.com/codeleaf/` — 实时文本编辑与预览工具（React + Vite 单文件构建）。

- 入口在「项目橱窗」的 `projects.json` 中维护（id: `codeleaf`）；
- `codeleaf/index.html` 为完全自包含的单文件产物（JS/CSS 全部内联，无外部资源依赖），
  直接从 [Anliways/codeleaf](https://github.com/Anliways/codeleaf) 的 Pages 构建产物
  下载覆盖即可升级，无需改动主站任何代码；
- 该子目录是独立应用，与主站的 hash 路由、样式互不影响。

## 集成应用：布谷鸟工作台

`https://www.anliways.com/cuckoo/` — 个人效率工作台（单文件静态应用）。

- 入口在「项目橱窗」的 `projects.json` 中维护（id: `cuckoo`）；
- `cuckoo/index.html` 为完全自包含的单文件应用（HTML/CSS/JS 全部内联，无外部资源依赖），
  直接用新的单文件覆盖 `cuckoo/index.html` 即可升级，无需改动主站任何代码；
- 数据（提醒/任务/看板/日历/邮件等）仅保存在用户浏览器 localStorage，支持页面内 JSON 导出/导入备份；
- AI 文本与图像生成需在应用「设置」中自行配置 API；
- 该子目录是独立应用，与主站的 hash 路由、样式互不影响。

## RSS 订阅

订阅地址：`https://www.anliways.com/rss.xml`（页面 head 中已做自动发现）。

`rss.xml` 由 `scripts/generate-rss.js` 根据 `posts.json` 自动生成，**无需手动维护**：
每次 push 到 main 后，GitHub Actions 会先校验内容，再重新生成 rss.xml；若有变化会以
`github-actions[bot]` 身份自动提交回仓库。新增文章后 1-2 分钟内订阅源即会更新。

## 部署

- 托管平台：**Vercel**（连接本 GitHub 仓库，push 到 main 自动部署）。
- 域名：`anliways.com` 与 `www.anliways.com` 均绑定在 Vercel 项目中，裸域 301 跳转到 `www`。
- 无构建步骤：仓库根目录即部署目录。
- 注意：自定义域名配置仅在 Vercel 后台，如需迁移平台请先在 Vercel 中解除绑定。

## 管理后台（/admin/）

无需改代码即可在线维护内容：访问 `https://www.anliways.com/admin/`（不入站内导航，也不会被搜索引擎收录）。

- **登录方式**：用户名 + 密码（首位注册者自动成为唯一管理员，之后注册入口关闭）。会话以 HMAC 签名的 HttpOnly Cookie 保持（默认 7 天，可勾选 30 天）。
- **功能模块**：项目管理（增删改 projects.json 及子项/直达入口）、博客管理（新建/编辑/删除文章，自动同步 posts.json 与 posts/<id>.md，满足 CI 校验规则）、站点设置（编辑 site-config.json：站点标题、主页背景图片/渐变/遮罩/模糊、关于页社交链接、头像上传（base64 提交到 assets/）、关于页标题/副标题/简介/标签（中英双语，留空自动使用内置默认值））。
- **发布机制**：`/api/content` 服务端函数代理 GitHub 提交（Git Data API 原子化多文件提交），随后自动触发 CI 校验、RSS 回写与 Vercel 部署。
- **安全设计**：密码 scrypt 加盐哈希，账户数据 AES-256-GCM 加密后存于 `admin-data/users.json`；GitHub 令牌只存在于 Vercel 环境变量，前端全程不接触；登录失败按 IP 限流（15 分钟 10 次）；未登录访问内容接口一律 401；页面返回 `X-Robots-Tag: noindex`、`X-Frame-Options: DENY`、`Referrer-Policy: no-referrer`。

### 服务端环境变量（一次性配置）

在 Vercel 项目 → Settings → Environment Variables 添加：

| 变量名 | 值 |
|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT（仅 anliways-site 仓库，Contents: Read and write） |
| `SESSION_SECRET` | 任意长随机字符串（用于会话签名与账户数据加密，请妥善保管） |

添加后重新部署即可使用。
