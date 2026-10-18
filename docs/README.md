# 前端文档导航

启动入口见 [联调启动说明](../INTEGRATION.md)。

| 模块 | 页面与联调说明 | 变更记录 |
|---|---|---|
| 用户 | [登录、改密与用户管理](user/README.md) | [变更记录](user/changelog.md) |
| 项目 | [项目及子项目页面](project/README.md) | [变更记录](project/changelog.md) |
| SOP | [草稿、版本与项目关联](sop/README.md) | [变更记录](sop/changelog.md) |
| 现场资源与任务 | [工位、工具设备与子项目任务](resource/README.md) | [变更记录](resource/changelog.md) |

后续模块使用 docs/<模块>/README.md 和 changelog.md；README维护当前页面、路由、交互与联调方式，changelog只记录日期、变化和兼容影响。功能修改时同步更新本模块文档，后台规则和数据库结构通过链接引用，避免复制三份不同的规则。

目录命名使用小写；文档文件默认 README.md、changelog.md，额外文件使用小写下划线。源码目录仍按项目现有components/js/styles约定组织。原模板的多语言README保留，不充当业务模块文档。跨仓库链接假定三个工程位于同一父目录。

模板清理核查见 [前端冗余文件清单](development/cleanup_review.md)；第一、第二批已获授权执行，实际删除范围及后续候选见清单中的执行结果。

页面和业务共享代码组织见 [页面目录约定](development/page_structure.md)。
