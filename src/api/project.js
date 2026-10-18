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
export function deleteProject(id, version) {
  return request({
    url: `/project/${id}`,
    method: 'delete',
    data: { version }
  })
}

export const fetchProject = id => request({ url: `/project/${id}` })
export const fetchProjectMembers = (pid, params) => request({ url: `/project/${pid}/member/list`, params })
export const fetchMemberOptions = (pid, keyword, purpose = 'member') => request({ url: `/project/${pid}/member/options`, params: { keyword, purpose }})
export const addProjectMember = (pid, data) => request({ url: `/project/${pid}/member`, method: 'post', data })
export const updateProjectMember = (pid, uid, data) => request({ url: `/project/${pid}/member/${uid}`, method: 'put', data })
export const removeProjectMember = (pid, uid, version) => request({ url: `/project/${pid}/member/${uid}`, method: 'delete', data: { version }})
export const transferProjectOwner = (pid, data) => request({ url: `/project/${pid}/owner`, method: 'put', data })
export const transferSubprojectOwner = (pid, sid, data) => request({ url: `/project/${pid}/subproject/${sid}/owner`, method: 'put', data })
export const fetchProjectActivities = (pid, params) => request({ url: `/project/${pid}/activity/list`, params })
export const restoreProject = (id, version) => request({ url: `/project/${id}/restore`, method: 'put', data: { version }})
export const restoreSubproject = (pid, id, version) => request({ url: `/project/${pid}/subproject/${id}/restore`, method: 'put', data: { version }})
export const setProjectStatus = (id, status, version) => request({ url: `/project/${id}/status`, method: 'put', data: { status, version }})
export const fetchOwnerOptions = keyword => request({ url: '/project/owner/options', params: { keyword }})
export const fetchSubprojects = id => request({ url: `/project/${id}/subproject/list` })
export const fetchSubproject = (pid, id) => request({ url: `/project/${pid}/subproject/${id}` })
export const fetchSubOwnerOptions = (pid, keyword) => request({ url: `/project/${pid}/subproject/owner/options`, params: { keyword }})
export const createSubproject = (pid, data) => request({ url: `/project/${pid}/subproject`, method: 'post', data })
export const updateSubproject = (pid, id, data) => request({ url: `/project/${pid}/subproject/${id}`, method: 'put', data })
export const deleteSubproject = (pid, id, version) => request({ url: `/project/${pid}/subproject/${id}`, method: 'delete', data: { version }})
export const setSubprojectStatus = (pid, id, status, version) => request({ url: `/project/${pid}/subproject/${id}/status`, method: 'put', data: { status, version }})
export const sortSubprojects = (pid, ids, version) => request({ url: `/project/${pid}/subproject/sort`, method: 'put', data: { ids, version }})
