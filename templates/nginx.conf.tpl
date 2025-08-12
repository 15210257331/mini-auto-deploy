user root; # 默认user是nginx, 改成root就行了 使用root 保证拥有权限
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 9;
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png;
    gzip_vary on;
    gzip_disable "MSIE [1-6]\.";

    # 虚拟主机server块
    server {
        # 端口
        listen   80;
        # 匹配请求中的host值
        server_name  localhost;

        # 监听请求路径
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
        # 三个大括号 遇到/ 不会进行转义
        {{#proxy}}
        location {{{proxy.target}}} {
           proxy_pass {{{proxy.proxy_pass}}};
        }
        {{/proxy}}

        #error_page  404  /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }

    }

    include /etc/nginx/conf.d/*.conf;
}
