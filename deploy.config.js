module.exports = {
    "name": "my-app",
    "type": "web",
    "deployMode": "docker",
    "port": 9000,
    "buildCommand": "npm run build",
    "assetDir": "dist",
    "remoteDirectory": "/root/web",
    "useBuiltInTemplates": true,
    "ssh": {
        "host": "",
        "port": 22,
        "username": "",
        "password": ""
    },
    "healthCheck": {
        "enabled": true,
        "retries": 12,
        "interval": 5000,
        "path": "/"
    }
}
