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
│   └── og-image.png        # 社交分享图（1200×630）
├── favicon.svg             # 站点图标
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
