const NoTemplateDeployer = require('./noTemplate')
const { escapeShell } = require('../shell/escape')

class NodePm2 extends NoTemplateDeployer {
    getModeName() {
        return 'PM2'
    }

    needBuild() {
        return false
    }

    buildRemoteScript() {
        const name = escapeShell(this.config.name)
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
pm2 start
exit`
    }
}

module.exports = NodePm2
