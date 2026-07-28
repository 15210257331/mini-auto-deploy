const chalk = require('chalk')

function showHelp() {
    console.log(`
${chalk.cyan('🌈 auto-mini-deploy 是一个简单的代码部署工具，使用方式如下:')}

${chalk.bold('基本用法:')}
  deploy [选项]

${chalk.bold('所有选项:')}
  --config <path>     指定配置文件路径
  --env <name>         多环境配置 (加载 deploy.config.<name>.js)
  -e <name>           同 --env
  --dry-run            仅打印执行计划，不实际操作
  --skip-build         跳过本地构建步骤
  --skip-upload        跳过上传和远程部署步骤
  --version            显示版本号
  --init               生成默认配置文件 deploy.config.js (命令行模板)
  --init-ui            打开 Web 页面可视化填写配置项
  --help               显示帮助信息

${chalk.bold('配置文件字段说明:')}

  ${chalk.green('name')}                项目名称
  ${chalk.green('type')}                项目类型，可选值: web、node
  ${chalk.green('deployMode')}          部署类型，可选值: docker、pm2、Nginx
  ${chalk.green('port')}                部署端口
  ${chalk.green('buildCommand')}        构建命令，如 npm run build
  ${chalk.green('assetDir')}            构建产物所在目录，如 dist
  ${chalk.green('remoteDirectory')}     服务器部署目录
  ${chalk.green('useBuiltInTemplates')} 是否使用内置 Dockerfile/nginx.conf 模板（true/false）

  ${chalk.green('proxy.target')}        代理的匹配规则
  ${chalk.green('proxy.proxy_pass')}    代理目标地址

  ${chalk.green('ssh.host')}            服务器 IP 地址
  ${chalk.green('ssh.port')}            SSH 端口，默认 22
  ${chalk.green('ssh.username')}        SSH 用户名（运行时交互输入）
  ${chalk.green('ssh.password')}        SSH 密码（运行时交互输入，留空则使用密钥）
  ${chalk.green('ssh.privateKey')}       SSH 私钥路径或内容（~/.ssh/id_rsa）
  ${chalk.green('ssh.passphrase')}       SSH 私钥密码（可选）

  ${chalk.green('hooks.beforeDeploy')}  部署前执行的本地命令数组
  ${chalk.green('hooks.afterDeploy')}   部署成功后执行的本地命令数组

  ${chalk.green('healthCheck.enabled')} 是否启用健康检查，默认 true (仅 Docker 模式)
  ${chalk.green('healthCheck.retries')} 健康检查重试次数，默认 12
  ${chalk.green('healthCheck.interval')}健康检查间隔(毫秒)，默认 5000
  ${chalk.green('healthCheck.path')}    健康检查路径，默认 "/"

${chalk.bold('环境变量（优先于配置文件）:')}
  ${chalk.green('DEPLOY_SSH_HOST')}        覆盖 ssh.host
  ${chalk.green('DEPLOY_SSH_PORT')}        覆盖 ssh.port
  ${chalk.green('DEPLOY_PROJECT_NAME')}    覆盖 name
  ${chalk.green('DEPLOY_REMOTE_DIR')}      覆盖 remoteDirectory

${chalk.bold('多环境示例:')}
  deploy --env staging    # 加载 deploy.config.staging.js
  deploy --env production # 加载 deploy.config.production.js
`)
}

module.exports = { showHelp }
