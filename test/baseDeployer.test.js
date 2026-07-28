const assert = require('assert')
const BaseDeployer = require('../lib/deployer/base')
const { escapeShell } = require('../lib/shell/escape')

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
        name: 'BaseDeployer: getModeName() 应抛出错误（子类必须实现）',
        fn: () => {
            const d = new BaseDeployer(baseConfig)
            assert.throws(() => d.getModeName(), /子类必须实现 getModeName/)
        }
    },
    {
        name: 'BaseDeployer: buildRemoteScript() 应抛出错误（子类必须实现）',
        fn: () => {
            const d = new BaseDeployer(baseConfig)
            assert.throws(() => d.buildRemoteScript(), /子类必须实现 buildRemoteScript/)
        }
    },
    {
        name: 'BaseDeployer: needBuild() 默认应返回 true',
        fn: () => {
            const d = new BaseDeployer(baseConfig)
            assert.strictEqual(d.needBuild(), true)
        }
    },
    {
        name: 'BaseDeployer: escapeShell 应正确转义 shell 参数',
        fn: () => {
            const result = escapeShell("hello; rm -rf /")
            assert.ok(result.startsWith("'"))
            assert.ok(result.endsWith("'"))
        }
    },
    {
        name: 'BaseDeployer: getTarFiles() 默认返回数组含 Dockerfile/nginx.conf',
        fn: () => {
            const d = new BaseDeployer(baseConfig)
            const files = d.getTarFiles()
            assert.ok(Array.isArray(files))
            assert.ok(files.includes('Dockerfile'))
            assert.ok(files.includes('nginx.conf'))
        }
    },
    {
        name: 'BaseDeployer: getCleanupFiles() 默认应返回常用临时文件',
        fn: () => {
            const d = new BaseDeployer(baseConfig)
            const files = d.getCleanupFiles()
            assert.ok(files.includes('assets.tar.gz'))
            assert.ok(files.includes('Dockerfile'))
            assert.ok(files.includes('nginx.conf'))
        }
    }
]

module.exports = tests
