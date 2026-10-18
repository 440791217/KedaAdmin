import { getToken } from '@/utils/auth'

// Decode multipart frames by Content-Length, including headers split across network chunks.
export function cameraFrames(onFrame) {
  let pending = new Uint8Array(0)
  let length = null
  return chunk => {
    const joined = new Uint8Array(pending.length + chunk.length)
    joined.set(pending); joined.set(chunk, pending.length); pending = joined
    while (pending.length) {
      if (length === null) {
        let end = -1
        for (let i = 0; i + 3 < pending.length; i++) {
          if (pending[i] === 13 && pending[i + 1] === 10 && pending[i + 2] === 13 && pending[i + 3] === 10) { end = i; break }
        }
        if (end < 0) {
          if (pending.length > 4096) throw new Error('摄像头预览响应格式不正确')
          return
        }
        if (end > 4096) throw new Error('摄像头预览响应头过长')
        const header = String.fromCharCode(...pending.slice(0, end))
        const match = /Content-Length:\s*(\d+)/i.exec(header)
        if (!match || Number(match[1]) < 4 || Number(match[1]) > 5 * 1024 * 1024) throw new Error('摄像头预览图片大小不正确')
        length = Number(match[1]); pending = pending.slice(end + 4)
      }
      if (pending.length < length) return
      onFrame(new Blob([pending.slice(0, length)], { type: 'image/jpeg' }))
      pending = pending.slice(length); length = null
    }
  }
}

export async function readCameraStream(id, signal, onFrame) {
  const base = (process.env.VUE_APP_BASE_API || '').replace(/\/$/, '')
  const response = await fetch(`${base}/resource/device/${encodeURIComponent(id)}/stream`, {
    headers: { Authorization: `Bearer ${getToken()}` }, signal, cache: 'no-store'
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `摄像头预览失败（${response.status}）`)
  }
  if (!response.body || !/multipart\/x-mixed-replace/i.test(response.headers.get('Content-Type') || '')) throw new Error('浏览器或服务不支持摄像头流式预览')
  const reader = response.body.getReader()
  const accept = cameraFrames(onFrame)
  let received = false
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      accept(value); received = true
    }
    if (!received && !signal.aborted) throw new Error('未获取到摄像头画面')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
