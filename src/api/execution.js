import request from '@/utils/request'
export const fetchExecutions = params => request({ url: '/execution', params })
export const fetchExecution = id => request({ url: `/execution/${id}` })
export const updateExecutionClock = (id, data) => request({ url: `/execution/${id}/clock`, method: 'post', data, timeout: 10000 })
export const startExecution = data => request({ url: '/execution', method: 'post', data })
export const actExecution = (id, action, data) => request({ url: `/execution/${id}/${action}`, method: 'put', data })
export const confirmExecutionStep = (id, position, data) => request({ url: `/execution/${id}/step/${position}/confirm`, method: 'put', data })
export const fetchExecutionImage = (id, fileId) => request({ url: `/execution/${id}/image/${fileId}`, responseType: 'blob' })
export const fetchExecutionEvidenceImage = (id, position) => request({ url: `/execution/${id}/step/${position}/evidence`, responseType: 'blob' })
export function confirmExecutionEvidence(id, position, photo, version, clockSessionId) {
  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify({ ...photo.metadata, version, ...(clockSessionId ? { clock_session_id: clockSessionId } : {}) })], { type: 'application/json' }))
  body.append('file', photo.file, '现场照片.jpg')
  return request({ url: `/execution/${id}/step/${position}/evidence`, method: 'post', data: body })
}
