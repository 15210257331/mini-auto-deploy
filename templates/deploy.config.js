module.exports = {
    // 项目名称，对应 Docker 镜像和容器名
    name: 'vue3-demo',

    // 项目类型 可选值为 web、node
    type: 'web',

    // 部署方式 可选值为 docker pm2 Nginx 等
    deployMode: 'docker',

    // 服务端口
    port: 9000,

    // 构建命令（可根据项目实际修改 没有构建命令可以置为空）
    buildCommand: 'npm run build',

    // 构建完成的静态资源目录
    assetDir: 'dist',

    // 服务器上部署的根目录
    remoteDirectory: '/root/web',

    // 启用内置模板（会自动生成 Dockerfile 和 nginx.conf）
    useBuiltInTemplates: true,

    // 是否生成构建日志
    generateLog: true,

    // 代理配置 web项目会用到 Nginx 转发
    proxy: {
        location: '/api',
        proxy_pass: 'http://129.211.164.125:4000'
    },

    // 服务器 SSH 配置（建议使用 .env 管理敏感信息）
    ssh: {
        host: '140.143.168.25',
        port: 22,
        username: '',
        password: ''
    }
}