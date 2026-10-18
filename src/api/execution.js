import request from '@/utils/request'
export const fetchExecutions = params => request({ url: '/execution', params })
export const fetchExecution = id => request({ url: `/execution/${id}` })
export const startExecution = data => request({ url: '/execution', method: 'post', data })
export const actExecution = (id, action, data) => request({ url: `/execution/${id}/${action}`, method: 'put', data })
export const confirmExecutionStep = (id, position, data) => request({ url: `/execution/${id}/step/${position}/confirm`, method: 'put', data })
export const fetchExecutionImage = (id, fileId) => request({ url: `/execution/${id}/image/${fileId}`, responseType: 'blob' })
