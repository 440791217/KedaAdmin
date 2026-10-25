import { readCaptureSettings, normalizeCaptureAddress } from './capture-service'

let readerLoading
export function loadCaptureReader() {
  if (window.MediaMTXWebRTCReader) return Promise.resolve(window.MediaMTXWebRTCReader)
  if (!readerLoading) {
    readerLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = process.env.BASE_URL + 'vendor/mediamtx/reader.js'
      script.onload = () => {
        if (window.MediaMTXWebRTCReader) resolve(window.MediaMTXWebRTCReader)
        else { readerLoading = null; script.remove(); reject(new Error('视频预览组件加载失败')) }
      }
      script.onerror = () => { readerLoading = null; script.remove(); reject(new Error('视频预览组件加载失败，请刷新页面重试')) }
      document.head.appendChild(script)
    })
  }
  return readerLoading
}

export function createCaptureClient(settings = readCaptureSettings()) {
  const address = normalizeCaptureAddress(settings.address)
  const token = settings.token.trim()
  if (!token) throw new Error('请先到“系统配置 → 网络配置”保存采集服务地址和访问凭证')
  async function request(path, method = 'GET', body, keepalive = false) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), method === 'DELETE' ? 5000 : 25000)
    try {
      const response = await fetch(address + path, {
        method, headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal, keepalive
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (response.status === 401) throw new Error('采集服务访问凭证已失效，请在“系统配置 → 网络配置”更新并保存')
        throw new Error(data.error || '采集服务请求失败（' + response.status + '）')
      }
      if (response.status === 204) return null
      if ((response.headers.get('Content-Type') || '').includes('image/jpeg')) {
        const photo = await response.blob()
        if (!photo.size) throw new Error('采集服务返回了空照片，请重试')
        return photo
      }
      return response.json()
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('采集服务请求超时，请检查服务及摄像头连接')
      if (error instanceof TypeError) throw new Error('无法连接采集服务，请检查网络配置、服务启动状态和跨域设置')
      throw error
    } finally { clearTimeout(timeout) }
  }
  return {
    token,
    open: config => request('/sessions', 'POST', config),
    heartbeat: id => request('/sessions/' + encodeURIComponent(id) + '/heartbeat', 'POST'),
    snapshot: id => request('/sessions/' + encodeURIComponent(id) + '/snapshot', 'POST'),
    release: id => request('/sessions/' + encodeURIComponent(id), 'DELETE', undefined, true),
    previewURL(session) {
      const url = new URL(session.preview_url, address)
      if (url.origin !== address || url.pathname !== '/sessions/' + encodeURIComponent(session.session_id) + '/whep' || url.search || url.hash) throw new Error('采集服务返回的预览地址无效')
      return url.href
    }
  }
}
