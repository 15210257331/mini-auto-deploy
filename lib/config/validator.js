/**
 * 验证部署配置（在交互输入凭证之前调用）。
 * 注意：ssh.username 和 ssh.password 在运行时交互输入，此处不校验。
 *
 * @param {object} config - 用户配置
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config) {
    const errors = []

    if (!config) {
        return { valid: false, errors: ['配置对象不能为空'] }
    }

    // ---- 必填字段 ----

    if (!config.name || typeof config.name !== 'string') {
        errors.push('name 必须是非空字符串')
    }

    const validTypes = ['web', 'node']
    if (!validTypes.includes(config.type)) {
        errors.push(`type 必须是 ${validTypes.join(' 或 ')}，当前值: ${config.type}`)
    }

    const validModes = ['docker', 'pm2', 'Nginx']
    if (!validModes.includes(config.deployMode)) {
        errors.push(`deployMode 必须是 ${validModes.join('、')} 之一，当前值: ${config.deployMode}`)
    }

    // ---- type + deployMode 兼容性 ----

    const ALLOWED_COMBOS = {
        web: ['docker', 'Nginx'],
        node: ['docker', 'pm2']
    }

    if (config.type && config.deployMode) {
        const allowed = ALLOWED_COMBOS[config.type]
        if (allowed && !allowed.includes(config.deployMode)) {
            errors.push(`${config.type} 类型不支持 ${config.deployMode} 部署模式`)
        }
    }

    // ---- port ----

    const port = Number(config.port)
    if (isNaN(port) || port < 1 || port > 65535 || !Number.isInteger(port)) {
        errors.push(`port 必须是 1-65535 之间的整数，当前值: ${config.port}`)
    }

    // ---- remoteDirectory ----

    if (!config.remoteDirectory || typeof config.remoteDirectory !== 'string') {
        errors.push('remoteDirectory 必须是非空字符串')
    }

    // ---- ssh (仅校验 host，username/password 交互输入) ----

    if (!config.ssh || typeof config.ssh !== 'object') {
        errors.push('ssh 配置不能为空')
    } else {
        if (!config.ssh.host) {
            errors.push('ssh.host 不能为空')
        }
    }

    return { valid: errors.length === 0, errors }
}

module.exports = { validateConfig }
