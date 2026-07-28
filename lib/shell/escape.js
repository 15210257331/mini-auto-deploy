/**
 * 转义 shell 参数，防止命令注入
 * 用单引号包裹，并将参数内部的单引号转义为 '\''
 */
function escapeShell(arg) {
    if (typeof arg !== 'string') {
        arg = String(arg)
    }
    return `'${arg.replace(/'/g, "'\\''")}'`
}

module.exports = { escapeShell }
