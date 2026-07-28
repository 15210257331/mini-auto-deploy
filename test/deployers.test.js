const assert = require('assert')
const { escapeShell } = require('../lib/shell/escape')
const WebDocker = require('../lib/deployer/webDocker')
const WebNginx = require('../lib/deployer/webNginx')
const NodeDocker = require('../lib/deployer/nodeDocker')
const NodePm2 = require('../lib/deployer/nodePm2')
const NoTemplateDeployer = require('../lib/deployer/noTemplate')

const baseConfig = {
    name: 'test-app',
    port: 3000,
    buildCommand: 'echo build',
    assetDir: 'dist',
    remoteDirectory: '/tmp/test',
    useBuiltInTemplates: false,
    ssh: { host: '127.0.0.1', port: 22, username: 'root', password: '' }
}

const tests = [
    // ---------- NoTemplateDeployer ----------
    {
        name: 'NoTemplateDeployer: getTarFiles 不包含 Dockerfile/nginx.conf',
        fn: () => {
            const d = new NoTemplateDeployer(baseConfig)
            const files = d.getTarFiles()
            assert.ok(!files.includes('Dockerfile'))
            assert.ok(!files.includes('nginx.conf'))
        }
    },
    {
        name: 'NoTemplateDeployer: getCleanupFiles 仅含 assets.tar.gz',
        fn: () => {
            const d = new NoTemplateDeployer(baseConfig)
            assert.deepStrictEqual(d.getCleanupFiles(), ['assets.tar.gz'])
        }
    },

    // ---------- WebDocker ----------
    {
        name: 'WebDocker: getModeName 应返回 "Docker(Web)"',
        fn: () => {
            const d = new WebDocker(baseConfig)
            assert.strictEqual(d.getModeName(), 'Docker(Web)')
        }
    },
    {
        name: 'WebDocker: needBuild 应返回 true',
        fn: () => {
            const d = new WebDocker(baseConfig)
            assert.strictEqual(d.needBuild(), true)
        }
    },
    {
        name: 'WebDocker: buildRemoteScript 应包含 docker 命令',
        fn: () => {
            const d = new WebDocker(baseConfig)
            const script = d.buildRemoteScript()
            assert.ok(script.includes('docker build'))
            assert.ok(script.includes('docker run'))
        }
    },
    {
        name: 'WebDocker: buildRemoteScript 用 esc( ) 防御命令注入',
        fn: () => {
            const d = new WebDocker({ ...baseConfig, name: "my-app'; rm -rf /" })
            const escaped = escapeShell(d.config.name)
            assert.ok(escaped.startsWith("'"))
            assert.ok(escaped.endsWith("'"))
        }
    },
    {
        name: 'WebDocker: getTarFiles 应包含 Dockerfile 和 nginx.conf',
        fn: () => {
            const d = new WebDocker(baseConfig)
            const files = d.getTarFiles()
            assert.ok(files.includes('Dockerfile'))
            assert.ok(files.includes('nginx.conf'))
        }
    },

    // ---------- WebNginx ----------
    {
        name: 'WebNginx: 继承 NoTemplateDeployer',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.ok(d instanceof NoTemplateDeployer)
        }
    },
    {
        name: 'WebNginx: getModeName 应返回 "Nginx"',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.strictEqual(d.getModeName(), 'Nginx')
        }
    },
    {
        name: 'WebNginx: buildRemoteScript 不应包含 docker 命令',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.ok(!d.buildRemoteScript().includes('docker'))
        }
    },
    {
        name: 'WebNginx: buildRemoteScript 应使用子目录隔离项目',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.ok(d.buildRemoteScript().includes('mkdir'))
        }
    },
    {
        name: 'WebNginx: getCleanupFiles 不含 Dockerfile/nginx.conf',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.ok(!d.getCleanupFiles().includes('Dockerfile'))
        }
    },

    // ---------- NodeDocker ----------
    {
        name: 'NodeDocker: 继承 NoTemplateDeployer',
        fn: () => {
            const d = new NodeDocker(baseConfig)
            assert.ok(d instanceof NoTemplateDeployer)
        }
    },
    {
        name: 'NodeDocker: getModeName 应返回 "Docker(Node)"',
        fn: () => {
            const d = new NodeDocker(baseConfig)
            assert.strictEqual(d.getModeName(), 'Docker(Node)')
        }
    },
    {
        name: 'NodeDocker: getTarExtraArgs 应排除 assets.tar.gz',
        fn: () => {
            const d = new NodeDocker(baseConfig)
            assert.ok(d.getTarExtraArgs().includes('--exclude'))
        }
    },

    // ---------- NodePm2 ----------
    {
        name: 'NodePm2: 继承 NoTemplateDeployer',
        fn: () => {
            const d = new NodePm2(baseConfig)
            assert.ok(d instanceof NoTemplateDeployer)
        }
    },
    {
        name: 'NodePm2: getModeName 应返回 "PM2"',
        fn: () => {
            const d = new NodePm2(baseConfig)
            assert.strictEqual(d.getModeName(), 'PM2')
        }
    },
    {
        name: 'NodePm2: needBuild 应返回 false',
        fn: () => {
            const d = new NodePm2(baseConfig)
            assert.strictEqual(d.needBuild(), false)
        }
    },
    {
        name: 'NodePm2: buildRemoteScript 应使用 remoteDirectory 而非硬编码路径',
        fn: () => {
            const d = new NodePm2({ ...baseConfig, remoteDirectory: '/opt/my-app' })
            assert.ok(d.buildRemoteScript().includes('/opt/my-app'))
            assert.ok(!d.buildRemoteScript().includes('/root/web'))
        }
    },
    {
        name: 'NodePm2: buildRemoteScript 应包含 pm2 start',
        fn: () => {
            const d = new NodePm2(baseConfig)
            assert.ok(d.buildRemoteScript().includes('pm2 start'))
        }
    },
    // ---------- 新功能测试 ----------
    {
        name: 'WebDocker: 应支持回滚 (supportsRollback)',
        fn: () => {
            const d = new WebDocker(baseConfig)
            assert.strictEqual(d.supportsRollback(), true)
        }
    },
    {
        name: 'WebDocker: 健康检查端口应为 80',
        fn: () => {
            const d = new WebDocker(baseConfig)
            assert.strictEqual(d.getHealthCheckPort(), 80)
        }
    },
    {
        name: 'NodeDocker: 应支持回滚',
        fn: () => {
            const d = new NodeDocker(baseConfig)
            assert.strictEqual(d.supportsRollback(), true)
        }
    },
    {
        name: 'NodePm2: 不应支持回滚',
        fn: () => {
            const d = new NodePm2(baseConfig)
            assert.strictEqual(d.supportsRollback(), false)
        }
    },
    {
        name: 'WebNginx: 不应支持回滚',
        fn: () => {
            const d = new WebNginx(baseConfig)
            assert.strictEqual(d.supportsRollback(), false)
        }
    },
    {
        name: 'BaseDeployer: dryRun 选项应传递到 constructor',
        fn: () => {
            const d = new WebDocker(baseConfig, { dryRun: true })
            assert.strictEqual(d.opts.dryRun, true)
        }
    },
    {
        name: 'BaseDeployer: skipBuild 选项应传递到 constructor',
        fn: () => {
            const d = new WebDocker(baseConfig, { skipBuild: true, skipUpload: true })
            assert.strictEqual(d.opts.skipBuild, true)
            assert.strictEqual(d.opts.skipUpload, true)
        }
    }
]

module.exports = tests
