const NoTemplateDeployer = require('./noTemplate')
const { escapeShell } = require('../shell/escape')

class WebNginx extends NoTemplateDeployer {
    getModeName() {
        return 'Nginx'
    }

    buildRemoteScript() {
        const name = escapeShell(this.config.name)
        const assetDir = escapeShell(this.config.assetDir || 'dist')
        const remoteDir = escapeShell(this.config.remoteDirectory)

        return `cd ${remoteDir}
if [ ! -d ${name} ]; then
    mkdir ${name}
fi
tar -zxvf assets.tar.gz -C ./${name}
rm -rf assets.tar.gz
cd ${name}
if [ -d ${assetDir} ]; then
    mv -f ${assetDir}/* ./
    rm -rf ${assetDir}
fi
exit`
    }
}

module.exports = WebNginx
