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

            // 记住当前选中的项目ID，避免重绘后归位
            const currentActive = document.querySelector('.project-item.active');
            const activeId = currentActive ? currentActive.id.replace('pj-item-', '') : projectsData[0].id;

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
            if (activeItem) activeItem.classList.add('active');

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
            }
        }

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
