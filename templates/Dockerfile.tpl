# 准备 nginx
FROM nginx

# 将Nginx配置文件复制到镜像中
COPY nginx.conf /etc/nginx/nginx.conf

# 将构建好的静态资源文件复制到Nginx监听目录中
COPY ./{{assetDir}} /usr/share/nginx/html

# 暴露端口
EXPOSE 80