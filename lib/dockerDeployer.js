const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const mustache = require('mustache')
const SSHClient = require('./sshClient');

const TEMPLATE_DIR = path.join(__dirname, '../templates')

class DockerDeployer {
    constructor(config) {
        this.config = config
        this.client = new SSHClient(config.ssh)
    }

    async deploy() {
        try {
            this.client.log('🚀 开始部署流程')
            const { name, buildCommand, assetDir, remoteDirectory, port } = this.config
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
                cd ${name}
                sudo docker stop ${name} || true
                sudo docker rm  ${name} || true
                sudo docker rmi  ${name} || true
                sudo docker build -t  ${name} .
                sudo docker run -d -p ${port}:80 --name ${name} ${name}
                docker ps
                exit
            `;
            this.client.log('开始构建')
            await this.client.execLocalShell(buildCommand)
            this.client.log('生成配置文件')
            await this.generateConfigFile()
            this.client.log('文件打包')
            await this.client.execLocalShell(`tar -zcvf assets.tar.gz Dockerfile nginx.conf ${assetDir || 'dist'}`)
            this.client.log('链接服务器')
            await this.client.connect()
            this.client.log('上传文件')
            await this.client.upload('./assets.tar.gz', path.join(remoteDirectory, 'assets.tar.gz'))
            this.client.log('文件解压,生成镜像、启动容器')
            await this.client.execRemoteShell(shell)
            this.client.log('删除本地资源')
            await this.client.deleteFiles(['assets.tar.gz', 'Dockerfile', 'nginx.conf'])
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

    // 生成dockerFile和nginx.conf 配置文件
    async generateConfigFile() {
        const dockerTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Dockerfile.tpl'), 'utf8')
        const nginxTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'nginx.conf.tpl'), 'utf8')
        fs.writeFileSync('Dockerfile', mustache.render(dockerTpl, this.config))
        fs.writeFileSync('nginx.conf', mustache.render(nginxTpl, this.config))
        this.client.log('🛠 Docker 模板生成完成')
    }
}

module.exports = DockerDeployer