const http = require('http')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const PORT = 3456

function getHtml() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mini-auto-deploy — 配置中心</title>
<style>
:root {
    --bg: #0f172a;
    --sidebar-bg: #1e293b;
    --card-bg: #1e293b;
    --border: #334155;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --accent: #818cf8;
    --accent-glow: rgba(129,140,248,.25);
    --green: #34d399;
    --red: #f87171;
    --amber: #fbbf24;
    --radius: 12px;
    --radius-sm: 8px;
    --transition: .25s cubic-bezier(.4,0,.2,1);
}
* { margin:0; padding:0; box-sizing:border-box }
html { scroll-behavior:smooth }
body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}

/* ====== SIDEBAR ====== */
.sidebar {
    width: 260px;
    min-height: 100vh;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    padding: 32px 24px;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    display: flex; flex-direction: column;
    z-index: 100;
}
.sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 40px;
}
.sidebar-logo .icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
}
.sidebar-logo h2 { font-size: 16px; font-weight: 700; letter-spacing: -.3px }
.sidebar-logo span { font-size: 11px; color: var(--text-muted); display:block; font-weight:400 }
.sidebar-nav { flex:1 }
.nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: var(--radius-sm);
    color: var(--text-muted); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: var(--transition);
    margin-bottom: 2px; text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,.04); color: var(--text) }
.nav-item.active { background: var(--accent-glow); color: var(--accent) }
.nav-item .step-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--border); color: var(--text-muted);
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    transition: var(--transition);
}
.nav-item.active .step-num { background: var(--accent); color: #fff }
.nav-item.done .step-num { background: var(--green); color: #0f172a }
.sidebar-footer {
    font-size: 11px; color: var(--text-dim);
    text-align: center; padding-top: 16px;
    border-top: 1px solid var(--border);
}

/* ====== MAIN ====== */
.main {
    margin-left: 260px;
    flex:1;
    height: 100vh;
    overflow-y: auto;
    padding: 40px 48px 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.main-inner {
    width: 100%;
    max-width: 720px;
}
.page-title {
    font-size: 26px; font-weight: 800; letter-spacing: -.5px;
    margin-bottom: 4px;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.page-subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 36px }

/* ====== CARD ====== */
.card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    margin-bottom: 20px;
    transition: var(--transition);
}
.card:hover { border-color: #475569 }
.card-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 24px; padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
}
.card-header .card-icon {
    width: 34px; height: 34px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
}
.card-header h3 { font-size: 15px; font-weight: 600 }
.card-icon.blue { background: rgba(129,140,248,.15); color: var(--accent) }
.card-icon.green { background: rgba(52,211,153,.15); color: var(--green) }
.card-icon.amber { background: rgba(251,191,36,.15); color: var(--amber) }
.card-icon.red { background: rgba(248,113,113,.15); color: var(--red) }

/* ====== FORM ====== */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px }
.form-row:last-child { margin-bottom: 0 }
.form-group { margin-bottom: 16px }
.form-group:last-child { margin-bottom: 0 }
.form-group label {
    display: block; font-size: 12px; font-weight: 600; color: var(--text-muted);
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px;
}
.form-group label .hint { text-transform: none; font-weight: 400; color: var(--text-dim); letter-spacing: 0 }
input, select, textarea {
    width: 100%; padding: 10px 14px;
    background: #0f172a; border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text);
    font-size: 14px; font-family: inherit;
    transition: var(--transition);
}
input::placeholder, textarea::placeholder { color: var(--text-dim) }
input:focus, select:focus, textarea:focus {
    outline: none; border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}
textarea { resize: vertical; min-height: 70px }
select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    padding-right: 36px;
}

/* ====== TOGGLE ====== */
.toggle-row { display: flex; align-items: center; gap: 12px }
.toggle {
    position: relative; width: 44px; height: 24px; flex-shrink: 0;
}
.toggle input { opacity: 0; width: 0; height: 0 }
.toggle .slider {
    position: absolute; cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: var(--border); border-radius: 24px;
    transition: var(--transition);
}
.toggle .slider::before {
    content: ''; position: absolute;
    width: 18px; height: 18px; left: 3px; bottom: 3px;
    background: #fff; border-radius: 50%;
    transition: var(--transition);
}
.toggle input:checked + .slider { background: var(--accent) }
.toggle input:checked + .slider::before { transform: translateX(20px) }
.toggle-row label { margin: 0 !important; text-transform: none !important; letter-spacing: 0 !important; font-size: 13px !important; cursor: pointer }

