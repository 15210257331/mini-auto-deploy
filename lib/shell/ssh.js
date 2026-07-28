const { Client } = require('ssh2')
const fs = require('fs')
const Logger = require('../logger')

const DEFAULT_CONNECT_TIMEOUT = 30000
const DEFAULT_EXEC_TIMEOUT = 300000

class SSHClient {
    /**
     * @param {object} sshConfig - { host, port, username, password, privateKey, passphrase }
     * @param {Logger} [logger]
     */
    constructor(sshConfig, logger) {
        this.config = sshConfig
        this.client = new Client()
        this.logger = logger || new Logger()
    }

    /** 构建 ssh2 连接参数 */
    _buildConnectConfig() {
        const cfg = {
            host: this.config.host,
            port: this.config.port || 22,
            username: this.config.username,
            readyTimeout: DEFAULT_CONNECT_TIMEOUT
        }
        // 密钥优先于密码
        if (this.config.privateKey) {
            cfg.privateKey = this._readKey(this.config.privateKey)
            if (this.config.passphrase) {
                cfg.passphrase = this.config.passphrase
            }
        } else if (this.config.password) {
            cfg.password = this.config.password
        }
        return cfg
    }

    /** 读取私钥文件内容 */
    _readKey(keyPath) {
        if (keyPath.startsWith('-----BEGIN')) {
            return keyPath // 直接是密钥内容
        }
        const resolved = keyPath.startsWith('~')
            ? keyPath.replace(/^~/, process.env.HOME || '/root')
            : keyPath
        if (!fs.existsSync(resolved)) {
            throw new Error(`SSH 私钥文件不存在: ${resolved}`)
        }
        return fs.readFileSync(resolved, 'utf8')
    }

    connect() {
        this.logger.log('连接服务器...')
        const connectConfig = this._buildConnectConfig()
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.client.end()
                reject(new Error(`SSH 连接超时 (${DEFAULT_CONNECT_TIMEOUT / 1000}s)`))
            }, DEFAULT_CONNECT_TIMEOUT)

            this.client
                .on('ready', () => {
                    clearTimeout(timer)
                    this.logger.log('✅ 服务器连接成功')
                    resolve()
                })
                .on('error', (err) => {
                    clearTimeout(timer)
                    this.logger.error('❌ 服务器连接失败: ' + err.message)
                    reject(err)
                })
                .connect(connectConfig)
        })
    }

    disconnect() {
        this.logger.log('断开服务器连接')
        this.client.end()
    }

    upload(localPath, remotePath) {
        this.logger.log(`上传文件: ${localPath} => ${remotePath}`)
        return new Promise((resolve, reject) => {
            this.client.sftp((err, sftp) => {
                if (err) {
                    this.logger.error('❌ SFTP 初始化失败: ' + err)
                    return reject(err)
                }
                sftp.fastPut(localPath, remotePath, {}, (err) => {
                    if (err) {
                        this.logger.error('❌ 文件上传失败: ' + err)
                        return reject(err)
                    }
                    this.logger.log('✅ 文件上传成功')
                    resolve()
                })
            })
        })
    }

    execRemoteShell(shell, message, { dryRun } = {}) {
        if (dryRun) {
            this.logger.log(`[DRY-RUN] 远程执行: ${message}`)
            this.logger.log(`[DRY-RUN] 命令:\n${shell}`)
            return Promise.resolve({ stdout: '', stderr: '', code: 0 })
        }

        this.logger.log(`开始【${message}】流程...`)
        return new Promise((resolve, reject) => {
            this.client.exec(shell, (err, stream) => {
                if (err) {
                    this.logger.error(`❌ 【${message}】执行失败: ` + err)
                    return reject(err)
                }

                const timer = setTimeout(() => {
                    stream.close()
                    reject(new Error(`远程命令执行超时 (${DEFAULT_EXEC_TIMEOUT / 1000}s): ${message}`))
                }, DEFAULT_EXEC_TIMEOUT)

                let stdout = ''
                let stderr = ''
                stream.on('data', (data) => {
                    const text = data.toString()
                    stdout += text
                    this.logger.log(text.trimEnd())
                })
                stream.stderr.on('data', (data) => {
                    const text = data.toString()
                    stderr += text
                    this.logger.error(text.trimEnd())
                })
                stream.on('close', (code) => {
                    clearTimeout(timer)
                    if (code === 0) {
                        this.logger.log(`✅ 【${message}】执行成功`)
                        resolve({ stdout, stderr, code })
                    } else {
                        const errMsg = `❌ 【${message}】执行失败，退出码: ${code}`
                        this.logger.error(errMsg)
                        reject(new Error(`${errMsg}\nstderr: ${stderr}`))
                    }
                })
            })
        })
    }
}

module.exports = SSHClient
