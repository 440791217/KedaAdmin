import request from '@/utils/request'

export function fetchToolList(query) {
  return request({
    url: '/tool/list',
    method: 'get',
    params: query
  })
}

export function createTool(data) {
  return request({
    url: '/tool',
    method: 'post',
    data
  })
}

export function updateTool(toolId, data) {
  return request({
    url: `/tool/${toolId}`,
    method: 'put',
    data
  })
}

export function deleteTool(toolId) {
  return request({
    url: `/tool/${toolId}`,
    method: 'delete'
  })
}
