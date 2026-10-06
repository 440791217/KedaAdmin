import request from '@/utils/request'

export function fetchProjectList(query) {
  return request({
    url: '/project/list',
    method: 'get',
    params: query
  })
}

export function createProject(data) {
  return request({
    url: '/project',
    method: 'post',
    data
  })
}

export function updateProject(projectId, data) {
  return request({
    url: `/project/${projectId}`,
    method: 'put',
    data
  })
}

export function deleteProject(projectId) {
  return request({
    url: `/project/${projectId}`,
    method: 'delete'
  })
}
