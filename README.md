# mini-auto-deploy

一键自动部署 CLI 工具 — 本地构建 → 打包 → SFTP 上传 → 远程部署 Web/Node.js 应用到 Linux 服务器。

[![npm version](https://img.shields.io/badge/npm-v1.1.2-blue)](https://www.npmjs.com/package/mini-auto-deploy)
[![license](https://img.shields.io/badge/license-ISC-green)](LICENSE)

## 快速开始

```bash
# 安装
npm install -g mini-auto-deploy

# 生成配置文件
deploy --init        # 命令行模板
deploy --init-ui     # Web 可视化页面（推荐）

# 部署
deploy
```

## 支持的部署方式

| 项目类型 | 部署方式 | 说明 |
|---------|---------|------|
| Web 前端 (Vue/React) | `docker` | Docker + Nginx 容器化部署 |
| Web 前端 | `Nginx` | 直接部署静态文件到 Nginx 目录 |
| Node.js 后端 | `docker` | Docker 容器化部署 |
| Node.js 后端 | `pm2` | PM2 进程管理器部署 |

## 功能特性

- 🔐 **SSH 密码 / 密钥双认证** — 支持密码登录和私钥免密登录
- 🛡 **命令注入防护** — 所有参数经 shell 转义，安全拼接远程命令
- ⏱ **超时保护** — SSH 连接 30s 超时，远程执行 5min 超时
- ✅ **部署后健康检查** — 自动轮询目标 URL 验证服务可用
- 🔄 **失败自动回滚** — Docker 部署失败自动恢复上一版本镜像
- 🪝 **部署钩子** — 部署前后可执行自定义脚本
- 🌍 **多环境配置** — `deploy --env staging` 加载不同环境配置
- 🔍 **dry-run 模式** — `deploy --dry-run` 仅打印计划不执行
- ⏭ **跳过步骤** — `--skip-build` / `--skip-upload` 灵活控制
- 📝 **完整日志** — 所有操作记录到 `deploy.log`

## CLI 选项

```text
deploy [选项]

  --config <path>     指定配置文件路径
  --env <name>         多环境配置 (deploy.config.<name>.js)
  --dry-run            仅打印执行计划，不实际操作
  --skip-build         跳过构建步骤
  --skip-upload        跳过上传和远程部署步骤
  --version            显示版本号
  --init               生成配置文件模板
  --init-ui            打开 Web 页面可视化配置
  --help               显示帮助信息
```

## 配置文件

运行 `deploy --init` 或 `deploy --init-ui` 生成 `deploy.config.js`：

```js
module.exports = {
    name: 'my-app',               // 项目名称
    type: 'web',                  // 项目类型: web | node
    deployMode: 'docker',         // 部署方式: docker | pm2 | Nginx
    port: 9000,                   // 服务端口
    buildCommand: 'npm run build',// 构建命令
    assetDir: 'dist',             // 构建产物目录
    remoteDirectory: '/root/web', // 服务器部署目录
    useBuiltInTemplates: true,    // 是否使用内置 Dockerfile/nginx.conf 模板

    // 代理配置（web 项目 Nginx 转发）
    proxy: {
        target: '/api',
        proxy_pass: 'http://localhost:4000'
    },

    // SSH 连接
    ssh: {
        host: '140.143.168.25',
        port: 22,
        username: '',             // 运行时交互输入
        password: '',             // 运行时交互输入（密钥登录留空）
        privateKey: '',           // SSH 私钥路径，如 ~/.ssh/id_rsa
        passphrase: ''            // 私钥密码（可选）
    },

    // 部署钩子（可选）
    hooks: {
        beforeDeploy: ['echo "开始部署"'],
        afterDeploy: ['curl -X POST https://webhook.example.com']
    },

    // 健康检查（仅 Docker 部署）
    healthCheck: {
        enabled: true,            // 是否启用
        retries: 12,              // 重试次数
        interval: 5000,           // 间隔(毫秒)
        path: '/'                 // 检查路径
    }
}
```

## 环境变量

环境变量优先于配置文件，适合管理敏感信息：

| 变量 | 说明 |
|------|------|
| `DEPLOY_SSH_HOST` | SSH 服务器 IP |
| `DEPLOY_SSH_PORT` | SSH 端口 |
| `DEPLOY_PROJECT_NAME` | 项目名称 |
| `DEPLOY_REMOTE_DIR` | 服务器部署目录 |

```bash
# .env 文件示例
DEPLOY_SSH_HOST=140.143.168.25
DEPLOY_SSH_PORT=22
```

## 多环境部署

```bash
deploy --env staging     # 加载 deploy.config.staging.js
deploy --env production  # 加载 deploy.config.production.js
```

## 使用示例

```bash
# 标准部署
deploy

# 仅构建和打包，不上传
deploy --skip-upload

# 预览执行计划
deploy --dry-run

# 使用密钥登录
# 在 deploy.config.js 中设置 ssh.privateKey 即可

# 多环境
deploy --env staging
deploy --env production
```

## 部署流水线

```text
本地构建 → tar 打包 → SSH 连接 → SFTP 上传 → 远程解压
    → 停旧容器 → 构建镜像 → 启动容器 → 健康检查 → 清理临时文件
```

Docker 部署失败时自动回滚到上一版本镜像。

## 开发

```bash
git clone <repo>
cd mini-auto-deploy
npm install
npm test          # 运行 60 个测试用例
node bin/deploy.js --help
```

## License

ISC
