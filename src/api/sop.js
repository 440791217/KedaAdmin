import request from '@/utils/request'
export const fetchSops = (params) => request({ url: '/sop/list', params })
export const fetchSop = (id) => request({ url: `/sop/${id}` })
export const fetchSopProjects = (keyword) => request({ url: '/sop/project/options', params: { keyword }})
export const fetchSopOwners = (pid, keyword) =>
  request({ url: `/sop/project/${pid}/owner/options`, params: { keyword }})
export const createSop = (data) => request({ url: '/sop', method: 'post', data })
export const editSop = (id, data) => request({ url: `/sop/${id}`, method: 'put', data })
export const deleteSop = (id, version) => request({ url: `/sop/${id}`, method: 'delete', data: { version }})
export const transferSopOwner = (id, data) => request({ url: `/sop/${id}/owner`, method: 'put', data })
export const fetchSopVersions = (id) => request({ url: `/sop/${id}/version/list` })
const versionPath = (id, rid) => `/sop/${id}/version/${rid}`
export const fetchSopVersion = (id, rid) => request({ url: versionPath(id, rid) })
export const saveSopVersion = (id, rid, data) => request({ url: versionPath(id, rid), method: 'put', data })
export const copySopDraft = (id, source, version) =>
  request({ url: `/sop/${id}/draft`, method: 'post', data: { source_revision_id: source, version }})
export const discardSopDraft = (id, rid, version) =>
  request({ url: versionPath(id, rid), method: 'delete', data: { version }})
export const publishSopVersion = (id, rid, version) =>
  request({ url: versionPath(id, rid) + '/publish', method: 'put', data: { version }})
export const retireSopVersion = (id, rid, version) =>
  request({ url: versionPath(id, rid) + '/retire', method: 'put', data: { version }})
export const addSopStep = (id, rid, data) =>
  request({ url: versionPath(id, rid) + '/step', method: 'post', data })
export const editSopStep = (id, rid, sid, data) =>
  request({ url: versionPath(id, rid) + `/step/${sid}`, method: 'put', data })
export const deleteSopStep = (id, rid, sid, version, revisionVersion) =>
  request({
    url: versionPath(id, rid) + `/step/${sid}`,
    method: 'delete',
    data: { version, revision_version: revisionVersion }
  })
export const sortSopSteps = (id, rid, ids, version) =>
  request({ url: versionPath(id, rid) + '/step/sort', method: 'put', data: { ids, version }})
export function uploadSopImage(id, rid, sid, file, version) {
  const data = new FormData()
  data.append('file', file)
  data.append('version', version)
  return request({ url: versionPath(id, rid) + `/step/${sid}/image`, method: 'post', data, timeout: 60000 })
}
export const removeSopImage = (id, rid, sid, aid, version) =>
  request({ url: versionPath(id, rid) + `/step/${sid}/image/${aid}`, method: 'delete', data: { version }})
export const fetchSopImage = (id, rid, fid) =>
  request({ url: versionPath(id, rid) + `/image/${fid}`, responseType: 'blob' })
export const bindingBase = (pid, sid) => `/project/${pid}` + (sid ? `/subproject/${sid}` : '') + '/sop'
export const fetchSopBindings = (pid, sid) => request({ url: bindingBase(pid, sid) + '/list' })
export const fetchBindableSops = (pid, sid, keyword) =>
  request({ url: bindingBase(pid, sid) + '/options', params: { keyword }})
export const saveSopBinding = (pid, sid, bid, data) =>
  request({ url: bindingBase(pid, sid) + (bid ? `/${bid}` : ''), method: bid ? 'put' : 'post', data })
export const unbindSop = (pid, sid, bid, version, targetVersion) =>
  request({
    url: bindingBase(pid, sid) + `/${bid}`,
    method: 'delete',
    data: { version, target_version: targetVersion }
  })
export const sortSopBindings = (pid, sid, ids, targetVersion) =>
  request({
    url: bindingBase(pid, sid) + '/sort',
    method: 'put',
    data: { ids, target_version: targetVersion }
  })
export const previewBoundSop = (pid, sid, bid) => request({ url: bindingBase(pid, sid) + `/${bid}/preview` })
export const fetchBoundSopImage = (pid, sid, bid, fid) =>
  request({ url: bindingBase(pid, sid) + `/${bid}/image/${fid}`, responseType: 'blob' })

export const saveSopAuthoring = (id, rid, sid, data) => request({ url: versionPath(id, rid) + `/step/${sid}/authoring`, method: 'put', data })
