const assert = require('assert')
const { escapeShell } = require('../lib/shell/escape')

const tests = [
    {
        name: 'escapeShell: 应该用单引号包裹普通字符串',
        fn: () => {
            assert.strictEqual(escapeShell('hello'), "'hello'")
        }
    },
    {
        name: "escapeShell: 应该正确转义含单引号的字符串",
        fn: () => {
            assert.strictEqual(escapeShell("it's"), "'it'\\''s'")
        }
    },
    {
        name: 'escapeShell: 单引号包裹防御分号注入',
        fn: () => {
            const result = escapeShell('hello; rm -rf /')
            assert.ok(result.startsWith("'"))
            assert.ok(result.endsWith("'"))
        }
    },
    {
        name: 'escapeShell: 单引号包裹防御管道注入',
        fn: () => {
            const result = escapeShell('x | cat /etc/passwd')
            assert.ok(result.startsWith("'"))
            assert.ok(result.endsWith("'"))
        }
    },
    {
        name: 'escapeShell: 应该将非字符串转为字符串',
        fn: () => {
            assert.strictEqual(escapeShell(123), "'123'")
            assert.strictEqual(escapeShell(9000), "'9000'")
        }
    },
    {
        name: 'escapeShell: 单引号内反引号不会被执行',
        fn: () => {
            const result = escapeShell('`whoami`')
            assert.ok(result.startsWith("'"))
            assert.ok(result.endsWith("'"))
        }
    },
    {
        name: 'escapeShell: 单引号内 $() 不会被展开',
        fn: () => {
            const result = escapeShell('$(whoami)')
            assert.ok(result.startsWith("'"))
            assert.ok(result.endsWith("'"))
        }
    }
]

module.exports = tests
