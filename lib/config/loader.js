const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const { validateConfig } = require('./validator')

/**
 * 加载并返回部署配置。
 * 1. 解析配置文件（--config > deploy.config.[env.]js > .cjs > .mjs）
 * 2. 合并环境变量（环境变量优先）
 * 3. 验证配置，失败时退出进程
 *
 * @param {object} argv - minimist 解析的命令行参数
 * @returns {{ config: object, dryRun: boolean, skipBuild: boolean, skipUpload: boolean }}
 */
function loadConfig(argv) {
    const env = argv.env || argv.e

    // ---- 构建候选文件名（支持 --env 多环境） ----
    const bases = []
    if (argv.config) {
        bases.push(argv.config)
    }
    if (env) {
        bases.push(`deploy.config.${env}.js`, `deploy.config.${env}.cjs`, `deploy.config.${env}.mjs`)
    }
    bases.push('deploy.config.js', 'deploy.config.cjs', 'deploy.config.mjs')

    const candidates = bases.filter(Boolean)
    const configFile = candidates.find(file => fs.existsSync(path.resolve(process.cwd(), file)))

    if (!configFile) {
        const envHint = env ? ` (环境: ${env})` : ''
        console.error(chalk.red(`未找到配置文件${envHint}，请提供 --config 或确保 deploy.config.js/cjs/mjs 存在`))
        process.exit(1)
    }

    // ---- 加载配置文件 ----
    const configPath = path.resolve(process.cwd(), configFile)
    let config
    try {
        config = require(configPath)
    } catch (e) {
        console.error(chalk.red(`配置文件语法错误: ${configPath}`))
        console.error(chalk.red(`  ${e.message}`))
        process.exit(1)
    }

    // ---- 合并环境变量（环境变量优先） ----
    config.ssh = config.ssh || {}
    config.ssh.host = process.env.DEPLOY_SSH_HOST || config.ssh.host
    config.ssh.port = parseInt(process.env.DEPLOY_SSH_PORT) || config.ssh.port || 22
    config.name = process.env.DEPLOY_PROJECT_NAME || config.name
    config.remoteDirectory = process.env.DEPLOY_REMOTE_DIR || config.remoteDirectory
    config.port = parseInt(config.port)

    // ---- 验证 ----
    const { valid, errors } = validateConfig(config)
    if (!valid) {
        console.error(chalk.red('配置验证失败:'))
        errors.forEach(e => console.error(chalk.red(`  - ${e}`)))
        process.exit(1)
    }

    return {
        config,
        dryRun: !!(argv['dry-run'] || argv.dryRun),
        skipBuild: !!(argv['skip-build'] || argv.skipBuild),
        skipUpload: !!(argv['skip-upload'] || argv.skipUpload)
    }
}

/**
 * 打印配置（密码脱敏）
 */
function printConfig(config) {
    const safe = { ...config }
    const sshSafe = { ...safe.ssh }
    if (sshSafe.password) sshSafe.password = '******'
    if (sshSafe.privateKey) sshSafe.privateKey = sshSafe.privateKey.length > 20 ? '(密钥内容)' : sshSafe.privateKey
    if (sshSafe.passphrase) sshSafe.passphrase = '******'
    safe.ssh = sshSafe
    console.log('✅ 完整配置项', safe)
}

module.exports = { loadConfig, printConfig }
