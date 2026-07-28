#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))
const dotenv = require('dotenv')
const { version } = require('../package.json')
const getDeployer = require('../lib/index')
const { showHelp } = require('../lib/helpText')
const { loadConfig, printConfig } = require('../lib/config/loader')
const { startConfigUi } = require('../lib/configUi')

// ========== 命令处理 ==========

if (argv.help)   { showHelp(); process.exit(0) }
if (argv.version) { console.log(chalk.cyan(`auto-mini-deploy 版本: v${version}`)); process.exit(0) }

if (argv.init) {
    const templatePath = path.resolve(__dirname, '../templates/deploy.config.js')
    const targetPath = path.resolve(process.cwd(), 'deploy.config.js')
    if (fs.existsSync(targetPath)) {
        console.log(chalk.yellow('⚠️ 当前目录已存在 deploy.config.js，未进行覆盖。'))
    } else {
        fs.copyFileSync(templatePath, targetPath)
        console.log(chalk.green(`✅ 已成功生成配置文件到: ${targetPath}`))
    }
    process.exit(0)
}

if (argv['init-ui'] || argv.initUi) {
    startConfigUi(process.cwd())
        .then(() => {
            console.log(chalk.green('\n✅ 配置文件已生成，可运行 deploy 开始部署'))
            process.exit(0)
        })
        .catch(err => {
            console.error(chalk.red('配置 UI 启动失败:'), err.message)
            process.exit(1)
        })
    return // 阻止继续执行部署流程
}

// ========== 部署流程 ==========

dotenv.config()

const { config, dryRun, skipBuild, skipUpload } = loadConfig(argv)

if (dryRun) {
    console.log(chalk.cyan('🔍 DRY-RUN 模式 — 仅打印执行计划，不实际操作\n'))
}

process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️ 用户取消部署'))
    process.exit(130)
})

inquirer
    .prompt([
        { type: 'input',   name: 'username', message: '请输入服务器用户名:', validate: v => v.trim() ? true : '用户名不能为空' },
        { type: 'password', name: 'password', message: '请输入服务器密码(使用密钥登录请留空):', mask: '*' }
    ])
    .then(answers => {
        if (answers.username) config.ssh.username = answers.username
        if (answers.password) config.ssh.password = answers.password
        printConfig(config)
        return getDeployer(config, { dryRun, skipBuild, skipUpload }).deploy()
    })
    .then(() => process.exit(0))
    .catch(err => {
        console.error(chalk.red('部署失败:'), err.message || err)
        process.exit(1)
    })
