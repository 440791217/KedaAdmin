# 页面与共享代码目录约定

用户确认的结构：views 下每个目录是一个业务分类，分类下每个目录是一张页面，页面入口统一 index.vue。组件、逻辑和样式分别放在页面内的 components、js、styles，不再直接放到分类根目录。

```text
src/views/
├── resource/
│   ├── location/       # 位置管理
│   ├── station/        # 工位管理
│   └── tool/           # 工具与设备（含规格页签）
├── project/
│   ├── list/
│   ├── detail/         # 项目／子项目详情，共用页面组件
│   └── task/           # SOP任务新建／编辑工作页
├── sop/
│   ├── list/
│   ├── detail/
│   ├── editor/
│   ├── preview/
│   └── annotation/     # 旧原型仅留参考，路由不再加载
└── user/
    ├── login/
    ├── management/
    ├── change_password/
    └── auth_redirect/
```

每个页面目录具有：

```text
页面目录/
├── index.vue
├── components/        # 只供本页面使用的 PascalCase 组件
├── js/                # 小写下划线脚本
└── styles/            # 页面及本页面组件样式
```

暂时没有文件的目录用 .gitkeep 保留，避免提交 Git 后缺少用户约定的页面骨架。不为凑目录复制共享业务代码。

## 跨页面复用

复用代码统一放在 views 外：

```text
src/shared/
├── resource/
│   ├── components/    # ResourcePage、DeviceConnection、ScannerInput
│   ├── js/
│   └── styles/
├── project/
│   ├── components/    # EntityDialog
│   ├── js/            # 表单逻辑、项目状态等共享辅助函数
│   └── styles/
└── sop/
    ├── components/    # CreateSopDialog、SopBindings、私有图片及标注画布
    ├── js/
    └── styles/
```

ResourcePage 被位置、工位、工具三个页面使用；CreateSopDialog 用于任务工作页内制作操作标准；SOP 画布及私有图片同时用于制作、预览、任务查看。它们不归属某一页面，放在 shared，而不是互相引用 views 内其他页面的私有组件。

通用无业务含义的 UI 基础组件继续位于 src/components。请求封装继续位于 src/api，登录基础工具仍在 src/utils，不因页面目录调整混入 shared 或 views。

## 引用规则

- JS import 跨模块使用 @/shared/...；页面内组件可使用当前页面路径。
- Vue 外置 script 的 src 使用相对路径（例如 ./js/station.js、../js/resource_page.js）。旧版 vue-jest 不解析 script src 的 @ 别名，勿与 JS import 混用。
- 页面 index.vue 从自己 styles 目录引入样式；多个页面复用的样式通过页面样式文件 @import 共享样式，保持单一内容来源。
- 路由只指向页面 index.vue；组件不直接充当路由页面。
- JS 文件命名使用小写下划线，Vue 组件使用 PascalCase；页面入口使用 index.vue。

## 此次调整范围

移动29个既有文件，合并原 views/location、station、tool 到 views/resource 的对应页面目录；项目／SOP 分类根下的公共文件移入 shared；CreateSopDialog 移为共享组件；改密及回调移为独立页面；旧 annotation 页脚本移入其 js 目录。

原 URL、接口、组件 name、权限和业务行为保持原有约定。同步修改路由、源码导入、单元测试导入及模块说明。模板 dashboard、error-page、redirect 和保留的 profile 不在本次新业务目录整改范围内，不执行额外删除。

## 验证结果

14个新业务页面全部具备 index.vue、components、js、styles，四个分类根目录无公共代码目录。旧源码引用检查通过；受影响文件 ESLint 零警告，16套96项前端测试全部通过，生产构建通过（仅原有包体积提示）。本次仅调整前端组织，不需要执行数据库脚本。
