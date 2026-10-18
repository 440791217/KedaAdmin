# 前端模板清理核查清单

核查日期：2026-10-16。范围为 KedaAdmin 当前源码、路由、main.js、布局、构建入口和测试引用。初次核查仅生成清单；随后用户授权执行第一、第二批删除，结果记录在下方。业务代码未作功能修改。

项目来自 vue-element-admin 4.4.0，保留了大量示例。下面按清理顺序区分“当前无运行引用”“需要先修改入口”“必须保留”，不能仅按文件名或是否出现在菜单中判断。

检查使用 JS 语法分析，排除注释里的路由，跟踪 import、动态 import、require、Vue 外置 script 和 require.context。302 个 JS/Vue 文件中有 144 个进入当前 main.js 运行引用链（包括生产 Mock），另有 158 个未进入这条链。此数字是候选线索，不是一次删除158个文件的授权；不涵盖所有样式、图片、构建工具或运行时字符串引用。

## 第一批执行结果

已按用户明确授权删除以下目标，合计 80 个文件（53 个源文件／示例文件与 27 个历史日志）：

```text
src/views/components-demo/
src/views/charts/
src/views/example/
src/views/nested/
src/views/excel/
src/views/pdf/
src/views/zip/
src/views/guide/
src/views/documentation/
src/router/modules/
src/api/station.js
src/api/tool.js
KedaAdmin 根目录原有的 27 个 *.log
```

删除前核验所有目标的绝对路径均位于 KedaAdmin 内，未穿越目录链接。删除后 16 套、96 项现有单元测试全部通过，生产构建通过（保留原有体积提示）。验证日志放在 D:/projects/cleanup-batch-one-tests.log 和 cleanup-batch-one-build.log，不重新写回已清理的前端根目录。

第一批后又执行了下方第二批。npm 依赖及需修改入口的条件清理尚未执行。下面保留原核查清单供追溯，实际完成范围以两批执行记录为准。

## 第二批执行结果

用户批准的22项目标已全部删除，共51个文件：

```text
src/views/clipboard
src/views/error-log
src/views/icons
src/views/permission
src/views/qiniu
src/views/tab
src/views/table
src/views/theme
src/views/dashboard/admin
src/views/dashboard/editor
src/views/project/index.vue
src/views/project/project_form.js
src/views/project/edit
src/views/project/process
src/views/project/components/ProjectDialog.vue
src/views/project/components/ProjectFilter.vue
src/views/project/components/ProjectTable.vue
src/views/user/insert
src/views/user/login/components/SocialSignin.vue
src/views/user/login/js/social_signin.js
src/views/user/login/styles/social_signin.scss
src/views/sop/annotation.vue
```

验证：16套96项前端测试通过，生产构建通过（保留原有体积提示）。保留正式项目、SOP、用户、位置、工位和设备页面，以及 dashboard/index.vue、components/ErrorLog、src/icons、mock/、sop/annotation/ 隐藏演示路由。没有修改 npm 依赖。

## 原核查：当前业务不依赖的模板示例

以下路径相对 KedaAdmin 根目录。对应模板路由目前均已注释；可作为第一批源文件清理候选。建议同时去掉 router/index.js 里对应的注释配置，避免误以为页面仍存在。

| 目录 | 原功能 |
|---|---|
| src/views/charts/ | 图表示例 |
| src/views/clipboard/ | 剪贴板示例 |
| src/views/components-demo/ | 组件演示 |
| src/views/documentation/ | 模板文档页 |
| src/views/error-log/ | 演示如何触发错误；不是实际错误日志公共组件 |
| src/views/example/ | 文章编辑、列表示例 |
| src/views/excel/ | Excel 导入导出演示 |
| src/views/guide/ | 模板引导页 |
| src/views/icons/ | 图标展示页；不是 src/icons/ 图标基础设施 |
| src/views/nested/ | 多级菜单演示 |
| src/views/pdf/ | PDF 示例 |
| src/views/permission/ | 模板权限演示；不是实际登录／项目权限实现 |
| src/views/qiniu/ | 七牛上传示例 |
| src/views/tab/ | 标签页演示 |
| src/views/table/ | 表格示例 |
| src/views/theme/ | 主题切换示例页 |
| src/views/zip/ | ZIP 导出演示 |
| src/views/dashboard/admin/ | 模板统计看板及图表组件 |
| src/views/dashboard/editor/ | 模板编辑人员首页 |
| src/router/modules/ | components、charts、nested、table 四份示例路由，当前导入均为注释 |

