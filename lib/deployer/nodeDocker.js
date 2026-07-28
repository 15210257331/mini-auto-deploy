const NoTemplateDeployer = require('./noTemplate')
const { escapeShell } = require('../shell/escape')

class NodeDocker extends NoTemplateDeployer {
    getModeName() {
        return 'Docker(Node)'
    }

    supportsRollback() { return true }

    getTarExtraArgs() {
        return '--exclude=assets.tar.gz'
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
sudo docker run -d -p ${port}:${port} --name ${name} ${name}
docker ps
exit`
    }
}

module.exports = NodeDocker
