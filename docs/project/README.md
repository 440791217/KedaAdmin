# 项目与子项目前端

## 页面和源码

| 页面 | 路由 | 源码 |
|---|---|---|
| 项目列表 | /project/list | [list/index.vue](../../src/views/project/list/index.vue) |
| 项目详情 | /project/:projectId | [detail/index.vue](../../src/views/project/detail/index.vue) |
| 子项目详情 | /project/:projectId/subproject/:subprojectId | 复用项目详情，根据路由展示 |

页面JS在各自js目录；共用表单 [EntityDialog.vue](../../src/shared/project/components/EntityDialog.vue)，公共逻辑与样式在 src/shared/project/js 和 src/shared/project/styles；各页面通过自己的 styles/index.scss 引入共享样式；组件PascalCase，JS小写下划线。请求集中在 [src/api/project.js](../../src/api/project.js)。

## 使用流程

登录后进入“项目管理→项目列表”，新建项目，点击项目名称进入详情，创建子项目。支持编号/名称和状态筛选、分页、资料编辑、状态变更、归档、符合条件时删除。子项目用上下按钮调整顺序并立即保存；操作集中在“编辑”下拉中。已归档且后台can_restore为true时显示“恢复归档”，确认后恢复原状态；主项目恢复会联动恢复随其归档的子项目，独立归档子项目保持归档，旧档无历史时恢复为未开始。

使用恢复功能前，先按 [数据库升级说明](../../../SOP_MySQL/project-module-v1/README.md) 执行归档恢复迁移，再重启后端。主项目恢复限root或项目负责人；子项目恢复按后台权限标志显示，父项目处于归档/完成时不能直接恢复子项目。

负责人通过真实接口搜索用户，新建项目自动加入创建人和负责人。项目详情提供“子项目／项目成员／操作记录”页签，成员页支持搜索、有效/已移除筛选、分页、添加/重新加入、权限调整和移除。缺少系统功能权限时显示提示和缺项；系统角色仍由用户管理员配置，成员等级不替代系统权限。

root或主项目负责人可从“编辑→转移负责人”办理主项目或子项目交接。主项目新负责人可从正常用户选择，自动成为编辑成员；子项目新负责人必须已是项目有效编辑成员。普通资料编辑中的负责人一律只读。主项目转移后返回项目列表，避免旧负责人失去管理权限后仍停留在管理页面。

当前项目负责人不能直接移除/降级，负责未删除子项目（含归档）的成员先交接。已完成/归档项目仍允许授权人员交接，业务内容保持只读。操作记录页只读显示操作者、目标用户和变更前后值。

使用本批功能前，按 [数据库升级说明](../../../SOP_MySQL/project-module-v1/README.md) 执行尚未执行的001、002迁移后重启后端。相关组件在detail/components，脚本在detail/js，新增ProjectMembers.vue、ProjectActivity.vue、OwnerTransfer.vue；共用样式仍在project/styles。

请求带version，冲突409关闭过期表单并刷新；失败不会提示保存成功。ID始终按字符串处理，UTC时间在前端格式化。列表与详情显示真实数据，不再使用分总成及工序页面的写死演示数据。

列表加载失败显示重试提示，区别于没有项目；新建成功回到第一页，编辑保留当前页。编辑前读取最新资料和版本。提交在表单验证期间也会锁定，避免重复请求；负责人搜索和详情加载忽略已过期的异步结果。主项目未开始时，不显示子项目开始操作，先从主项目“编辑→开始”进入进行中。

旧 /production_management/project、/production_management/project/edit/:id 跳转新页面；旧工序演示入口跳转项目列表。工位、工具仍保留原功能，父菜单显示“现场资源”。旧原型源码保留但不再进入路由。

## 联调与边界

- [后台项目接口及规则](../../../SOP_Server_of_Java/docs/project/README.md)
- [数据库项目设计](../../../SOP_MySQL/docs/project/README.md)
- [前端启动](../../INTEGRATION.md)
- [模块变更记录](changelog.md)

root可直接使用。普通用户创建权限的配置见后台说明，不由前端模拟授权。SOP关联、现场分发、执行记录属于后续模块。

后端增加接口后必须重新启动Java进程。如果页面提示404，先确认 http://localhost:8080/v3/api-docs 中存在/project相关路径，再检查前端代理。页面组件测试不能代替真实运行实例与MySQL联调。

验证命令（在KedaAdmin运行）：

