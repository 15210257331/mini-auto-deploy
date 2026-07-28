const path = require('path')
const fs = require('fs')
const SSHClient = require('../shell/ssh')
const Logger = require('../logger')
const { escapeShell } = require('../shell/escape')
const { execLocalShell } = require('../shell/local')
const { healthCheck } = require('../healthCheck')

/**
 * BaseDeployer — 部署器基类（模板方法模式）
 *
 * 子类必须实现: getModeName(), buildRemoteScript()
 * 子类可选覆盖: needBuild(), getTarFiles(), getTarExtraArgs(), getCleanupFiles(),
 *               beforeDeploy(), getHealthCheckPort(), supportsRollback()
 *
 * 构造函数选项(opts):
 *   dryRun      — 仅打印不执行
 *   skipBuild   — 跳过本地构建
 *   skipUpload  — 跳过上传和远程操作（仅本地构建+打包）
 */
class BaseDeployer {
    /**
     * @param {object} config - 部署配置
     * @param {object} [opts] - 运行时选项
     */
    constructor(config, opts = {}) {
        this.config = config
        this.opts = opts
        this.logger = new Logger()
        this.client = new SSHClient(config.ssh, this.logger)
    }

    // ========== 子类必须实现 ==========

    getModeName() { throw new Error('子类必须实现 getModeName()') }
    buildRemoteScript() { throw new Error('子类必须实现 buildRemoteScript()') }

    // ========== 子类可选覆盖 ==========

    needBuild() { return true }
    supportsRollback() { return false }

    getHealthCheckPort() {
        return this.config.deployMode === 'Nginx' ? 80 : this.config.port
    }

    getTarFiles() {
        const { assetDir } = this.config
        return ['Dockerfile', 'nginx.conf', assetDir || 'dist']
    }
    getTarExtraArgs() { return '' }
    getCleanupFiles() { return ['assets.tar.gz', 'Dockerfile', 'nginx.conf'] }
    async beforeDeploy() {}

    // ========== 模板方法 ==========

    async deploy() {
        try {
            await this.beforeDeploy()
            await this._runHooks('beforeDeploy')

            if (this.opts.dryRun) {
                this.logger.log('🔍 [DRY-RUN 模式] 以下为将要执行的步骤:')
            }

            this.logger.log('\n\n\n🚀 开始部署流程')

            // 1. 构建
            if (!this.opts.skipBuild && this.needBuild()) {
                const { buildCommand } = this.config
                if (buildCommand) {
                    await execLocalShell(buildCommand, '代码构建', this.logger, { dryRun: this.opts.dryRun })
                }
            } else if (this.opts.skipBuild) {
                this.logger.log('⏭ 跳过本地构建')
            }

            // 2. 打包
            if (!this.opts.dryRun || !this.opts.skipUpload) {
                await this.doPackage()
            }

            // 3. 上传 & 远程部署
            if (!this.opts.skipUpload) {
                if (!this.opts.dryRun) await this.client.connect()
                await this.doUpload()
                await this._doRemoteDeploy()
            } else {
                this.logger.log('⏭ 跳过上传和远程部署')
            }

            // 4. 健康检查
            if (!this.opts.skipUpload && !this.opts.dryRun) {
                await this._doHealthCheck()
            }

            await this._runHooks('afterDeploy')

            this.logger.log(`✅ ${this.getModeName()}部署成功`)
        } catch (err) {
            this.logger.error(`❌ 部署失败: ${err.message || err}`)
            if (!this.opts.dryRun && this.supportsRollback()) {
                await this._doRollback()
            }
            throw err
        } finally {
            await this.doCleanup()
            this.client.disconnect()
        }
    }

    // ========== 内部方法 ==========

    async doPackage() {
        const files = this.getTarFiles()
        const escapedFiles = files.map(f => escapeShell(f)).join(' ')
        const extraArgs = this.getTarExtraArgs()
        const tarCmd = `tar ${extraArgs} -zcvf assets.tar.gz ${escapedFiles}`
        this.logger.log('📦 正在打包...')
        await execLocalShell(tarCmd, '静态资源打包', this.logger, { dryRun: this.opts.dryRun })
    }

    async doUpload() {
        const { remoteDirectory } = this.config
        await this.client.upload('./assets.tar.gz', path.join(remoteDirectory, 'assets.tar.gz'))
    }

    async doCleanup() {
        const files = this.getCleanupFiles()
        for (const f of files) {
            try {
                await fs.promises.unlink(f)
                this.logger.log(`已清理临时文件: ${f}`)
            } catch (e) {
                if (e.code !== 'ENOENT') {
                    this.logger.error(`清理文件 ${f} 失败: ${e.message}`)
                }
            }
        }
    }

    /** 远程部署（支持回滚） */
    async _doRemoteDeploy() {
        const remoteScript = this.buildRemoteScript()
        if (this.supportsRollback()) {
            // 先保留旧镜像
            const name = escapeShell(this.config.name)
            try {
                await this.client.execRemoteShell(
                    `sudo docker tag ${name} ${name}:previous 2>/dev/null || true\nexit`,
                    '备份旧镜像',
                    { dryRun: this.opts.dryRun }
                )
            } catch (e) {
                this.logger.log('⚠️ 无旧镜像可备份，跳过')
            }
        }

        await this.client.execRemoteShell(remoteScript, '远程部署', { dryRun: this.opts.dryRun })
    }

    /** 健康检查 */
    async _doHealthCheck() {
        const hc = this.config.healthCheck || {}
        if (hc.enabled === false) return

        const host = this.config.ssh.host
        const port = this.getHealthCheckPort()
        const retries = hc.retries || 12
        const interval = hc.interval || 5000
        const requestPath = hc.path || '/'

        try {
            await healthCheck(host, port, this.logger, { retries, interval, path: requestPath })
        } catch (e) {
            this.logger.error(`❌ 健康检查失败: ${e.message}`)
            throw e
        }
    }

    /** 回滚 */
    async _doRollback() {
        const name = escapeShell(this.config.name)
        this.logger.log('🔄 尝试回滚到上一版本...')
        try {
            await this.client.execRemoteShell(`
                sudo docker stop ${name} || true
                sudo docker rm ${name} || true
                sudo docker tag ${name}:previous ${name} || true
                sudo docker run -d -p ${escapeShell(this.config.port)}:${escapeShell(this.getHealthCheckPort())} --name ${name} ${name}
                exit
            `, '回滚到上一版本')
            this.logger.log('✅ 已回滚到上一版本')
        } catch (e) {
            this.logger.error(`❌ 回滚失败: ${e.message}`)
        }
    }

    /** 执行钩子脚本 */
    async _runHooks(hookName) {
        const hooks = this.config.hooks && this.config.hooks[hookName]
        if (!hooks || !Array.isArray(hooks)) return

        for (const cmd of hooks) {
            if (typeof cmd === 'string' && cmd.trim()) {
                this.logger.log(`🪝 执行钩子 [${hookName}]: ${cmd}`)
                try {
                    await execLocalShell(cmd, `钩子:${hookName}`, this.logger, { dryRun: this.opts.dryRun })
                } catch (e) {
                    this.logger.error(`⚠️ 钩子 [${hookName}] 执行失败(继续部署): ${e.message}`)
                }
            }
        }
    }
}

module.exports = BaseDeployer
