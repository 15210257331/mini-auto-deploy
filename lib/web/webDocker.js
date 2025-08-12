const path = require('path')
const chalk = require('chalk')
const fs = require('fs')
const mustache = require('mustache')
const SSHClient = require('../sshClient');

const TEMPLATE_DIR = path.join(__dirname, '../../templates')

class WebDocker {
    constructor(config) {
        this.config = config
        this.client = new SSHClient(config.ssh)
    }

    async deploy() {
        try {
            const { name, buildCommand, assetDir, remoteDirectory, port, useBuiltInTemplates } = this.config
            this.client.log('\n\n\n🚀 开始部署流程')
            await this.client.execLocalShell(buildCommand, '前端代码构建')
            if (useBuiltInTemplates) {
                await this.generateConfigFile()
            }
            await this.client.execLocalShell(`tar -zcvf assets.tar.gz Dockerfile nginx.conf ${assetDir || 'dist'}`, '静态资源打包')
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
                sudo docker run -d -p ${port}:80 --name ${name} ${name}
                docker ps
                exit
            `, '文件解压,生成镜像、启动容器')
            await this.client.deleteFiles(['assets.tar.gz', 'Dockerfile', 'nginx.conf'])
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
    // 读取模板文件 → 用配置替换占位符 → 生成最终的 Dockerfile 和 nginx.conf 文件
    // 找到 dockerTpl 模板文件中形如 {{变量名}} 的占位符 用 this.config 里对应的值替换它们
    async generateConfigFile() {
        this.client.log('🛠 生成 Docker nginx 配置文件')
        const dockerTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Dockerfile.tpl'), 'utf8')
        const nginxTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'nginx.conf.tpl'), 'utf8')
        fs.writeFileSync('Dockerfile', mustache.render(dockerTpl, this.config))
        fs.writeFileSync('nginx.conf', mustache.render(nginxTpl, this.config))
        this.client.log('🛠 Docker nginx 配置文件生成完成')
    }
}

module.exports = WebDocker