/* ====== BOTTOM BAR ====== */
.bottom-bar {
    position: fixed; bottom: 0; left: 260px; right: 0;
    background: var(--sidebar-bg); border-top: 1px solid var(--border);
    padding: 16px 48px;
    display: flex; align-items: center; justify-content: space-between;
    z-index: 50;
}
.bottom-bar .status { font-size: 13px; color: var(--text-muted) }
.btn-group { display: flex; gap: 10px }
.btn {
    padding: 10px 24px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: var(--transition); border: none;
    font-family: inherit; letter-spacing: .2px;
    display: inline-flex; align-items: center; gap: 6px;
}
.btn-primary {
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    color: #fff; box-shadow: 0 4px 14px rgba(129,140,248,.3);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(129,140,248,.4) }
.btn-primary:active { transform: translateY(0) }
.btn-ghost {
    background: transparent; color: var(--text-muted);
    border: 1px solid var(--border);
}
.btn-ghost:hover { background: rgba(255,255,255,.04); color: var(--text); border-color: #64748b }

/* ====== TOAST ====== */
.toast-container { position: fixed; top: 20px; right: 20px; z-index: 1000 }
.toast {
    padding: 14px 20px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500; margin-bottom: 8px;
    animation: slideIn .3s ease-out;
    display: flex; align-items: center; gap: 8px;
    max-width: 380px;
}
.toast.success { background: #064e3b; color: var(--green); border: 1px solid #065f46 }
.toast.error { background: #7f1d1d; color: var(--red); border: 1px solid #991b1b }
@keyframes slideIn { from { opacity:0; transform: translateX(40px) } to { opacity:1; transform: translateX(0) } }

/* ====== PREVIEW MODAL ====== */
.modal-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.7); backdrop-filter: blur(6px);
    z-index: 200; align-items: center; justify-content: center;
}
.modal-overlay.show { display: flex }
.modal {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: var(--radius); width: 640px; max-width: 90vw;
    max-height: 80vh; overflow: auto; padding: 32px;
    animation: modalIn .3s ease-out;
}
@keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
.modal h2 { font-size: 18px; margin-bottom: 8px }
.modal .success-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(52,211,153,.15); color: var(--green);
    padding: 4px 12px; border-radius: 20px; font-size: 12px;
    margin-bottom: 16px;
}
.modal pre {
    background: #0f172a; border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 16px;
    font-size: 12px; color: var(--text-muted);
    overflow: auto; line-height: 1.7;
    font-family: "JetBrains Mono", "Fira Code", monospace;
}
.modal .btn-row { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end }

/* ====== RESPONSIVE ====== */
@media (max-width: 768px) {
    .sidebar { display: none }
    .main { margin-left: 0; padding: 24px 20px }
    .bottom-bar { left: 0; padding: 12px 20px }
    .form-row { grid-template-columns: 1fr }
}
</style>
</head>
<body>

<!-- ====== SIDEBAR ====== -->
<aside class="sidebar">
    <div class="sidebar-logo">
        <div class="icon">🚀</div>
        <div><h2>mini-auto-deploy</h2><span>配置中心</span></div>
    </div>
    <nav class="sidebar-nav">
        <a class="nav-item active" data-target="section-project">
            <span class="step-num">1</span> 项目信息
        </a>
        <a class="nav-item" data-target="section-build">
            <span class="step-num">2</span> 构建配置
        </a>
        <a class="nav-item" data-target="section-target">
            <span class="step-num">3</span> 部署目标
        </a>
        <a class="nav-item" data-target="section-ssh">
            <span class="step-num">4</span> SSH 连接
        </a>
        <a class="nav-item" data-target="section-advanced">
            <span class="step-num">5</span> 高级选项
        </a>
    </nav>
    <div class="sidebar-footer">v1.1.2 · ISC</div>
</aside>

<!-- ====== MAIN ====== -->
<div class="main">
    <div class="main-inner">
    <h1 class="page-title">创建部署配置</h1>
    <p class="page-subtitle">填写以下信息，一键生成 deploy.config.js</p>

    <form id="configForm">
        <!-- 项目信息 -->
        <div class="card" id="section-project">
            <div class="card-header">
                <div class="card-icon blue">📋</div>
                <h3>项目信息</h3>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>项目名称 <span class="hint">· Docker 镜像/容器名</span></label>
                    <input name="name" value="my-app" required placeholder="my-app">
                </div>
                <div class="form-group">
                    <label>服务端口</label>
                    <input name="port" type="number" value="9000" required placeholder="9000">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>项目类型</label>
                    <select name="type" id="projectType">
                        <option value="web">Web 前端</option>
                        <option value="node">Node.js 后端</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>部署方式</label>
                    <select name="deployMode" id="deployMode"></select>
                </div>
            </div>
        </div>

        <!-- 构建配置 -->
        <div class="card" id="section-build">
            <div class="card-header">
                <div class="card-icon green">🔧</div>
                <h3>构建配置</h3>
            </div>
            <div class="form-group">
                <label>构建命令 <span class="hint">· 如 npm run build，留空跳过构建</span></label>
                <input name="buildCommand" value="npm run build" placeholder="npm run build">
            </div>
            <div class="form-group">
                <label>构建产物目录</label>
                <input name="assetDir" value="dist" placeholder="dist">
            </div>
            <div class="toggle-row">
                <label class="toggle">
                    <input type="checkbox" name="useBuiltInTemplates" id="useTpl" checked>
                    <span class="slider"></span>
                </label>
                <label for="useTpl">使用内置 Dockerfile / nginx.conf 模板 <span class="hint">(仅 web+docker)</span></label>
            </div>
        </div>

        <!-- 部署目标 -->
        <div class="card" id="section-target">
            <div class="card-header">
                <div class="card-icon amber">🖥</div>
                <h3>部署目标</h3>
            </div>
            <div class="form-group">
                <label>服务器部署目录</label>
                <input name="remoteDirectory" value="/root/web" required placeholder="/root/web">
            </div>
        </div>

        <!-- SSH -->
        <div class="card" id="section-ssh">
            <div class="card-header">
                <div class="card-icon red">🔑</div>
                <h3>SSH 连接</h3>
            </div>
            <div class="form-row">
                <div class="form-group" style="grid-column:1 / -1">
                    <label>服务器 IP</label>
                    <input name="ssh_host" placeholder="140.143.168.25" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>SSH 端口</label>
                    <input name="ssh_port" type="number" value="22">
                </div>
                <div class="form-group">
                    <label>SSH 用户名 <span class="hint">· 可留空，运行时输入</span></label>
                    <input name="ssh_username" placeholder="root">
                </div>
            </div>
            <div class="form-group">
                <label>SSH 私钥路径 <span class="hint">· 可选，如 ~/.ssh/id_rsa</span></label>
                <input name="ssh_privateKey" placeholder="~/.ssh/id_rsa">
            </div>
        </div>

        <!-- 高级 -->
        <div class="card" id="section-advanced">
            <div class="card-header">
                <div class="card-icon blue">⚙</div>
                <h3>高级选项</h3>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>代理路径 <span class="hint">· Nginx location</span></label>
                    <input name="proxy_target" placeholder="/api">
                </div>
                <div class="form-group">
                    <label>代理目标地址</label>
                    <input name="proxy_proxy_pass" placeholder="http://localhost:4000">
                </div>
            </div>
            <div class="form-group">
                <label>部署前钩子 <span class="hint">· 每行一个命令</span></label>
                <textarea name="hooks_beforeDeploy" placeholder="echo "部署开始"
        npm run backup"></textarea>
            </div>
            <div class="form-group">
                <label>部署后钩子 <span class="hint">· 每行一个命令</span></label>
                <textarea name="hooks_afterDeploy" placeholder="curl -X POST https://webhook.example.com/deploy-success"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>健康检查 · 重试次数</label>
                    <input name="hc_retries" type="number" value="12">
                </div>
                <div class="form-group">
                    <label>健康检查 · 间隔(ms)</label>
                    <input name="hc_interval" type="number" value="5000">
                </div>
            </div>
        </div>
    </form>
    </div><!-- /main-inner -->
</div>

<!-- ====== BOTTOM BAR ====== -->
<div class="bottom-bar">
    <div class="status" id="statusBar">💡 共 5 个步骤，按顺序填写</div>
    <div class="btn-group">
        <button type="button" class="btn btn-ghost" onclick="fillExample()">✨ 填入示例</button>
        <button type="button" class="btn btn-primary" id="submitBtn" onclick="handleSubmit()">
            ⚡ 生成配置
        </button>
    </div>
</div>

<!-- ====== TOAST ====== -->
<div class="toast-container" id="toastContainer"></div>

<!-- ====== PREVIEW MODAL ====== -->
<div class="modal-overlay" id="previewModal">
    <div class="modal">
        <div class="success-badge">✅ 配置已生成</div>
        <h2>deploy.config.js</h2>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px" id="previewPath"></p>
        <pre id="previewContent"></pre>
        <div class="btn-row">
            <button class="btn btn-ghost" onclick="closeModal()">关闭</button>
            <button class="btn btn-primary" onclick="closeModal()">开始部署 →</button>
        </div>
    </div>
</div>

<script>
// ====== 类型联动 ======
var typeMap = {
    web: [{v:'docker',t:'Docker'},{v:'Nginx',t:'Nginx (静态)'}],
    node: [{v:'docker',t:'Docker'},{v:'pm2',t:'PM2'}]
}
var typeSelect = document.getElementById('projectType')
var modeSelect = document.getElementById('deployMode')

function updateModes() {
    var modes = typeMap[typeSelect.value]
    modeSelect.innerHTML = modes.map(function(m){ return '<option value="'+m.v+'">'+m.t+'</option>' }).join('')
}
typeSelect.onchange = updateModes
updateModes()

// ====== 侧边栏导航高亮 ======
var navItems = document.querySelectorAll('.nav-item')
var sections = document.querySelectorAll('.card')
var mainEl = document.querySelector('.main')

navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault()
        var target = document.getElementById(this.dataset.target)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
})