`src/views/dashboard/index.vue` 仍是正式首页入口，必须保留；它目前不导入上述 admin/editor 两套组件。首页的 currentRole 空逻辑可后续一起简化，但不是删除整个 dashboard 目录。

## 第一批：已被正式页面替代的旧代码

| 路径 | 当前状态 |
|---|---|
| src/views/project/index.vue | 旧项目原型，新入口为 project/list/index.vue |
| src/views/project/project_form.js | 旧项目表单脚本，无当前运行引用 |
| src/views/project/components/ProjectDialog.vue | 旧原型组件，正式表单为 EntityDialog.vue |
| src/views/project/components/ProjectFilter.vue | 旧原型筛选组件 |
| src/views/project/components/ProjectTable.vue | 旧原型列表组件 |
| src/views/project/edit/ | 旧项目编辑页，旧 URL 已改为重定向，未再导入此页面 |
| src/views/project/process/ | 旧流程原型，正式流程采用子项目 SOP 任务 |
| src/api/station.js | 旧接口封装，正式工位已改用 api/resource.js |
| src/api/tool.js | 旧接口封装，正式设备已改用 api/resource.js |
| src/views/sop/annotation.vue | 单文件旧原型，无当前运行引用；注意不要与 annotation/ 目录混淆 |
| src/views/user/insert/ | 手工请求测试页，路由已注释；不用此调试工具时可清理 |
| src/views/user/login/components/SocialSignin.vue | 第三方登录占位组件，当前登录页未使用 |
| src/views/user/login/js/social_signin.js | 上述组件专用脚本 |
| src/views/user/login/styles/social_signin.scss | 上述组件专用样式 |

保留 project/components/EntityDialog.vue、project/js/、project/list/、project/detail/、project/styles/。不要删除整个 project/components 或 project 目录。

## 第二批：清理示例后，再清理仅供示例使用的公共组件

下列组件当前没有进入运行引用链，但部分仍被待删的示例页互相引用，应与对应示例一起处理：

```text
src/components/BackToTop/
src/components/Charts/
src/components/DndList/
src/components/DragSelect/
src/components/Dropzone/
src/components/GithubCorner/
src/components/ImageCropper/
src/components/JsonEditor/
src/components/Kanban/
src/components/MarkdownEditor/
src/components/MDinput/
src/components/PanThumb/
src/components/Share/
src/components/Sticky/
src/components/TextHoverEffect/
src/components/Tinymce/
src/components/Upload/
src/components/UploadExcel/
```

正式 SOP 图片上传使用现有 SOP API 和 ElementUI，不依赖 src/components/Upload/ 或 Tinymce。正式标注采用 VisualCanvas，也不依赖上述图表、富文本编辑器。

可随示例一起清理的配套文件：

- src/api/article.js、src/api/qiniu.js、src/api/remote-search.js、src/api/role.js：当前仅服务旧演示功能；正式用户角色接口在 api/user.js。
- src/vendor/Export2Excel.js、src/vendor/Export2Zip.js：仅演示导出使用，当前业务未接入。
- src/assets/custom-theme/：仅 theme 演示页导入；不是正式主题变量 src/styles/element-variables.scss。
- src/utils/clipboard.js、src/utils/open-window.js：当前运行入口未使用，清理前连同演示消费者再核对。
- src/directive/clipboard/、el-drag-dialog/、el-table/、waves/ 及 sticky.js：未进入当前运行引用链；其中 directive/el-table 不是 ElementUI 的 el-table 组件。

权限指令 src/directive/permission/ 和 utils/permission.js 目前也没有运行引用，但它们已有项目内权限适配修改，建议留待专门权限清理，不与模板示例混删。必须保留的实际权限入口见后文。

## 第三批：必须先修改入口才能删

### mock/

开发服务器的 Mock 钩子已注释，但 `src/main.js` 仍有：

```js
if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('../mock')
  mockXHR()
}
```

因此 mock/ 当前会进入生产包，不能直接删除。建议下一步移除这段生产 Mock 注入，再删除 mock/，清掉 vue.config.js 中旧 Mock 注释，并评估卸载 mockjs。这个结论不代表已修改入口，也不代表之前的后端缺表错误由 Mock 引起。

测试里的 jest.mock 是单元测试隔离，与 mock/ 目录和 mockjs 不是同一个机制，测试应保留。

### src/views/sop/annotation/

router/index.js 仍通过隐藏 `/sop_demo/annotation` 导入它。隐藏不等于未使用。正式制作页为 sop/editor/；如果不再保留旧原型参考，先移除 sop_demo 路由，再删除整个 annotation/ 目录及其专用样式。不要删除正式 sop/components/VisualCanvas.vue。

