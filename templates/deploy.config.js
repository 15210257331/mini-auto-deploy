module.exports = {
    // 项目名称，对应 Docker 镜像和容器名
    name: 'vue3-demo',

    // 项目类型 可选值为 web、node
    type: 'web',

    // 项目描述
    description: 'xxxxx',

    // 部署方式 可选值为 docker、pm2、Nginx
    deployMode: 'docker',

    // 服务端口
    port: 9000,

    // 构建命令（可根据项目实际修改，没有构建命令可以置为空）
    buildCommand: 'npm run build',

    // 构建完成的静态资源目录
    assetDir: 'dist',

    // 服务器上部署的根目录
    remoteDirectory: '/root/web',

    // 启用内置模板（web+docker 时会自动生成 Dockerfile 和 nginx.conf）
    useBuiltInTemplates: true,

    // 代理配置（web 项目 Nginx 转发时使用）
    proxy: {
        target: '/api',
        proxy_pass: 'http://140.143.168.25:4000'
    },

    // 服务器 SSH 配置
    ssh: {
        host: '140.143.168.25',
        port: 22,
        username: '',           // 运行时交互输入
        password: '',           // 运行时交互输入（使用密钥登录可留空）
        privateKey: '',         // SSH 私钥路径，如 ~/.ssh/id_rsa，或直接填写密钥内容
        passphrase: ''          // 私钥密码（可选）
    },

    // 部署钩子（可选）
    hooks: {
        // beforeDeploy: ['echo "开始部署"', 'npm run backup'],
        // afterDeploy: ['curl -X POST https://webhook.example.com/deploy-success']
    },

    // 健康检查（仅 Docker 部署模式，可选）
    healthCheck: {
        enabled: true,          // 是否启用，默认 true
        retries: 12,            // 重试次数
        interval: 5000,         // 重试间隔(毫秒)
        path: '/'               // 检查路径
    }
}
