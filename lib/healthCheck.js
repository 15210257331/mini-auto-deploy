const http = require('http')

/**
 * 部署后健康检查 — 轮询 URL 直到返回 2xx 或超时
 *
 * @param {string} host - 服务器 IP
 * @param {number} port - 端口
 * @param {object} logger - Logger 实例
 * @param {object} [opts]
 * @param {number} [opts.retries=12] - 重试次数
 * @param {number} [opts.interval=5000] - 重试间隔(ms)
 * @param {string} [opts.path='/'] - 请求路径
 * @returns {Promise<void>}
 */
function healthCheck(host, port, logger, { retries = 12, interval = 5000, path = '/' } = {}) {
    logger.log(`🔍 健康检查: http://${host}:${port}${path} (最多 ${retries} 次, 间隔 ${interval / 1000}s)`)

    return new Promise((resolve, reject) => {
        let attempt = 0

        function check() {
            attempt++
            const req = http.get(`http://${host}:${port}${path}`, { timeout: 5000 }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    logger.log(`✅ 健康检查通过 (${res.statusCode})，尝试 ${attempt} 次`)
                    res.resume()
                    resolve()
                } else {
                    retry(`HTTP ${res.statusCode}`)
                }
            })
            req.on('error', (err) => retry(err.message))
            req.on('timeout', () => {
                req.destroy()
                retry('请求超时')
            })
        }

        function retry(reason) {
            if (attempt >= retries) {
                reject(new Error(`健康检查失败: ${reason} (已尝试 ${attempt} 次)`))
            } else {
                logger.log(`⏳ 第 ${attempt} 次检查失败 (${reason})，${interval / 1000}s 后重试...`)
                setTimeout(check, interval)
            }
        }

        check()
    })
}

/**
 * 部署后健康检查（web 项目，检查 80 端口）
 */
async function webHealthCheck(host, logger) {
    return healthCheck(host, 80, logger)
}

/**
 * 部署后健康检查（node 项目，检查应用端口）
 */
async function nodeHealthCheck(host, port, logger) {
    return healthCheck(host, port, logger)
}

module.exports = { healthCheck, webHealthCheck, nodeHealthCheck }
