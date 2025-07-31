const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const mustache = require('mustache')
const SSHClient = require('./sshClient');

const TEMPLATE_DIR = path.join(__dirname, '../templates')

class WebNginx {
    constructor(config) {
        this.config = config
        this.client = new SSHClient(config.ssh)
    }

    async deploy() {
        try {
            const { name, buildCommand, assetDir, remoteDirectory, port, useBuiltInTemplates } = this.config
            this.client.log('🚀 开始部署流程')
            await this.client.execLocalShell(buildCommand, '前端代码构建')
            await this.client.execLocalShell(`tar -zcvf assets.tar.gz Dockerfile nginx.conf ${assetDir || 'dist'}`, '静态资源打包')
            await this.client.connect()
            await this.client.upload('./assets.tar.gz', path.join(remoteDirectory, 'assets.tar.gz'))
            await this.client.execRemoteShell(`
                cd ${remoteDirectory}
                tar -zxvf assets.tar.gz -C ./${name}
                rm -rf assets.tar.gz
                ls
                exit
            `, '文件解压')
            await this.client.deleteFiles(['assets.tar.gz'])
            this.client.log('✅ docker部署成功')
        } catch (err) {
            this.client.log('❌ 部署失败: ' + err)
            console.error(chalk.red(err))
            process.exit(1)
        } finally {
            await this.client.disconnect()
        }
    }
}

module.exports = WebNginx