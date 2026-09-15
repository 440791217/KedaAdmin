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
    url: '/tool/create',
    method: 'post',
    data
  })
}

export function updateTool(data) {
  return request({
    url: '/tool/update',
    method: 'post',
    data
  })
}

export function deleteTool(id) {
  return request({
    url: '/tool/delete',
    method: 'post',
    params: { id }
  })
}
