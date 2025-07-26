#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const Deployer = require('../lib/index')
const argv = require('minimist')(process.argv.slice(2))
const dotenv = require('dotenv')
const { version } = require('../package.json')

if (argv.help) {
  console.log(`\n${chalk.cyan('🌈 auto-mini-deploy 使用帮助')}\n
              ${chalk.bold('用法:')}
               deploy [--config <配置文件路径>] [--version]
            ${chalk.bold('说明:')}
              默认查找 deploy.config.js,可通过 --config 指定配置文件

            ${chalk.bold('选项:')}
              --config     指定配置路径
              --version    显示版本号
              --help       显示帮助信息\n
              ${chalk.bold('配置文件字段说明:')}
              ${chalk.green('name')}               项目名称，对应 Docker 镜像和容器名
              ${chalk.green('type')}               部署类型，例如 docker
              ${chalk.green('port')}               应用容器暴露的端口（如 8080）
              ${chalk.green('buildCommand')}       构建命令，如 npm run build
              ${chalk.green('staticDir')}          构建产物所在目录，如 dist
              ${chalk.green('remoteDirectory')}    服务器部署根目录
              ${chalk.green('useBuiltInTemplates')} 是否使用内置 Dockerfile/nginx.conf 模板（true/false）
          
              ${chalk.green('ssh.host')}           服务器 IP 地址
              ${chalk.green('ssh.port')}           SSH 端口，默认 22
              ${chalk.green('ssh.username')}       SSH 用户名
              ${chalk.green('ssh.password')}       SSH 密码
          
            ${chalk.bold('环境变量支持（可选）:')}
              ${chalk.green('DEPLOY_SSH_HOST')}        覆盖 ssh.host
              ${chalk.green('DEPLOY_SSH_PORT')}        覆盖 ssh.port
              ${chalk.green('DEPLOY_PROJECT_NAME')}    覆盖 name
              ${chalk.green('DEPLOY_REMOTE_DIR')}      覆盖 remoteDirectory

            `)
  process.exit(0)
}

if (argv.version) {
  console.log(chalk.cyan(`auto-mini-deploy 版本: v${version}`))
  process.exit(0)
}
// 用于自动加载 .env 文件中的环境变量到 process.env 中
dotenv.config()
const configPath = path.resolve(process.cwd(), argv.config || 'deploy.config.js')
if (!fs.existsSync(configPath)) {
  console.log(chalk.red(`配置文件不存在: ${configPath}`))
  process.exit(1)
}

const config = require(configPath)
config.ssh.host = config.ssh.host || process.env.DEPLOY_SSH_HOST
config.ssh.port = config.ssh.port || parseInt(process.env.DEPLOY_SSH_PORT || '22')
config.name = config.name || process.env.DEPLOY_PROJECT_NAME
config.remoteDirectory = config.remoteDirectory || process.env.DEPLOY_REMOTE_DIR

inquirer
  .prompt([
    { type: 'input', name: 'username', message: '请输入服务器用户名:' },
    { type: 'password', name: 'password', message: '请输入服务器密码:', mask: '*' }
  ])
  .then(answers => {
    config.ssh.username = answers.username
    config.ssh.password = answers.password
    console.log('完整的配置', config)
    const deployer = new Deployer(config)
    deployer.deploy()
  })