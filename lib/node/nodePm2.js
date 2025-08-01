const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const SSHClient = require('../sshClient');

class NodePm2 {
    constructor(config) {
        this.config = config
        this.client = new SSHClient(config.ssh)
    }

    async deploy() {
        try {
            this.client.log('🚀 开始部署流程')
            const { name, assetDir, remoteDirectory, port, useBuiltInTemplates } = this.config
            this.client.log('文件打包')
            await this.client.execLocalShell(`tar -zcvf assets.tar.gz ${assetDir || 'dist'}`)
            this.client.log('链接服务器')
            await this.client.connect()
            this.client.log('上传文件')
            await this.client.upload('./assets.tar.gz', path.join(remoteDirectory, 'assets.tar.gz'))
            this.client.log('文件解压,启动pm2')
            const shell = `
                cd /root/web
                if [ ! -d ${name}  ];then
                    mkdir ${name}
                else
                    rm -rf ./${name}/*
                fi
                tar -zxvf assets.tar.gz -C ./${name}
                rm -rf assets.tar.gz
                ls
                pm2 start
                exit
            `;
            await this.client.execRemoteShell(shell)
            this.client.log('删除本地资源')
            await this.client.deleteFiles(['assets.tar.gz'])
            this.client.log('断开链接')
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

module.exports = NodePm2