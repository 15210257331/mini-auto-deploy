const DockerDeployer = require('./dockerDeployer')
// const PM2Deployer = require('./pm2Deployer')

module.exports = function getDeployer(config) {
    switch (config.type) {
        case 'docker':
            return new DockerDeployer(config)
        case 'pm2':
            // return new PM2Deployer(config)
        default:
            throw new Error(`未知部署类型: ${config.type}`)
    }
}