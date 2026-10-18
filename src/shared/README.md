# 业务共享代码

resource、project、sop 分别存放跨页面复用的组件、脚本与样式。页面私有代码留在 src/views/<分类>/<页面>/{components,js,styles}。

不要让一个页面通过另一个页面的内部目录复用组件；跨页复用时移动到本目录。通用 UI 组件仍放 src/components，请求仍放 src/api。

详细约定见 [页面目录说明](../../docs/development/page_structure.md)。
