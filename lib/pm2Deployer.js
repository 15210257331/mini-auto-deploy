const App = require('./app')

class PM2Deployer extends App {
    async deployRemote() {
        const { projectName, remoteDirectory, entryFile = 'index.js' } = this.config
        const shell = `
      cd ${remoteDirectory}
      mkdir -p ${projectName} && rm -rf ${projectName}/*
      tar -zxvf assets.tar.gz -C ${projectName} && rm assets.tar.gz
      cd ${projectName}
      npm install --production
      pm2 delete ${projectName} || true
      pm2 start ${entryFile} --name ${projectName}
      pm2 save
    `
        return this.runShell(shell, '🔁 PM2 启动完成')
    }

    runShell(script, label) {
        return new Promise((resolve, reject) => {
            this.sshClient.shell((err, stream) => {
                if (err) return reject(err)
                stream.end(script)
                stream.on('close', () => {
                    this.sshClient.end()
                    this.log(label)
                    resolve()
                })
            })
        })
    }
}

module.exports = PM2Deployer