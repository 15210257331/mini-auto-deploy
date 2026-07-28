const path = require('path')
const fs = require('fs')
const mustache = require('mustache')
const BaseDeployer = require('./base')
const { escapeShell } = require('../shell/escape')

const TEMPLATE_DIR = path.join(__dirname, '../../templates')

class WebDocker extends BaseDeployer {
    getModeName() {
        return 'Docker(Web)'
    }

    supportsRollback() { return true }

    getHealthCheckPort() { return 80 }

    async beforeDeploy() {
        const { useBuiltInTemplates } = this.config
        if (useBuiltInTemplates) {
            this.logger.log('🛠 生成 Docker / nginx 配置文件')
            const dockerTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'Dockerfile.mustache'), 'utf8')
            const nginxTpl = fs.readFileSync(path.join(TEMPLATE_DIR, 'nginx.conf.mustache'), 'utf8')
            fs.writeFileSync('Dockerfile', mustache.render(dockerTpl, this.config))
            fs.writeFileSync('nginx.conf', mustache.render(nginxTpl, this.config))
            this.logger.log('✅ Docker / nginx 配置文件生成完成')
        }
    }

    buildRemoteScript() {
        const name = escapeShell(this.config.name)
        const port = escapeShell(this.config.port)
        const remoteDir = escapeShell(this.config.remoteDirectory)

        return `cd ${remoteDir}
if [ ! -d ${name} ]; then
    mkdir ${name}
else
    rm -rf ./${name}/*
fi
tar -zxvf assets.tar.gz -C ./${name}
rm -rf assets.tar.gz
cd ${name}
sudo docker stop ${name} || true
sudo docker rm ${name} || true
sudo docker rmi ${name} || true
sudo docker build -t ${name} .
sudo docker run -d -p ${port}:80 --name ${name} ${name}
docker ps
exit`
    }
}

module.exports = WebDocker
