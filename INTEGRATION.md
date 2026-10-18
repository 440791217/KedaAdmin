# 启动与联调

1. 启动 SOP_Server_of_Java/Server 的 Java 后端，默认8080；配置见 [后台启动说明](../SOP_Server_of_Java/Server/README.md)。
2. 在 KedaAdmin 运行 npm run dev，打开终端显示的地址，默认 http://localhost:9527。
3. 用平台账号登录；平台账号与MySQL连接账号是两套账号。

开发环境 /dev-api 通过 vue.config.js 代理到 localhost:8080。可用 VUE_APP_PROXY_TARGET 修改后端地址，修改环境配置后重启前端。生产环境 /prod-api 需要部署反向代理，开发代理不会打入dist。

模块文档及更新统一放在 [docs](docs/README.md)：[用户](docs/user/README.md)、[项目](docs/project/README.md)。
