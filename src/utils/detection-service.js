import { normalizeCaptureAddress } from './capture-service'

export function readDetectionSettings() {
  return { address: localStorage.getItem('detection-service-address') || 'http://localhost:18092', token: sessionStorage.getItem('detection-service-token') || '88888888' }
}

export function saveDetectionSettings(settings) {
  const address = normalizeCaptureAddress(settings.address)
  const token = settings.token.trim()
  if (!token) throw new Error('请填写检测服务访问凭证')
  localStorage.setItem('detection-service-address', address)
  sessionStorage.setItem('detection-service-token', token)
  return { address, token }
}

export function createDetectionClient(settings = readDetectionSettings()) {
  const address = normalizeCaptureAddress(settings.address)
  const token = settings.token.trim()
  if (!token) throw new Error('请在网络配置中填写检测服务访问凭证')
  async function request(path, options = {}) {
    try {
      const response = await fetch(address + path, { ...options, headers: { Authorization: 'Bearer ' + token }, credentials: 'omit', redirect: 'error', cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        const messages = { 401: '检测服务凭证无效，请检查网络配置', 403: '检测服务未允许当前网页来源', 429: '检测服务繁忙，稍后重试', 503: '检测模型尚未就绪' }
        throw new Error(messages[response.status] || '检测请求失败（' + response.status + '）')
      }
      return data
    } catch (error) {
      if (error instanceof TypeError) throw new Error('无法连接检测服务，请检查地址、启动状态和跨域配置')
      throw error
    }
  }
  return {
    models: signal => request('/models', { signal }),
    predict(file, metadata, signal) {
      const body = new FormData()
      body.append('file', file, 'frame.jpg'); body.append('metadata', JSON.stringify(metadata))
      return request('/predict', { method: 'POST', body, signal })
    }
  }
}
