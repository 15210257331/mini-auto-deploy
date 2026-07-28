const { exec } = require('child_process')

/**
 * 执行本地 shell 命令
 * @param {string} shell - 要执行的命令
 * @param {string} message - 描述信息
 * @param {object} logger - Logger 实例
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun] - 仅打印不执行
 * @returns {Promise<void>}
 */
function execLocalShell(shell, message, logger, { dryRun } = {}) {
    if (dryRun) {
        logger.log(`[DRY-RUN] 本地执行: ${message}`)
        logger.log(`[DRY-RUN] 命令: ${shell}`)
        return Promise.resolve()
    }

    logger.log(`开始【${message}】流程...`)
    return new Promise((resolve, reject) => {
        const p = exec(shell)
        p.stdout.pipe(process.stdout)
        p.stderr.pipe(process.stderr)
        p.on('exit', (code) => {
            if (code === 0) {
                logger.log(`✅ 流程【${message}】执行成功`)
                resolve()
            } else {
                const errMsg = `❌ 流程【${message}】执行失败，退出码: ${code}`
                logger.error(errMsg)
                reject(new Error(errMsg))
            }
        })
    })
}

module.exports = { execLocalShell }
