const assert = require('assert')
const { validateConfig } = require('../lib/config/validator')

const validConfig = {
    name: 'my-app',
    type: 'web',
    deployMode: 'docker',
    port: 3000,
    buildCommand: 'npm run build',
    assetDir: 'dist',
    remoteDirectory: '/root/web',
    ssh: { host: '10.0.0.1', port: 22, username: 'root', password: '' }
}

const tests = [
    {
        name: 'ConfigValidator: 合法配置应验证通过',
        fn: () => {
            const { valid, errors } = validateConfig(validConfig)
            assert.strictEqual(valid, true)
            assert.strictEqual(errors.length, 0)
        }
    },
    {
        name: 'ConfigValidator: 空配置应报错',
        fn: () => {
            const { valid, errors } = validateConfig(null)
            assert.strictEqual(valid, false)
        }
    },
    {
        name: 'ConfigValidator: type 非法值应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, type: 'python' })
            assert.strictEqual(valid, false)
            assert.ok(errors.some(e => e.includes('type')))
        }
    },
    {
        name: 'ConfigValidator: deployMode 非法值应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, deployMode: 'k8s' })
            assert.strictEqual(valid, false)
            assert.ok(errors.some(e => e.includes('deployMode')))
        }
    },
    {
        name: 'ConfigValidator: web+pm2 组合应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, type: 'web', deployMode: 'pm2' })
            assert.strictEqual(valid, false)
        }
    },
    {
        name: 'ConfigValidator: node+Nginx 组合应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, type: 'node', deployMode: 'Nginx' })
            assert.strictEqual(valid, false)
        }
    },
    {
        name: 'ConfigValidator: port 非法值应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, port: 'xyz' })
            assert.strictEqual(valid, false)
            assert.ok(errors.some(e => e.includes('port')))
        }
    },
    {
        name: 'ConfigValidator: port 超出范围应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, port: 99999 })
            assert.strictEqual(valid, false)
        }
    },
    {
        name: 'ConfigValidator: 缺少 ssh.host 应报错',
        fn: () => {
            const cfg = { ...validConfig, ssh: { port: 22 } }
            const { valid, errors } = validateConfig(cfg)
            assert.strictEqual(valid, false)
            assert.ok(errors.some(e => e.includes('ssh.host')))
        }
    },
    {
        name: 'ConfigValidator: 缺少 name 应报错',
        fn: () => {
            const { valid, errors } = validateConfig({ ...validConfig, name: '' })
            assert.strictEqual(valid, false)
        }
    }
]

module.exports = tests
