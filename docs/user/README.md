# 用户模块前端与联调

## 启动

1. 在 SOP_Server_of_Java/Server 启动 Java 后端，默认端口8080。
2. 若平台 root 尚未初始化，先按后端 [登录与初始化](../../../SOP_Server_of_Java/docs/user/login.md) 配置初始密码并完成初始化。
3. 在 KedaAdmin 执行 npm run dev，浏览器打开终端显示的地址，默认 http://localhost:9527。
4. 登录页填写平台账号密码。后台的MySQL连接账号密码不用于此页面。

开发环境 .env.development 只使用 VUE_APP_BASE_API=/dev-api，
vue.config.js 将 /dev-api 代理到 http://localhost:8080 并剥离前缀。
不再指向 Apifox Mock。后端不是8080时可设置 VUE_APP_PROXY_TARGET 后重启前端。
修改 .env 或代理配置后必须重启 npm run dev。

生产环境仍使用 /prod-api，需要部署时配置反向代理转发到后端并剥离该前缀；
开发服务器的代理不会随 dist 一同部署。

## 已接通的前端代码

用户页面目录统一如下，URL路径保持原有约定：

```text
src/views/user/
├── login/
│   ├── index.vue
│   ├── components/       # LoginForm.vue、ChangePassword.vue等，PascalCase
│   ├── js/               # login.js、login_form.js等，小写+下划线
│   └── styles/           # 登录、输入框、改密等SCSS
├── management/           # 原用户管理页及其components/js/styles
│   └── index.vue
└── insert/               # 接口测试页，直接与login、management并列
    └── index.vue
```

登录组件保留原深色界面，页面入口不嵌入业务逻辑或样式。
management/js/user_management.js、insert/js/request_test.js也采用下划线文件名。

| 文件 | 负责内容 |
|---|---|
| src/api/user.js | /user/auth/login、/user/auth/logout、/user/me、/user/me/password |
| src/utils/request.js | Bearer token请求头，解析真实HTTP错误，不记录请求密码 |
| src/store/modules/user.js | 按 data.access_token 和 data.user 保存会话、用户及权限 |
| src/permission.js | 加载用户资料、首次改密和动态路由，不再要求用户必须有角色 |
| src/views/user/login/index.vue | 登录入口；components放组件，js放逻辑，styles放样式 |
| src/views/user/change_password/index.vue | 首次/主动改密，成功后清理会话并重新登录 |
| src/layout/components/Navbar.vue | 头像空值回退和修改密码入口 |

root 使用 superuser 角色，并可通过前端已有角色路由检查。
前端隐藏按钮或路由只是显示控制，真正的功能权限必须由后端强制检查。

用户管理页面现已接通 /user 前缀下的分页、详情、新建、编辑、状态、软删除和密码重置，
以及真实班组、角色选项；角色变更可以随资料一次保存。通过root登录后访问 /#/user_management/user。
班组表当前为空时允许不选班组，不再使用前端写死的班组列表。编辑、删除等请求带version。
root显示为系统保护；普通用户界面按权限显示操作，后端仍会独立校验全部权限和授权范围。
后端接口说明：[后台用户模块](../../../SOP_Server_of_Java/docs/user/README.md)。
原权限演示页的浏览器模拟角色切换已停用，角色由后端管理。

## 接口资料

- 在线调试：http://localhost:8080/swagger-ui/index.html
- OpenAPI规范：http://localhost:8080/v3/api-docs，可导入 Apifox/Postman。
- 手工业务说明：[登录与初始化](../../../SOP_Server_of_Java/docs/user/login.md)。
- 开发者文档规范：[后台接口约定](../../../SOP_Server_of_Java/docs/development/api_guide.md)。

新写业务请求使用 src/utils/request.js，成功直接得到 {code,message,data}，不要再读取 axios 的多层包装。
错误统一由拦截器提示；组件处理清理loading即可，避免重复弹同一个错误。
403保留登录；401会话失效才清理并回登录页。

## 验证

登录接口与会话映射的7项单元测试：

```text
node node_modules/@vue/cli-service/bin/vue-cli-service.js test:unit --runInBand tests/unit/store/user-auth.spec.js tests/unit/utils/login-request.spec.js
```

生产构建 npm run build:prod。当前旧版 Vue CLI/Webpack 在较新 Node 上可能需要
NODE_OPTIONS=--openssl-legacy-provider；这是构建工具兼容选项，与Java服务无关。


目录调整：改密页位于 user/change_password，回调页位于 user/auth_redirect，登录与管理仍位于 user/login 和 user/management。每页保留 index.vue、components、js、styles；/change-password、/auth-redirect 等 URL 不变。
