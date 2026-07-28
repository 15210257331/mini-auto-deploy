const assert = require('assert')
const getDeployer = require('../lib/index')

const baseConfig = {
    name: 'test-app',
    port: 3000,
    buildCommand: 'echo build',
    assetDir: 'dist',
    remoteDirectory: '/tmp/test',
    ssh: { host: '127.0.0.1', port: 22, username: 'root', password: '' }
}

const tests = [
    {
        name: 'Factory: type=web + deployMode=docker → WebDocker',
        fn: () => {
            const d = getDeployer({ ...baseConfig, type: 'web', deployMode: 'docker' })
            assert.strictEqual(d.getModeName(), 'Docker(Web)')
            assert.ok(d.config.type === 'web')
        }
    },
    {
        name: 'Factory: type=web + deployMode=Nginx → WebNginx',
        fn: () => {
            const d = getDeployer({ ...baseConfig, type: 'web', deployMode: 'Nginx' })
            assert.strictEqual(d.getModeName(), 'Nginx')
        }
    },
    {
        name: 'Factory: type=node + deployMode=docker → NodeDocker',
        fn: () => {
            const d = getDeployer({ ...baseConfig, type: 'node', deployMode: 'docker' })
            assert.strictEqual(d.getModeName(), 'Docker(Node)')
        }
    },
    {
        name: 'Factory: type=node + deployMode=pm2 → NodePm2',
        fn: () => {
            const d = getDeployer({ ...baseConfig, type: 'node', deployMode: 'pm2' })
            assert.strictEqual(d.getModeName(), 'PM2')
        }
    },
    {
        name: 'Factory: 未知组合应抛出错误',
        fn: () => {
            assert.throws(
                () => getDeployer({ ...baseConfig, type: 'web', deployMode: 'unknown' }),
                /未知部署类型/
            )
        }
    }
]

module.exports = tests