```text
node node_modules/@vue/cli-service/bin/vue-cli-service.js test:unit --runInBand --no-cache tests/unit/components/ProjectPages.spec.js tests/unit/components/ProjectCollaboration.spec.js tests/unit/utils/project-management.spec.js
npm run build:prod
```

较新Node运行旧版Webpack时可能需要设置NODE_OPTIONS=--openssl-legacy-provider。页面组件测试挂载真实页面与表单，使用可控的API响应验证交互；下拉框定位依赖浏览器布局，因此在组件测试中隔离。测试覆盖新建/编辑、列表过滤/重试、排序、状态、删除跳转、异步过期结果、版本和重复提交；不能替代已启动后端及真实MySQL的完整联调。

SOP对接：主项目与子项目详情均增加“关联 SOP”页签，按目标权限选择固定发布版、切换、排序和解绑；详见[SOP页面说明](../sop/README.md)。

新建项目/子项目由前端生成PRJ/SUB-年月日小时分钟-6位随机码，只读显示，提交时携带code。失败重试沿用编号，取消重新打开才新生成；编辑保留旧编号。无需执行流水表迁移，更新后重启前后端。公共代码位于src/utils/business_code.js。


## 工位与子项目任务

任务属于子项目，直接绑定工位并独立固定发布版本；项目不单独维护工位分配。步骤设备及环境要求随版本保存，旧关联入口保留用于标准查阅。当前行为、权限与启用顺序见 [资源与任务模块](../resource/README.md)。


## SOP任务统一工作界面

项目 → 子项目 → SOP任务，任务直接维护步骤、图片、标注和设备要求。点击任务名称进入三栏制作界面的查看模式；列表“编辑内容”直接进入同一界面的编辑模式，不再经过摘要详情页。

新建任务先填写名称、工位及负责人，点击“保存并进入编辑”。已有任务顶部提供“编辑／查看”“任务设置”和“返回子项目”；任务设置弹窗修改工位、负责人等配置。离开、切换模式或打开设置前处理未保存内容。

查看模式展示当前发布内容；尚未发布时，有编辑权限的人可查看现有草稿。编辑会继续草稿，或基于发布版本建立下一草稿；发布后回到当前任务的查看模式。取消任务、完成／归档项目及无权限用户不能编辑，后台也拒绝直接写入任务归属内容。

路由仍为 /project/{pid}/subproject/{sid}/task/{taskId}，mode=edit 可直接进入编辑。工位入口只查询并跳转任务；项目本身不直接挂任务。旧内容保留，首次编辑按任务复制，其他任务不受影响。

本次统一界面无需新增SQL。此前 resource-module-v1/migrations/002_task_content.sql 已执行则无需重复执行；更新后重启后台并刷新前端。详见 [SOP任务内容](../sop/README.md)。

## root专用删除

项目、子项目和SOP任务提供逻辑删除，仅is_superuser账号可用。项目列表／详情和子项目操作菜单使用can_delete，任务列表响应另含can_delete；普通负责人和任务管理者不能删除，旧的空项目删除权限也统一收紧为超级用户。归档／已完成记录也允许root删除。

删除项目会同步逻辑删除其有效子项目和任务；删除子项目会同步删除其任务。删除前确认影响范围，后台校验version并持有父项目锁；范围内有进行中或暂停的执行记录则409，必须先结束作业。任务删除接口为DELETE /project/{pid}/subproject/{sid}/task/{id}，JSON {version}；项目和子项目沿用既有DELETE接口。

数据库保留名称、编号、内容、版本、附件、执行历史和删除审计，业务列表及现场入口隐藏已删除记录。逻辑删除不提供恢复入口，归档恢复仍是独立功能。执行记录沿用快照和历史图片授权，不因删除业务对象失去追溯。编号不回收。

无需新SQL或新增权限定义，但必须已部署上一批execution-module-v1/schema.sql的执行记录三表，供删除拦截查询。更新前后端并重启后台，刷新页面。

## 发布即就绪

SOP任务取消“待配置／已配置”手动选择，界面以未发布／已发布／已取消表示。保存任务不再要求status，0/1兼容旧客户端但由发布引用自动计算，2仍用于显式取消。已有发布内容的旧status=0任务无需SQL即可在现场使用；现场仍校验工位、硬件及项目关闭状态，缺项显示具体原因，不要求人工切换配置状态。更新前后端并重启后台。
