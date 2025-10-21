#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const Deployer = require('../lib/index')
const argv = require('minimist')(process.argv.slice(2))
const dotenv = require('dotenv')
const { version } = require('../package.json')

// 显示使用说明
if (argv.help) {
  console.log(`\n${chalk.cyan('🌈 auto-mini-deploy 使用帮助')}\n
              ${chalk.bold('用法:')}
                deploy [--config <配置文件路径>] [--version]
              ${chalk.bold('说明:')}
                默认查找 deploy.config.js,可通过 --config 指定配置文件
              ${chalk.bold('选项:')}
                --config     指定配置文件路径
                --version    显示版本号
                --init       生成默认配置文件 deploy.config.js
                --help       显示帮助信息\n
              ${chalk.bold('配置文件字段说明:')}

              ${chalk.green('name')}                项目名称
              ${chalk.green('type')}                项目类型,可选值: web、node
              ${chalk.green('deployMode')}          部署类型,可选值 docker pm2 Nginx
              ${chalk.green('port')}                部署端口
              ${chalk.green('buildCommand')}        构建命令，如 npm run build
              ${chalk.green('staticDir')}           构建产物所在目录，如 dist
              ${chalk.green('remoteDirectory')}     服务器部署目录
              ${chalk.green('useBuiltInTemplates')} 是否使用内置 Dockerfile/nginx.conf 模板（true/false）
              ${chalk.green('generateLog')}         是否生成日志（true/false）
              
              ${chalk.green('proxy.location')}      代理的匹配规则
              ${chalk.green('proxy.proxy_pass')}    代理目标地址
             
              ${chalk.green('ssh.host')}            服务器 IP 地址
              ${chalk.green('ssh.port')}            SSH 端口，默认 22
              ${chalk.green('ssh.username')}        SSH 用户名
              ${chalk.green('ssh.password')}        SSH 密码
          
              ${chalk.bold('环境变量支持（可选）:')}
              ${chalk.green('DEPLOY_SSH_HOST')}        覆盖 ssh.host
              ${chalk.green('DEPLOY_SSH_PORT')}        覆盖 ssh.port
              ${chalk.green('DEPLOY_PROJECT_NAME')}    覆盖 name
              ${chalk.green('DEPLOY_REMOTE_DIR')}      覆盖 remoteDirectory
            `)
  process.exit(0)
}
// 打印版本号
if (argv.version) {
  console.log(chalk.cyan(`auto-mini-deploy 版本: v${version}`))
  process.exit(0)
}
// 生成配置文件
if (argv.init) {
  const templatePath = path.resolve(__dirname, '../templates/deploy.config.js')
  const targetPath = path.resolve(process.cwd(), 'deploy.config.js')

  if (fs.existsSync(targetPath)) {
    console.log(chalk.yellow(`⚠️ 当前目录已存在 deploy.config.js，未进行覆盖。`))
  } else {
    fs.copyFileSync(templatePath, targetPath)
    console.log(chalk.green(`✅ 已成功生成配置文件到: ${targetPath}`))
  }
  process.exit(0)
}
// 用于自动加载 .env 文件中的环境变量到 process.env 中
dotenv.config()

/**
 * 拿到配置文件
 * 用户传入的优先级最高
 */
const candidates = [argv.config, 'deploy.config.js', 'deploy.config.cjs', 'deploy.config.mjs'].filter(Boolean) // 去掉 undefined / null
const configFile = candidates.find(file => fs.existsSync(path.resolve(process.cwd(), file)))
if (!configFile) {
  throw new Error('未找到配置文件，请提供 --config 或确保 deploy.config.js/cjs/mjs 存在');
}
const configPath = path.resolve(process.cwd(), configFile);
const config = require(configPath)

/**
 * 合并命令行参数
 */
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
    console.log('✅完整配置项', config)
    const deployer = new Deployer(config)
    deployer.deploy()
  })