mainEl.addEventListener('scroll', function() {
    var scrollPos = mainEl.scrollTop + 120
    var current = 'section-project'
    sections.forEach(function(sec) {
        if (sec.offsetTop <= scrollPos) current = sec.id
    })
    navItems.forEach(function(item) {
        item.classList.toggle('active', item.dataset.target === current)
    })
})

// ====== Toast ======
function showToast(msg, type) {
    var container = document.getElementById('toastContainer')
    var el = document.createElement('div')
    el.className = 'toast ' + type
    el.innerHTML = (type === 'success' ? '✓ ' : '✗ ') + msg
    container.appendChild(el)
    setTimeout(function() {
        el.style.opacity = '0'; el.style.transition = 'opacity .2s'
        setTimeout(function() { el.remove() }, 200)
    }, 3500)
}

// ====== 填入示例 ======
function fillExample() {
    document.querySelector('[name=name]').value = 'vue3-demo'
    document.querySelector('[name=port]').value = '9000'
    typeSelect.value = 'web'; updateModes()
    document.querySelector('[name=deployMode]').value = 'docker'
    document.querySelector('[name=buildCommand]').value = 'npm run build'
    document.querySelector('[name=assetDir]').value = 'dist'
    document.querySelector('[name=remoteDirectory]').value = '/root/web'
    document.querySelector('[name=ssh_host]').value = '140.143.168.25'
    document.querySelector('[name=ssh_port]').value = '22'
    showToast('已填入示例配置', 'success')
}

