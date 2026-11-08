        // 当前语言标识符: 'zh' 或 'en'
        let currentLang = localStorage.getItem('site_lang') || 'zh';

        // 项目数据改为从 projects.json 异步加载（见 loadProjects）
        let projectsData = [];
        let projectsLoaded = null;

        let blogData = [];

        // 判断项目是否有真实可跳转的链接（否则视为"即将上线"）
        function projectHasRealLink(project) {
            return (project.subItems || []).some(s => s.link && s.link !== '#');
        }

        // 加载项目数据（只加载一次，结果被缓存）
        function loadProjects() {
            if (!projectsLoaded) {
                projectsLoaded = fetch('projects.json')
                    .then(res => res.json())
                    .then(data => { projectsData = data; })
                    .catch(() => { projectsData = []; });
            }
            return projectsLoaded;
        }

        // 切换中英文全局状态
        function toggleLanguage() {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            localStorage.setItem('site_lang', currentLang);
            applyLanguage();
        }

        // 应用语言设置更新页面 DOM
        function applyLanguage() {
            // 1. 更新所有包含 data-zh/data-en 的静态文本 DOM
            document.querySelectorAll('[data-zh]').forEach(el => {
                const text = el.getAttribute(`data-${currentLang}`);
                if (text) el.innerText = text;
            });

            // 2. 更新语言按钮显示文案
            document.querySelectorAll('.lang-btn-text').forEach(el => {
                el.innerText = currentLang === 'zh' ? 'EN' : '中文';
            });

            // 3. 动态刷新项目橱窗
            if (!document.getElementById('view-projects').classList.contains('hidden')) {
                loadProjects().then(initProjects);
            }

            // 4. 动态刷新博客栏目
            if (!document.getElementById('view-blog').classList.contains('hidden')) {
                initBlogSidebar();
            }

            // 5. 更新 document.title
            updateDocumentTitle();
        }

        function updateDocumentTitle() {
            const activeNav = document.querySelector('.nav-link.active');
            if (activeNav) {
                const navText = activeNav.getAttribute(`data-${currentLang}`) || activeNav.innerText;
                document.title = `anliways | ${navText}`;
            } else {
                document.title = currentLang === 'zh' ? "anliways | 个人主页" : "anliways | Home";
            }
        }

        function copyWeChat() {
            const wechatId = "anliways";
            const msg = currentLang === 'zh'
                ? "微信号 '" + wechatId + "' 已成功复制到剪贴板！"
                : "WeChat ID '" + wechatId + "' copied to clipboard!";
            navigator.clipboard.writeText(wechatId).then(() => {
                alert(msg);
            }).catch(err => {
                alert((currentLang === 'zh' ? "微信号为: " : "WeChat ID: ") + wechatId);
            });
        }

        function initProjects() {
            const container = document.getElementById('projects-list-container');
            if (!container) return;

            // 记住当前选中的项目ID：优先 DOM 已选中项，其次 sessionStorage，最后首项
            const currentActive = document.querySelector('.project-item.active');
            const savedId = sessionStorage.getItem('pj_selected_id');
            const savedValid = savedId && projectsData.some(p => p.id === savedId);
            const activeId = currentActive
                ? currentActive.id.replace('pj-item-', '')
                : (savedValid ? savedId : projectsData[0].id);

            container.innerHTML = '';

            projectsData.forEach((project) => {
                const title = project[`title_${currentLang}`] || project.title_zh;
                const item = document.createElement('button');
                item.type = 'button';
                // 未上线项目加标记，侧边栏中以小圆点区分
                item.className = 'project-item' + (projectHasRealLink(project) ? '' : ' is-wip');
                item.id = `pj-item-${project.id}`;
                item.onclick = () => handleProjectClick(project);
                item.innerHTML = `
                    <div class="project-item-icon"><i class="${project.icon}"></i></div>
                    <span class="project-item-title">${title}</span>
                `;
                container.appendChild(item);
            });

            selectProject(activeId || projectsData[0].id);
        }

        function selectProject(projectId) {
            document.querySelectorAll('.project-item').forEach(el => el.classList.remove('active'));
            const activeItem = document.getElementById(`pj-item-${projectId}`);
            if (activeItem) {
                activeItem.classList.add('active');
                // 通过切换器换项时保证侧边栏选中项可见
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }

            // 持久化选中状态（跨视图切换/刷新保持）
            sessionStorage.setItem('pj_selected_id', projectId);

            const project = projectsData.find(p => p.id === projectId);
            if (project) {
                const title = project[`title_${currentLang}`] || project.title_zh;
                const desc = project[`desc_${currentLang}`] || project.desc_zh;

                document.getElementById('pj-detail-icon').innerHTML = `<i class="${project.icon}"></i>`;
                // 无真实链接的项目在标题旁标注"即将上线"
                const wipBadge = projectHasRealLink(project)
                    ? ''
                    : ' <span class="wip-badge" data-zh="即将上线" data-en="Coming soon">即将上线</span>';
                document.getElementById('pj-detail-title').innerHTML = title + wipBadge;
                document.getElementById('pj-detail-desc').innerText = desc;
                renderSubItems(project.subItems);

                // 更新轮播计数器（1 / N）
                const idx = projectsData.findIndex(p => p.id === projectId);
                const counter = document.getElementById('pj-counter');
                if (counter) counter.textContent = `${idx + 1} / ${projectsData.length}`;

                // 仅 CodeLeaf 项目显示源码预览，其余项目隐藏该区块
                const codeSection = document.getElementById('code-preview-section');
                if (codeSection) {
                    if (projectId === 'codeleaf') {
                        codeSection.classList.remove('hidden');
                        initCodePreview();
                    } else {
                        codeSection.classList.add('hidden');
                    }
                }
            }
        }

        // ==================== 源码预览（CodeLeaf） ====================
        // 文件清单：来自 Anliways/codeleaf 仓库，经 jsDelivr CDN 拉取（CORS 开放）
        const CODE_PREVIEW_FILES = [
            { name: 'App.tsx', path: 'src/App.tsx', lang: 'typescript' },
            { name: 'routes.tsx', path: 'src/routes.tsx', lang: 'typescript' },
            { name: 'parser.ts', path: 'src/lib/parser.ts', lang: 'typescript' },
            { name: 'render.tsx', path: 'src/lib/render.tsx', lang: 'typescript' }
        ];
        const CODE_CDN_BASE = 'https://cdn.jsdelivr.net/gh/Anliways/codeleaf@main/';
        const codeCache = new Map();   // path -> 源码文本，避免重复请求
        let codeCurrentFile = null;

        function initCodePreview() {
            const tabs = document.getElementById('code-file-tabs');
            if (!tabs) return;
            tabs.innerHTML = '';
            CODE_PREVIEW_FILES.forEach((file, i) => {
                const tab = document.createElement('button');
                tab.type = 'button';
                tab.className = 'code-file-tab';
                tab.id = `code-tab-${file.name}`;
                tab.setAttribute('role', 'tab');
                tab.textContent = file.name;
                tab.onclick = () => loadCodeFile(file);
                tabs.appendChild(tab);
                if (i === 0) tab.classList.add('active');
            });
            // 默认加载第一个文件（有缓存则瞬时渲染）
            loadCodeFile(CODE_PREVIEW_FILES[0], true);
        }

        async function loadCodeFile(file, isInitial = false) {
            if (codeCurrentFile === file.name && !isInitial) return;
            codeCurrentFile = file.name;
            document.querySelectorAll('.code-file-tab').forEach(t =>
                t.classList.toggle('active', t.textContent === file.name));

            const progressBar = document.getElementById('code-progress-bar');
            const progressWrap = document.getElementById('code-progress');
            const codeEl = document.getElementById('code-viewer-content');

            // 缓存命中：直接渲染，不出进度条
            if (codeCache.has(file.path)) {
                renderCode(codeEl, codeCache.get(file.path), file.lang);
                return;
            }

            // 显示进度条并开始加载
            progressWrap.classList.remove('hidden', 'done');
            progressBar.style.width = '0%';
            progressWrap.removeAttribute('aria-valuenow');

            try {
                const text = await fetchCodeWithProgress(file.path, (ratio, known) => {
                    if (known) {
                        progressWrap.classList.remove('indeterminate');
                        const pct = Math.round(ratio * 100);
                        progressBar.style.width = pct + '%';
                        progressWrap.setAttribute('aria-valuenow', String(pct));
                    } else {
                        // 无 content-length（gzip 流）：切换不确定进度模式
                        progressWrap.classList.add('indeterminate');
                    }
                });

                codeCache.set(file.path, text);
                // 加载完成 → 满格 → 在下一帧执行高亮渲染（避免阻塞进度条动画）
                progressBar.style.width = '100%';
                requestAnimationFrame(() => {
                    renderCode(codeEl, text, file.lang);
                    // 渲染完成后延迟淡出并隐藏进度条
                    setTimeout(() => {
                        progressWrap.classList.add('done');
                        setTimeout(() => progressWrap.classList.add('hidden'), 350);
                    }, 180);
                });
            } catch (err) {
                progressWrap.classList.add('hidden');
                codeEl.textContent = currentLang === 'zh'
                    ? '源码加载失败，请检查网络后重试。'
                    : 'Failed to load source code. Please check your network.';
            }
        }

        // 流式读取并回报进度：known=true 时可计算百分比，否则为不确定长度
        async function fetchCodeWithProgress(path, onProgress) {
            const res = await fetch(CODE_CDN_BASE + path, { cache: 'force-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const total = parseInt(res.headers.get('content-length') || '0', 10);

            if (!res.body || !total) {
                // 无法流式统计：直接读全文，进度走不确定模式
                onProgress(0, false);
                const text = await res.text();
                onProgress(1, true);
                return text;
            }

            const reader = res.body.getReader();
            const chunks = [];
            let received = 0;
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                onProgress(received / total, true);
            }
            const blob = new Blob(chunks);
            return await blob.text();
        }

        function renderCode(codeEl, text, lang) {
            if (window.hljs) {
                try {
                    codeEl.innerHTML = hljs.highlight(text, { language: lang }).value;
                    return;
                } catch (_) { /* 语言识别失败则降级为纯文本 */ }
            }
            codeEl.textContent = text;
        }

        // 轮播式切换：dir = 1 下一个 / -1 上一个，循环切换，带方向感过渡动画
        function switchProject(dir) {
            if (!projectsData.length) return;
            const currentIdx = projectsData.findIndex(p =>
                document.getElementById(`pj-item-${p.id}`)?.classList.contains('active'));
            const nextIdx = ((currentIdx < 0 ? 0 : currentIdx) + dir + projectsData.length) % projectsData.length;
            const nextProject = projectsData[nextIdx];

            const content = document.getElementById('pj-detail-content');
            if (content) {
                // 重触发动画：先移除旧方向类
                content.classList.remove('slide-from-right', 'slide-from-left');
                // 强制回流以确保动画重新播放
                void content.offsetWidth;
                content.classList.add(dir === 1 ? 'slide-from-right' : 'slide-from-left');
            }

            selectProject(nextProject.id);

            // 移动端：在详情屏内切换时保持在详情屏
            if (window.innerWidth <= 850) {
                document.getElementById('view-projects').classList.add('show-detail');
            }
        }

        // 键盘 ← / → 快捷切换（仅在项目橱窗可见且未聚焦输入框时生效）
        document.addEventListener('keydown', (e) => {
            const projectsView = document.getElementById('view-projects');
            if (!projectsView || projectsView.classList.contains('hidden')) return;
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
            if (e.key === 'ArrowRight') { switchProject(1); }
            else if (e.key === 'ArrowLeft') { switchProject(-1); }
        });

        // 移动端详情屏左右滑动手势切换项目
        (function initSwipe() {
            let startX = 0, startY = 0, tracking = false;
            document.addEventListener('touchstart', (e) => {
                const view = document.getElementById('view-projects');
                if (!view || view.classList.contains('hidden') || !view.classList.contains('show-detail')) return;
                const t = e.touches[0];
                startX = t.clientX; startY = t.clientY; tracking = true;
            }, { passive: true });
            document.addEventListener('touchend', (e) => {
                if (!tracking) return;
                tracking = false;
                const view = document.getElementById('view-projects');
                if (!view || view.classList.contains('hidden')) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - startX, dy = t.clientY - startY;
                // 水平位移超过 60px 且明显大于垂直位移时视为滑动切换
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                    switchProject(dx < 0 ? 1 : -1);
                }
            }, { passive: true });
        })();

        function renderSubItems(subItems) {
            const container = document.getElementById('integrated-container');
            const grid = document.getElementById('integrated-grid');

            if (!subItems || subItems.length === 0) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
            grid.innerHTML = '';

            subItems.forEach(sub => {
                const title = sub[`title_${currentLang}`] || sub.title_zh;
                const desc = sub[`desc_${currentLang}`] || sub.desc_zh;
                // link 为空或 # 视为未上线：渲染为不可点击的占位卡片
                const isWip = !sub.link || sub.link === '#';

                const card = document.createElement(isWip ? 'div' : 'a');
                card.className = 'integrated-card' + (isWip ? ' wip' : '');
                if (!isWip) {
                    card.href = sub.link;
                    card.target = "_blank";
                }

                card.innerHTML = `
                    <div class="integrated-card-left">
                        <i class="${sub.icon || 'ri-link'} integrated-card-icon"></i>
                        <div class="integrated-card-info">
                            <span class="integrated-card-title">${title}</span>
                            <span class="integrated-card-desc">${desc || ''}</span>
                        </div>
                    </div>
                    ${isWip
                        ? `<span class="wip-badge" data-zh="即将上线" data-en="Coming soon">即将上线</span>`
                        : `<i class="ri-arrow-right-s-line integrated-card-arrow"></i>`}
                `;
                grid.appendChild(card);
            });
        }

        function handleProjectClick(project) {
            selectProject(project.id);
            if (window.innerWidth <= 850) {
                // 移动端：进入详情屏，由返回按钮回到列表
                document.getElementById('view-projects').classList.add('show-detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        // 移动端详情屏返回项目列表
        function backToProjects() {
            document.getElementById('view-projects').classList.remove('show-detail');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function initBlogSidebar() {
            const container = document.getElementById('sidebar-list-container');
            if (!container) return;

            const currentActive = document.querySelector('.blog-sidebar-item.active');
            const activeId = currentActive ? currentActive.id.replace('sidebar-', '') : (blogData[0] ? blogData[0].id : null);

            container.innerHTML = '';
            blogData.forEach((article) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'blog-sidebar-item';
                item.id = `sidebar-${article.id}`;
                item.onclick = () => selectArticle(article.id);
                item.innerHTML = `
                    <span class="sidebar-item-title">${article.title}</span>
                    <span class="sidebar-item-date">${article.date}</span>
                    ${article.summary ? `<span class="sidebar-item-summary">${article.summary}</span>` : ''}
                `;
                container.appendChild(item);
            });

            if (activeId) selectArticle(activeId);
        }

        function selectArticle(articleId) {
            document.querySelectorAll('.blog-sidebar-item').forEach(el => el.classList.remove('active'));
            const activeItem = document.getElementById(`sidebar-${articleId}`);
            if (activeItem) activeItem.classList.add('active');

            const article = blogData.find(b => b.id === articleId);
            if (article) {
                // 静默同步地址栏为单篇文章链接（replaceState 不触发 hashchange）
                try { history.replaceState(null, '', `#/blog/${encodeURIComponent(articleId)}`); } catch (e) {}

                document.getElementById('pm-title').innerText = article.title;
                document.getElementById('pm-date').innerText = article.date;
                document.getElementById('pm-author').innerText = article.author || "anliways";

                const loadingText = currentLang === 'zh' ? "正在加载内容..." : "Loading article...";
                document.getElementById('pm-body').innerHTML = `<p style='color: #8E8E93;'>${loadingText}</p>`;

                fetch(`posts/${articleId}.md`)
                    .then(res => {
                        if (!res.ok) throw new Error();
                        return res.text();
                    })
                    .then(mdText => {
                        // marked 输出经 DOMPurify 消毒后再写入，防 XSS
                        document.getElementById('pm-body').innerHTML = DOMPurify.sanitize(marked.parse(mdText));
                    })
                    .catch(() => {
                        const errText = currentLang === 'zh'
                            ? "文章正文内容加载失败，请检查 Markdown 文件是否存在。"
                            : "Failed to load post content. Please check if the Markdown file exists.";
                        document.getElementById('pm-body').innerHTML = `<p style='color: #8E8E93;'>${errText}</p>`;
                    });
            }
        }

        // hash 路由：#/ 主页、#/projects、#/blog、#/blog/<文章id>、#/about
        const ROUTES = ['profile', 'projects', 'blog', 'about'];

        // 解析当前 hash，返回 { route, articleId }
        function parseHash() {
            const raw = location.hash.replace(/^#\/?/, '');
            const segs = raw.split('/');
            const route = ROUTES.includes(segs[0].toLowerCase()) ? segs[0].toLowerCase() : 'profile';
            return {
                route: route,
                articleId: (route === 'blog' && segs[1]) ? segs.slice(1).join('/') : null
            };
        }

        // 视图切换入口（由页面 onclick 调用）：更新 hash，由 hashchange 统一渲染
        function toggleView(target) {
            const targetHash = target === 'profile' ? '#/' : `#/${target}`;
            if (parseHash().route === target) {
                renderView(target);
            } else {
                location.hash = targetHash;
            }
        }

        // 页面视图切换逻辑
        function renderView(target) {
            currentRoute = target;
            // 自定义背景仅在主页视图显示
            document.body.classList.toggle('bg-custom', target === 'profile' && homeBgConfigured);
            const profileView = document.getElementById('view-profile');
            const projectsView = document.getElementById('view-projects');
            const blogView = document.getElementById('view-blog');
            const aboutView = document.getElementById('view-about');
            const topNavbar = document.getElementById('top-navbar');
            const globalFooter = document.getElementById('global-footer');

            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

            profileView.classList.add('hidden');
            projectsView.classList.add('hidden');
            blogView.classList.add('hidden');
            if (aboutView) aboutView.classList.add('hidden');

            if (target === 'projects') {
                projectsView.classList.remove('hidden');
                // 每次进入项目页回到列表态（移动端两屏结构）
                projectsView.classList.remove('show-detail');
                topNavbar.classList.add('nav-visible');
                globalFooter.classList.remove('hidden');
                document.body.classList.add('has-navbar');
                document.getElementById('nav-link-projects').classList.add('active');

                loadProjects().then(initProjects);
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else if (target === 'blog') {
                blogView.classList.remove('hidden');
                topNavbar.classList.add('nav-visible');
                globalFooter.classList.remove('hidden');
                document.body.classList.add('has-navbar');
                document.getElementById('nav-link-blog').classList.add('active');

                // 若 URL 带文章 id（#/blog/<id>），优先打开该文章
                const routeArticleId = parseHash().articleId;
                fetch('posts.json')
                    .then(res => res.json())
                    .then(data => {
                        blogData = data;
                        initBlogSidebar();
                        const hasRouteArticle = routeArticleId && blogData.some(b => b.id === routeArticleId);
                        if (hasRouteArticle) {
                            selectArticle(routeArticleId);
                        } else if (blogData.length > 0) {
                            selectArticle(blogData[0].id);
                        }
                    })
                    .catch(err => {
                        document.getElementById('pm-title').innerText = currentLang === 'zh' ? "加载失败" : "Failed to load";
                        document.getElementById('pm-body').innerHTML = `<p>${currentLang === 'zh' ? '未能成功获取文章列表，请检查 posts.json 文件配置。' : 'Failed to fetch post list. Please check posts.json configuration.'}</p>`;
                    });
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else if (target === 'about') {
                if (aboutView) aboutView.classList.remove('hidden');
                topNavbar.classList.add('nav-visible');
                globalFooter.classList.remove('hidden');
                document.body.classList.add('has-navbar');
                document.getElementById('nav-link-about').classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else {
                profileView.classList.remove('hidden');
                topNavbar.classList.remove('nav-visible');
                globalFooter.classList.add('hidden');
                document.body.classList.remove('has-navbar');
            }

            updateDocumentTitle();
        }

        // 当前渲染的视图（用于 hashchange 时判断是否仅切换文章）
        let currentRoute = null;

        // 主页是否配置了自定义背景（由 site-config.json 决定）
        let homeBgConfigured = false;

        // 加载站点个性化配置：主页自定义背景（Discord 风格 splash）
        // site-config.json 不存在或字段为空时自动回退为默认纯色暗夜背景
        function loadSiteConfig() {
            return fetch('site-config.json')
                .then(res => res.ok ? res.json() : null)
                .then(cfg => {
                    const bg = cfg && cfg.homeBackground;
                    if (!bg || (!bg.image && !bg.gradient)) return;
                    const body = document.body;
                    body.style.setProperty('--bg-image', bg.gradient || `url("${bg.image}")`);
                    body.style.setProperty('--bg-overlay', String(typeof bg.overlay === 'number' ? bg.overlay : 0.45));
                    body.style.setProperty('--bg-blur', String(typeof bg.blur === 'number' ? bg.blur : 0) + 'px');
                    homeBgConfigured = true;
                })
                .catch(() => {});
        }

        // 初始化：加载语言设置与项目数据，并按当前 hash 渲染对应视图
        window.addEventListener('DOMContentLoaded', () => {
            applyLanguage();
            loadSiteConfig().then(loadProjects).then(() => renderView(parseHash().route));
        });

        window.addEventListener('hashchange', () => {
            const t = parseHash();
            // 同一博客视图内切换文章：仅刷新正文，不重新渲染整个视图
            if (t.route === 'blog' && currentRoute === 'blog' && t.articleId
                && blogData.some(b => b.id === t.articleId)) {
                selectArticle(t.articleId);
                return;
            }
            renderView(t.route);
        });
