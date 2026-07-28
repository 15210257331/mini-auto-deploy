const WebDocker = require('./deployer/webDocker')
const WebNginx = require('./deployer/webNginx')
const NodeDocker = require('./deployer/nodeDocker')
const NodePm2 = require('./deployer/nodePm2')

module.exports = function getDeployer(config, opts = {}) {
    const { deployMode, type } = config
    if (type === 'web') {
        switch (deployMode) {
            case 'docker': return new WebDocker(config, opts)
            case 'Nginx':  return new WebNginx(config, opts)
            default: throw new Error(`❌ 未知部署类型: ${deployMode}`)
        }
    } else if (type === 'node') {
        switch (deployMode) {
            case 'docker': return new NodeDocker(config, opts)
            case 'pm2':    return new NodePm2(config, opts)
            default: throw new Error(`❌ 未知部署类型: ${deployMode}`)
        }
    }
}
