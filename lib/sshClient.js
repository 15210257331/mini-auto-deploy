const fs = require('fs')
const { exec } = require('child_process')
const path = require('path')
const { Client } = require('ssh2')
const chalk = require('chalk')

class SSHClient {
    constructor(config) {
        this.config = config
        this.client = new Client()
        this.logPath = path.join(process.cwd(), 'deploy.log')
    }

    // 连接服务器
    connect() {
        this.log(`连接服务器`)
        return new Promise((resolve, reject) => {
            this.client
                .on('ready', () => {
                    resolve()
                    this.log(`服务器连接成功`)
                })
                .on('error', (err) => {
                    reject()
                    this.log(`服务器连接失败` + err)
                })
                .connect(this.config);
        });
    }
    // 断开连接
    disconnect() {
        this.log(`断开服务器链接`)
        this.client.end()
    }
    // 上传文件并将文件解压到目标文件夹中
    upload(localPath, remotePath) {
        this.log(`上传文件到服务器 ${localPath} ========> ${remotePath}`)
        return new Promise((resolve, reject) => {
            this.client.sftp((err, sftp) => {
                if (err) return reject(err)
                sftp.fastPut(localPath, remotePath, {}, async (err) => {
                    if (err) {
                        this.log(`文件上传失败` + err)
                        return reject(err)

                    }
                    resolve();
                    this.log(`文件上传成功`)
                })
            })
        })
    }

    // 删除本地资源
    async deleteFiles(filePaths) {
        this.log(`删除本地文件` + filePaths)
        if (!Array.isArray(filePaths)) {
            return Promise.reject(new Error('filePaths must be an array of strings'));
        }
        const tasks = filePaths.map(filePath =>
            fs.promises.unlink(filePath)
                .then(() => ({ status: 'success', file: filePath }))
                .catch(error => ({ status: 'failed', file: filePath, error }))
        );
        return Promise.all(tasks).then(results => {
            const success = results.filter(r => r.status === 'success').map(r => r.file);
            const failed = results.filter(r => r.status === 'failed').map(r => ({
                file: r.file,
                error: r.error
            }));
            return { success, failed };
        });
    }

    // 执行本地的shell命令
    async execLocalShell(shell, message) {
        this.log(`开始【${message}】流程`)
        return new Promise((resolve, reject) => {
            const p = exec(shell)
            p.stdout.pipe(process.stdout)
            p.stderr.pipe(process.stderr)
            p.on('exit', (code, signal) => {
                if (code === 0) {
                    resolve()
                    this.log(`【${message}】执行成功`)
                } else {
                    reject(`执行失败`)
                    this.log(`【${message}】执行失败` + signal)
                }
            })
        })
    }

    // 通过ssh2 链接服务器执行远程的shell命令
    async execRemoteShell(shell, message) {
        this.log(`开始【${message}】流程`)
        return new Promise((resolve, reject) => {
            this.client.shell((err, stream) => {
                if (err) {
                    this.log(`【${message}】执行失败` + err)
                    return reject(err)
                }
                stream.end(shell)
                stream.on('data', data => {
                    console.log(data.toString())
                })
                stream.on('close', () => {
                    resolve()
                    this.log(`【${message}】执行成功`)
                })
            })
        })
    }

    log(msg) {
        const time = new Date().toISOString()
        fs.appendFileSync(this.logPath, `[${time}] ${msg}\\n`)
        console.log(chalk.green(msg))
    }

}

module.exports = SSHClient