const BaseDeployer = require('./base')

/**
 * NoTemplateDeployer — 不需要 Dockerfile/nginx.conf 模板的部署器基类
 *
 * 适用于 NodeDocker、NodePm2、WebNginx 等不需要内置模板的场景。
 */
class NoTemplateDeployer extends BaseDeployer {

    getTarFiles() {
        const { assetDir } = this.config
        return [assetDir || 'dist']
    }

    getCleanupFiles() {
        return ['assets.tar.gz']
    }
}

module.exports = NoTemplateDeployer
