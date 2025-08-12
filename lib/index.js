const WebDocker = require('./web/webDocker')
const WebNginx = require('./web/webNginx')
const NodeDocker = require('./node/nodeDocker')
const NodePm2 = require('./node/nodePm2')

module.exports = function getDeployer(config) {
    const { deployMode, type } = config
    if (type === 'web') {
        switch (deployMode) {
            case 'docker':
                return new WebDocker(config)
            case 'Nginx':
                return new WebNginx(config)
            default:
                throw new Error(`❌ 未知部署类型: ${deployMode}`)
        }
    } else if (type === 'node') {
        switch (deployMode) {
            case 'docker':
                return new NodeDocker(config)
            case 'pm2':
                return new NodePm2(config)
            default:
                throw new Error(`❌ 未知部署类型: ${deployMode}`)
        }
    }
}