### src/views/profile/

个人资料路由已注释，但 Navbar.vue 头像菜单仍有 `/profile/index` 链接，当前就是残留入口。建议先去掉或替换该菜单链接，再删除 profile/。模板 Github、Docs 外链也可顺便清理，但不影响目录构建。

### 第三方登录重定向

SocialSignin 已不用，但 `/auth-redirect` 仍导入 AuthRedirect.vue。若确认只用现有账号密码登录，可以先移除该路由，再删除 login/components/AuthRedirect.vue 和 login/js/auth_redirect.js。不要删除 ChangePassword、LoginForm 和当前登录入口。

### 构建／生成器工具

- plop-templates/ 与 plopfile.js：package.json 的 `npm run new` 仍使用；不用生成器时先移除脚本及 plop 依赖。
- build/index.js：`npm run preview` 仍引用，继续使用预览脚本就保留。
- .travis.yml：模板遗留 Node10 配置，还调用当前不存在的 npm run test；不使用 Travis 时可删除。
- .github/ISSUE_TEMPLATE/ 与 .github/FUNDING.yml：模板的 issue 模板及赞助配置，可按自己仓库需要删除或重写。
- README.es.md、README.ja.md：模板西语／日语说明，不需要可删除并清理 README 中对应链接。中文／英文根文档是否保留按项目说明需要决定。

## 可清理但不属于冗余源码

- 前端根目录的历史 *.log：构建、测试和格式化输出，可以删除。
- dist/：构建产物，可重新生成；如果正在用其部署或预览，先保留当前部署版本。
- node_modules/：安装产物，不建议当作本次源码清理对象；删除后必须重新安装才能开发。

不要删 package-lock.json；应在确认不用的依赖卸载后由 npm 同步维护。

## 必须保留

- src/main.js、App.vue、permission.js、router/index.js、store/、layout/、settings.js。
- src/views/user/login/ 的当前登录、改密组件；user/management/；project/list、detail、js、styles 与 EntityDialog；sop/list、detail、editor、preview、components、js、styles；location、station、tool、resource。
- sop/editor/js/sop_editor.js：虽然名字像旧编辑器，sop_authoring.js 仍 extends 它，不能删。
- src/api/user.js、project.js、sop.js、resource.js；utils/auth、request、business_code 等当前业务依赖。
- src/components/Breadcrumb、Hamburger、HeaderSearch、Pagination、SvgIcon、Screenfull、SizeSelect、ErrorLog、RightPanel、ThemePicker：当前布局或业务仍使用。
- src/views/error-page/、redirect/、dashboard/index.vue；src/assets/401_images、404_images；public/index.html 和 favicon.ico。
- src/icons/、src/styles/：图标目录通过 require.context 注册，不能仅因缺少显式 import 就认定未用；全局样式和主题变量也仍使用。
- tests/ 与业务 docs/；VueCLI、Babel、ESLint、Jest 等配置。
- LICENSE：仓库保留了原模板许可和作者声明，不作为模板冗余文件删除。
- dev_skill.md：包含用户的目录组织及审批约定，不当作模板示例删除。

## 依赖清理安排

删除对应源文件并确认无引用后，可以评估卸载 echarts、driver.js、dropzone、codemirror、jsonlint、tui-editor、vue-count-to、vue-splitpane、sortablejs、vuedraggable、xlsx、jszip、file-saver、clipboard 等演示依赖。清理 Mock 后再评估 mockjs。

不能只凭“源码没有 import”卸载依赖，例如 core-js 会由 Babel 处理，script-loader、各类 loader 和构建插件也可能被配置间接使用。依赖卸载是独立步骤，应同步 package.json 和 package-lock.json，然后验证安装、lint、96 项现有前端测试和生产构建。

## 后续候选（尚未删除）

第一、第二批已完成。后续可重新检查仅服务于已删除演示页的公共组件、article/qiniu/remote-search/role 旧 API、vendor 导出工具和 custom-theme 资源；应在删除前再次核对剩余消费者，不把整个 components、api 或 assets 目录删除。

main.js 仍会在生产环境注入 Mock；mock/ 需先移除入口再删除。sop/annotation/、AuthRedirect 和 profile 残留入口也要与对应路由、菜单一起处理。npm依赖暂未卸载，后续需分别更新 package.json 与锁文件并验证。


2026-10-17 更新：独立 annotation 演示路由已合并为 SOP 列表兼容跳转，当前不再导入 views/sop/annotation/index.vue。旧原型源码仍保留参考，本批没有删除目录；正式标注实现为 views/sop/editor 和 shared/sop/components/VisualCanvas.vue。
