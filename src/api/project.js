import request from '@/utils/request'

// 获取工程项目列表的接口
export function fetchProjectList(query) {
  return request({
    url: '/vue-element-admin/project/list', // 👈 注意：这里的 URL 后续要改成你真正的后端接口地址
    method: 'get',
    params: query
  })
}

// 顺便把后续可能用到的“新建”和“更新”接口也预留在这里：
export function createProject(data) {
  return request({
    url: '/vue-element-admin/project/create',
    method: 'post',
    data
  })
}

export function updateProject(data) {
  return request({
    url: '/vue-element-admin/project/update',
    method: 'post',
    data
  })
}
