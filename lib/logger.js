const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class Logger {
    constructor(logPath) {
        this.logPath = logPath || path.join(process.cwd(), 'deploy.log')
    }

    log(msg) {
        const time = new Date().toLocaleString()
        fs.appendFileSync(this.logPath, `[${time}] ${msg}\n`, { encoding: 'utf8' })
        console.log(chalk.green(msg))
    }

    error(msg) {
        const time = new Date().toLocaleString()
        fs.appendFileSync(this.logPath, `[${time}] ${msg}\n`, { encoding: 'utf8' })
        console.error(chalk.red(msg))
    }
}

module.exports = Logger
