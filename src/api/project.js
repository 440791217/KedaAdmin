import request from '@/utils/request'

// 项目列表
export function fetchProjectList(query) {
  return request({
    url: '/project/list',
    method: 'get',
    params: query
  })
}

// 新增项目
export function createProject(data) {
  return request({
    url: '/project',
    method: 'post',
    data
  })
}

// 编辑项目
export function updateProject(id, data) {
  return request({
    url: `/project/${id}`,
    method: 'put',
    data
  })
}

// 删除项目
export function deleteProject(id) {
  return request({
    url: `/project/${id}`,
    method: 'delete'
  })
}
