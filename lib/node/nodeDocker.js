const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const SSHClient = require('../sshClient');

class NodeDocker {
    constructor(config) {
        this.config = config
        this.client = new SSHClient(config.ssh)
    }

    async deploy() {
        try {
            const { name, assetDir, remoteDirectory, port, useBuiltInTemplates } = this.config
            this.client.log('🚀 开始部署流程')
            await this.client.execLocalShell(`tar --exclude=assets.tar.gz -czf assets.tar.gz ${assetDir || 'dist'}`, '静态资源打包')
            await this.client.connect()
            await this.client.upload('./assets.tar.gz', path.join(remoteDirectory, 'assets.tar.gz'))
            await this.client.execRemoteShell(`
                cd ${remoteDirectory}
                if [ ! -d ${name}  ];then
                    mkdir ${name}
                else
                    rm -rf ./${name}/*
                fi
                tar -zxvf assets.tar.gz -C ./${name}
                rm -rf assets.tar.gz
                ls
                cd ${name}
                sudo docker stop ${name} || true
                sudo docker rm  ${name} || true
                sudo docker rmi  ${name} || true
                sudo docker build -t  ${name} .
                sudo docker run -d -p ${port}:${port} --name ${name} ${name}
                docker ps
                exit
            `, '文件解压,生成镜像、启动容器')
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

module.exports = NodeDocker