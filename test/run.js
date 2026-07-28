#!/usr/bin/env node
/**
 * 简易测试运行器 — 兼容 Node 14
 * 用法: node test/run.js
 */
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

const TEST_DIR = __dirname
const testFiles = fs.readdirSync(TEST_DIR)
    .filter(f => f.endsWith('.test.js'))
    .map(f => path.join(TEST_DIR, f))

let totalPassed = 0
let totalFailed = 0
const failures = []

for (const file of testFiles) {
    const name = path.basename(file)
    console.log(chalk.cyan(`\n📋 ${name}`))

    try {
        const tests = require(file)
        for (const test of tests) {
            try {
                test.fn()
                totalPassed++
                console.log(chalk.green(`  ✓ ${test.name}`))
            } catch (err) {
                totalFailed++
                console.log(chalk.red(`  ✗ ${test.name}`))
                console.log(chalk.red(`    ${err.message}`))
                failures.push({ file: name, name: test.name, error: err.message })
            }
        }
    } catch (err) {
        console.log(chalk.red(`  加载失败: ${err.message}`))
    }
}

console.log(chalk.cyan('\n' + '='.repeat(50)))
console.log(chalk.green(`✅ 通过: ${totalPassed}`))
console.log(chalk.red(`❌ 失败: ${totalFailed}`))

if (failures.length > 0) {
    console.log(chalk.yellow('\n失败详情:'))
    for (const f of failures) {
        console.log(chalk.yellow(`  [${f.file}] ${f.name}`))
        console.log(chalk.red(`    ${f.error}`))
    }
}

process.exit(totalFailed > 0 ? 1 : 0)
