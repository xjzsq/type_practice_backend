# 算法与数据结构设计周程序 - 打字练习系统后端

### :sparkles: 特性

使用 `Koa2` 后端框架构建的打字练习系统后端。

### :package: 使用方法

本程序与 [打字练习系统前端](https://github.com/xjzsq/type_practice_frontend) 配合使用。

```bash
yarn 
node app.js
```

服务将运行在 `6088` 端口。

然后在 `nginx` 配置的 `server_name xxx` 的下一行加入：

```nginx
location /api/ {
	rewrite  ^/api/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:6088/;
}
```

即可配置好后端。