// ====== 构建配置对象 ======
function buildConfig(formData) {
    var cfg = {
        name: formData.get('name'),
        type: formData.get('type'),
        deployMode: formData.get('deployMode'),
        port: parseInt(formData.get('port')) || 9000,
        buildCommand: formData.get('buildCommand') || '',
        assetDir: formData.get('assetDir') || 'dist',
        remoteDirectory: formData.get('remoteDirectory') || '/root/web',
        useBuiltInTemplates: formData.get('useBuiltInTemplates') === 'on',
        ssh: {
            host: formData.get('ssh_host') || '',
            port: parseInt(formData.get('ssh_port')) || 22,
            username: formData.get('ssh_username') || '',
            password: ''
        }
    }

    var pk = formData.get('ssh_privateKey')
    if (pk) cfg.ssh.privateKey = pk

    var pt = formData.get('proxy_target')
    var pp = formData.get('proxy_proxy_pass')
    if (pt && pp) cfg.proxy = { target: pt, proxy_pass: pp }

    cfg.hooks = {}
    var bd = formData.get('hooks_beforeDeploy')
    var ad = formData.get('hooks_afterDeploy')
    if (bd) cfg.hooks.beforeDeploy = bd.split('\\n').filter(function(l){ return l.trim() })
    if (ad) cfg.hooks.afterDeploy = ad.split('\\n').filter(function(l){ return l.trim() })
    if (!cfg.hooks.beforeDeploy && !cfg.hooks.afterDeploy) delete cfg.hooks

    cfg.healthCheck = {
        enabled: true,
        retries: parseInt(formData.get('hc_retries')) || 12,
        interval: parseInt(formData.get('hc_interval')) || 5000,
        path: '/'
    }

    return cfg
}

