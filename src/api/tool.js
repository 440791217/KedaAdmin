import request from '@/utils/request'

// 工具列表
export function fetchToolList(query) {
  return request({
    url: '/tool/list',
    method: 'get',
    params: query
  })
}

// 新增工具
export function createTool(data) {
  return request({
    url: '/tool',
    method: 'post',
    data
  })
}

// 编辑工具
export function updateTool(id, data) {
  return request({
    url: `/tool/${id}`,
    method: 'put',
    data
  })
}

// 删除工具
export function deleteTool(id) {
  return request({
    url: `/tool/${id}`,
    method: 'delete'
  })
}
