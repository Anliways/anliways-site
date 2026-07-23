// 当前语言标识符: 'zh' 或 'en'
let currentLang = localStorage.getItem('site_lang') || 'zh';

const projectsData = window.projectsData || [];
let blogData = [];

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
        initProjects();
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
        const item = document.createElement('div');
        item.className = 'project-item';
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
        document.getElementById('pj-detail-title').innerText = title;
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

        const card = document.createElement('a');
        card.className = 'integrated-card';
        card.href = sub.link || '#';
        if (sub.link && sub.link !== '#') card.target = "_blank";

        card.innerHTML = `
            <div class="integrated-card-left">
                <i class="${sub.icon || 'ri-link'} integrated-card-icon"></i>
                <div class="integrated-card-info">
                    <span class="integrated-card-title">${title}</span>
                    <span class="integrated-card-desc">${desc || ''}</span>
                </div>
            </div>
            <i class="ri-arrow-right-s-line integrated-card-arrow"></i>
        `;
        grid.appendChild(card);
    });
}

function handleProjectClick(project) {
    const title = project[`title_${currentLang}`] || project.title_zh;
    if (window.innerWidth <= 850) {
        if (project.subItems && project.subItems.length > 0 && project.subItems[0].link !== '#') {
            window.open(project.subItems[0].link, '_blank');
        } else {
            alert((currentLang === 'zh' ? "正在查看：" : "Viewing: ") + title);
        }
    } else {
        selectProject(project.id);
    }
}

function initBlogSidebar() {
    const container = document.getElementById('sidebar-list-container');
    if (!container) return;

    const currentActive = document.querySelector('.blog-sidebar-item.active');
    const activeId = currentActive ? currentActive.id.replace('sidebar-', '') : (blogData[0] ? blogData[0].id : null);

    container.innerHTML = '';
    blogData.forEach((article) => {
        const item = document.createElement('div');
        item.className = 'blog-sidebar-item';
        item.id = `sidebar-${article.id}`;
        item.onclick = () => selectArticle(article.id);
        item.innerHTML = `
            <span class="sidebar-item-title">${article.title}</span>
            <span class="sidebar-item-date">${article.date}</span>
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
                document.getElementById('pm-body').innerHTML = marked.parse(mdText);
            })
            .catch(() => {
                const errText = currentLang === 'zh' 
                    ? "文章正文内容加载失败，请检查 Markdown 文件是否存在。" 
                    : "Failed to load post content. Please check if the Markdown file exists.";
                document.getElementById('pm-body').innerHTML = `<p style='color: #8E8E93;'>${errText}</p>`;
            });
    }
}

// 页面视图切换逻辑
function toggleView(target) {
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
        topNavbar.classList.add('nav-visible'); 
        globalFooter.classList.remove('hidden'); 
        document.body.classList.add('has-navbar');
        document.getElementById('nav-link-projects').classList.add('active');
        
        initProjects(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } else if (target === 'blog') {
        blogView.classList.remove('hidden');
        topNavbar.classList.add('nav-visible'); 
        globalFooter.classList.remove('hidden'); 
        document.body.classList.add('has-navbar');
        document.getElementById('nav-link-blog').classList.add('active');
        
        fetch('posts.json')
            .then(res => res.json())
            .then(data => {
                blogData = data;
                initBlogSidebar();
                if (blogData.length > 0) selectArticle(blogData[0].id);
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

// 页面初始化加载语言设置
window.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
});