// ====== 提交 ======
function handleSubmit() {
    var formData = new FormData(document.getElementById('configForm'))
    var config = buildConfig(formData)
    var btn = document.getElementById('submitBtn')
    var statusBar = document.getElementById('statusBar')

    btn.disabled = true
    btn.innerHTML = '⏳ 生成中...'
    statusBar.textContent = '⏳ 正在生成配置文件...'

    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    })
    .then(function(r){ return r.json() })
    .then(function(data) {
        btn.disabled = false
        btn.innerHTML = '⚡ 生成配置'
        if (data.success) {
            statusBar.textContent = '✅ 配置文件已生成！'
            document.getElementById('previewPath').textContent = '📁 ' + data.file
            document.getElementById('previewContent').textContent = data.preview
            document.getElementById('previewModal').classList.add('show')
        } else {
            statusBar.textContent = '❌ ' + data.error
            showToast(data.error, 'error')
        }
    })
    .catch(function(err){
        btn.disabled = false
        btn.innerHTML = '⚡ 生成配置'
        statusBar.textContent = '💡 共 5 个步骤，按顺序填写'
        showToast('请求失败: ' + err.message, 'error')
    })
}

function closeModal() {
    document.getElementById('previewModal').classList.remove('show')
}
</script>
</body>
</html>`
}

/**
 * 启动配置 UI 服务
 * @param {string} cwd - 工作目录
 * @returns {Promise<void>}
 */
function startConfigUi(cwd) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

            if (req.method === 'OPTIONS') {
                res.writeHead(204)
                return res.end()
            }

            if (req.method === 'GET' && req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                return res.end(getHtml())
            }

            if (req.method === 'POST' && req.url === '/save') {
                let body = ''
                req.on('data', chunk => body += chunk)
                req.on('end', () => {
                    try {
                        const config = JSON.parse(body)
                        const configContent = 'module.exports = ' + JSON.stringify(config, null, 4) + '\n'
                        const targetPath = path.join(cwd, 'deploy.config.js')

                        if (fs.existsSync(targetPath)) {
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                            return res.end(JSON.stringify({ success: false, error: 'deploy.config.js 已存在，请先删除或重命名' }))
                        }

                        fs.writeFileSync(targetPath, configContent, 'utf8')
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                        res.end(JSON.stringify({ success: true, file: targetPath, preview: configContent }))

                        // 1 秒后关闭服务
                        setTimeout(() => {
                            server.close()
                            resolve()
                        }, 1000)
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
                        res.end(JSON.stringify({ success: false, error: e.message }))
                    }
                })
                return
            }

            res.writeHead(404)
            res.end('Not Found')
        })

        server.listen(PORT, () => {
            console.log(`\n🌐 配置生成器已启动: http://localhost:${PORT}`)
            console.log('📝 请在浏览器中填写配置项，提交后将自动生成 deploy.config.js\n')

            // 自动打开浏览器
            const platform = process.platform
            const url = `http://localhost:${PORT}`
            if (platform === 'darwin') {
                exec(`open "${url}"`)
            } else if (platform === 'win32') {
                exec(`start "" "${url}"`)
            } else {
                exec(`xdg-open "${url}"`)
            }
        })

        server.on('error', reject)
    })
}

module.exports = { startConfigUi }
