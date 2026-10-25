const ADDRESS_KEY = 'capture-service-address'
const TOKEN_KEY = 'capture-service-token'
export const DEFAULT_CAPTURE_ADDRESS = 'http://localhost:18090'

export function normalizeCaptureAddress(value) {
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('请输入完整服务地址，例如 http://localhost:18090，不包含路径或账号密码')
  }
  return url.origin
}

export function readCaptureSettings() {
  return {
    address: localStorage.getItem(ADDRESS_KEY) || DEFAULT_CAPTURE_ADDRESS,
    token: sessionStorage.getItem(TOKEN_KEY) || '88888888'
  }
}

export function saveCaptureSettings(settings) {
  const address = normalizeCaptureAddress(settings.address)
  localStorage.setItem(ADDRESS_KEY, address)
  sessionStorage.setItem(TOKEN_KEY, settings.token.trim())
  return { address, token: settings.token.trim() }
}

// Use a separate client: business login credentials must never be sent to this service.
export async function checkCaptureService(settings) {
  const address = normalizeCaptureAddress(settings.address)
  if (!settings.token.trim()) throw new Error('请先填写采集服务访问凭证')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(address + '/tools', {
      headers: { Authorization: 'Bearer ' + settings.token.trim() },
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error'
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '采集服务请求失败（' + response.status + '）')
    if (typeof data.ffmpeg !== 'boolean' || typeof data.mediamtx !== 'boolean') throw new Error('响应格式不正确，请检查采集服务地址')
    return data
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('连接超时，请确认采集服务已启动且地址正确')
    if (error instanceof TypeError) throw new Error('无法连接，请检查服务地址、跨域允许来源及浏览器网络权限')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
