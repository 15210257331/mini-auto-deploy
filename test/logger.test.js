const assert = require('assert')
const path = require('path')
const fs = require('fs')
const Logger = require('../lib/logger')

const testLogPath = path.join(__dirname, 'test-deploy.log')

// 每个测试后清理
function cleanup() {
    try { fs.unlinkSync(testLogPath) } catch (e) { /* ignore */ }
}

const tests = [
    {
        name: 'Logger: 应该在构造时接受自定义日志路径',
        fn: () => {
            cleanup()
            const logger = new Logger(testLogPath)
            assert.strictEqual(logger.logPath, testLogPath)
            cleanup()
        }
    },
    {
        name: 'Logger: 不传路径时应使用默认路径',
        fn: () => {
            const logger = new Logger()
            assert.ok(logger.logPath.endsWith('deploy.log'))
        }
    },
    {
        name: 'Logger: log() 应将消息写入日志文件',
        fn: () => {
            cleanup()
            const logger = new Logger(testLogPath)
            logger.log('测试消息')
            const content = fs.readFileSync(testLogPath, 'utf8')
            assert.ok(content.includes('测试消息'))
            cleanup()
        }
    },
    {
        name: 'Logger: error() 应将消息写入日志文件',
        fn: () => {
            cleanup()
            const logger = new Logger(testLogPath)
            logger.error('错误消息')
            const content = fs.readFileSync(testLogPath, 'utf8')
            assert.ok(content.includes('错误消息'))
            cleanup()
        }
    },
    {
        name: 'Logger: 每条日志应带时间戳',
        fn: () => {
            cleanup()
            const logger = new Logger(testLogPath)
            logger.log('hello')
            const content = fs.readFileSync(testLogPath, 'utf8')
            assert.ok(/^\[.+\] hello/m.test(content))
            cleanup()
        }
    }
]

module.exports = tests
