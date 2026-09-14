const Mock = require('mockjs')

const List = []
const count = 50

let startJobNum = 1001

for (let i = 0; i < count; i++) {
  const currentJobNum = 'KD' + (startJobNum++)

  // 🟢 使用 Mock.js 的正则匹配生成 10 位的大写英文字母+数字的唯一项目ID
  const currentProjectId = Mock.mock(/[A-Z0-9]{10}/)

  List.push(Mock.mock({
    id: '@increment',
    projectId: currentProjectId, // 🟢 10位混淆假数据编码
    projectName: '汽车分总成研发项目_@integer(100, 999)号',
    jobNum: currentJobNum,
    manager: '@cname',
    subAssemblyCount: '@integer(1, 10)',
    createTime: '@datetime',
    updateTime: '@datetime'
  }))
}

module.exports = [
  {
    url: '/vue-element-admin/project/list',
    type: 'get',
    response: config => {
      const { projectId, projectName, manager, jobNum, sort, page = 1, limit = 20 } = config.query

      // 筛选
      let mockList = List.filter(item => {
        if (projectId && item.projectId.toLowerCase().indexOf(projectId.toLowerCase()) === -1) return false
        if (projectName && item.projectName.indexOf(projectName) === -1) return false
        if (manager && item.manager.indexOf(manager) === -1) return false
        if (jobNum && item.jobNum.toLowerCase().indexOf(jobNum.toLowerCase()) === -1) return false
        return true
      })

      // 排序
      if (sort === '-gmt_create') {
        mockList = [...mockList].sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      } else if (sort === '+gmt_create') {
        mockList = [...mockList].sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
      } else if (sort === '-gmt_modified') {
        mockList = [...mockList].sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
      } else if (sort === '+gmt_modified') {
        mockList = [...mockList].sort((a, b) => new Date(a.updateTime) - new Date(b.updateTime))
      }

      // 分页
      const pageList = mockList.filter((item, index) => index < limit * page && index >= limit * (page - 1))

      return {
        code: 20000,
        data: {
          total: mockList.length,
          items: pageList
        }
      }
    }
  }
]
