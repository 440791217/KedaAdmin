import request from '@/utils/request'
export const fetchResources = (kind, params) => request({ url: `/resource/${kind}`, params })
export const fetchResource = (kind, id) => request({ url: `/resource/${kind}/${id}` })
export const saveResource = (kind, data) => request({ url: `/resource/${kind}${data.id ? '/' + data.id : ''}`, method: data.id ? 'put' : 'post', data })
export const removeResource = (kind, row) => request({ url: `/resource/${kind}/${row.id}`, method: 'delete', data: { version: row.version }})
export const fetchResourceOwners = keyword => request({ url: '/resource/owner/options', params: { keyword }})
export const previewDevice = id => request({ url: `/resource/device/${id}/preview`, responseType: 'blob', timeout: 35000 })
export const testCameraConnection = data => request({ url: '/resource/device/connection/test', method: 'post', data, responseType: 'blob', timeout: 35000 })
export const snapshotDevice = id => request({ url: `/resource/device/${id}/snapshot`, method: 'post', responseType: 'blob', timeout: 35000 })
export const fetchCameraCaptureConfig = id => request({ url: `/resource/device/${id}/capture-config` })
const tasks = (pid, sid) => `/project/${pid}/subproject/${sid}/task`
export const fetchTasks = (pid, sid) => request({ url: tasks(pid, sid) })
export const saveTask = (pid, sid, data) => request({ url: tasks(pid, sid) + (data.id ? '/' + data.id : ''), method: data.id ? 'put' : 'post', data })
export const previewTask = (pid, sid, id) => request({ url: tasks(pid, sid) + `/${id}/preview` })
export const fetchTaskImage = (pid, sid, id, fid) => request({ url: tasks(pid, sid) + `/${id}/image/${fid}`, responseType: 'blob' })

export const fetchTaskOwners = (pid, sid, keyword) => request({ url: tasks(pid, sid) + '/owner/options', params: { keyword }})

export const fetchStationTasks = id => request({ url: `/resource/station/${id}/task` })

export const publishTaskStandard = (pid, sid, id, data) => request({ url: tasks(pid, sid) + `/${id}/publish`, method: 'put', data })

export const prepareTaskContent = (pid, sid, id, data) => request({ url: tasks(pid, sid) + `/${id}/content`, method: 'post', data })

export const deleteTask = (pid, sid, row) => request({ url: tasks(pid, sid) + `/${row.id}`, method: 'delete', data: { version: row.version }})

