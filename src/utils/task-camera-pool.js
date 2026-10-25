import { fetchResource, fetchCameraCaptureConfig } from '@/api/resource'
import { createCaptureClient, loadCaptureReader } from './capture-session'

export const TASK_CAMERA_LIMIT = 4
const safeError = error => String(error.message || error).replace(/(?:https?|rtsps?):\/\/\S+/gi, '[地址]').slice(0, 300)

// One pool belongs to the workbench, not to its preview/execution component.
export class TaskCameraPool {
  constructor(stationId, limit = TASK_CAMERA_LIMIT) {
    this.stationId = String(stationId); this.limit = limit
    this.entries = new Map(); this.listeners = new Set(); this.desired = []; this.selected = ''; this.displayed = ''; this.closed = false
    this.queue = Promise.resolve(); this.releases = Promise.resolve()
    this.host = document.createElement('div')
    this.host.setAttribute('aria-hidden', 'true')
    // Keep decoder elements alive without making another visible camera panel.
    Object.assign(this.host.style, { position: 'absolute', width: '2px', height: '2px', overflow: 'hidden', opacity: '0', pointerEvents: 'none', left: '0', top: '0' })
    document.body.appendChild(this.host)
    this.onPageHide = () => this.close()
    window.addEventListener('pagehide', this.onPageHide)
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  notify() { this.listeners.forEach(listener => listener()) }
  play(entry) {
    if (this.closed || entry.closed || entry.error || !entry.video.srcObject) return
    const stream = entry.video.srcObject
    const attempt = entry.playAttempt = (entry.playAttempt || 0) + 1
    const current = () => !this.closed && !entry.closed && !entry.error && entry.video.srcObject === stream && entry.playAttempt === attempt
    const playing = entry.video.play()
    if (playing && playing.catch) {
      playing.then(() => { if (current()) entry.playRetries = 0 }).catch(error => {
        if (!current()) return
        // Track delivery and DOM moves can interrupt a pending play() without
        // breaking WebRTC. Never close a healthy session for that browser abort.
        if (error.name === 'AbortError') {
          if ((entry.playRetries || 0) < 3) {
            entry.playRetries = (entry.playRetries || 0) + 1
            clearTimeout(entry.playRetry)
            entry.playRetry = setTimeout(() => this.play(entry), 100)
          }
        } else this.fail(entry, error)
      })
    }
  }
  valid(entry) { return !!entry && entry.ready && this.entries.get(entry.id) === entry && !entry.error && entry.video.readyState >= 2 && entry.video.videoWidth > 0 && Date.now() - entry.lastFrameAt < 3000 }
  plan(id, steps, index = 0) {
    this.selected = String(id || '')
    const ordered = [this.selected, ...steps.slice(index).concat(steps.slice(0, index)).map(step => step.detection && step.detection.camera_id)].filter(Boolean).map(String)
    this.desired = [...new Set(ordered)].slice(0, this.limit)
    this.schedule()
  }
  schedule() {
    if (this.closed) return
    this.queue = this.queue.catch(() => {}).then(() => this.reconcile())
  }
  async cameras() {
    if (!this.cameraRequest) this.cameraRequest = fetchResource('station', this.stationId).then(({ data }) => data.devices.filter(d => d.type_code === 'camera' && Number(d.status) === 0 && Number(d.model_status) === 0)).catch(error => { this.cameraRequest = null; throw error })
    return this.cameraRequest
  }
  async reconcile() {
    if (this.closed) return
    // Preserve the currently displayed source while a different source warms up.
    const keep = new Set(this.desired)
    if (this.displayed && this.entries.has(this.displayed)) keep.add(this.displayed)
    for (const id of [...this.entries.keys()]) if (!keep.has(id)) await this.drop(id)
    const slots = this.limit - (this.displayed && this.entries.has(this.displayed) && !this.desired.includes(this.displayed) ? 1 : 0)
    for (const id of this.desired.slice(0, slots)) {
      if (this.closed) return
      if (this.entries.has(id)) continue
      if (this.entries.size >= this.limit) {
        const victim = [...this.entries.keys()].reverse().find(key => key !== this.selected && key !== this.displayed)
        if (!victim) break
        await this.drop(victim)
      }
      const entry = { id, video: document.createElement('video'), error: '', lastFrameAt: 0, lastTime: -1, ready: false, session: null, reader: null, closed: false }
      entry.video.autoplay = true; entry.video.muted = true; entry.video.playsInline = true
      entry.video.onloadedmetadata = entry.video.oncanplay = () => this.play(entry)
      this.entries.set(id, entry); this.host.appendChild(entry.video)
      await this.open(entry)
    }
    this.notify()
  }
  async open(entry) {
    const current = () => !this.closed && !entry.closed && this.entries.get(entry.id) === entry
    try {
      const cameras = await this.cameras()
      if (!current()) return
      entry.cameras = cameras
      if (!cameras.some(camera => String(camera.id) === entry.id)) throw new Error('步骤绑定的摄像头不可用')
      const { data } = await fetchCameraCaptureConfig(entry.id)
      if (!current()) return
      const { frame_rates: rates, ...config } = data
      Object.assign(entry, { rates: rates || { refresh_fps: 0, detect_fps: 2 }})
      Object.assign(entry, { client: createCaptureClient() })
      const session = await entry.client.open(config)
      if (!current()) { await entry.client.release(session.session_id).catch(() => {}); return }
      Object.assign(entry, { session })
      const heartbeat = async() => {
        if (!current()) return
        try { const status = await entry.client.heartbeat(session.session_id); if (status.state !== 'ready') throw new Error('摄像头正在重连') } catch (error) { this.fail(entry, error); return }
        if (current()) Object.assign(entry, { heartbeat: setTimeout(heartbeat, 10000) })
      }
      Object.assign(entry, { heartbeat: setTimeout(heartbeat, 10000) })
      const Reader = await loadCaptureReader()
      if (!current()) return
      Object.assign(entry, { reader: new Reader({ url: entry.client.previewURL(session), token: entry.client.token,
        onTrack: event => {
          if (!current()) return
          if (event.track && event.track.kind !== 'video') return
          const stream = event.streams && event.streams[0]
          if (!stream) return
          if (entry.video.srcObject !== stream) entry.video.srcObject = stream
          this.play(entry)
        },
        onError: error => { if (current()) this.fail(entry, error) }
      }) })
      const sample = () => {
        if (!current() || entry.error) return
        if (document.hidden) { entry.wasHidden = true; entry.sample = setTimeout(sample, 1000); return }
        if (entry.wasHidden) { entry.wasHidden = false; entry.ready = false; entry.resumeAt = Date.now() }
        const quality = entry.video.getVideoPlaybackQuality && entry.video.getVideoPlaybackQuality()
        const frame = quality && quality.totalVideoFrames > 0 ? quality.totalVideoFrames : entry.video.currentTime
        if (entry.video.readyState >= 2 && entry.video.videoWidth && frame !== entry.lastTime) {
          entry.lastTime = frame; entry.lastFrameAt = Date.now(); entry.ready = true
          this.notify()
        } else if ((entry.ready && Date.now() - entry.lastFrameAt >= 3000) || (!entry.ready && entry.resumeAt && Date.now() - entry.resumeAt >= 3000)) {
          this.fail(entry, new Error('摄像头画面已停滞，正在重新连接')); return
        }
        entry.sample = setTimeout(sample, 250)
      }
      sample()
      Object.assign(entry, { timeout: setTimeout(() => { if (current() && !entry.ready) this.fail(entry, new Error('等待摄像头首帧超时')) }, 15000) })
    } catch (error) { if (current()) this.fail(entry, error) }
  }
  fail(entry, error) {
    if (this.closed || entry.closed || this.entries.get(entry.id) !== entry || entry.error) return
    entry.error = safeError(error); entry.ready = false
    clearTimeout(entry.heartbeat); clearTimeout(entry.sample); clearTimeout(entry.timeout); clearTimeout(entry.playRetry)
    if (entry.reader) entry.reader.close()
    const release = entry.session && entry.client ? entry.client.release(entry.session.session_id).catch(() => {}) : Promise.resolve()
    entry.session = null
    this.releases = this.releases.then(() => release)
    entry.retry = setTimeout(async() => {
      if (this.closed || entry.closed || !this.desired.includes(entry.id)) return
      // A finite retry budget avoids hammering a shared service when other pages occupy it.
      const count = (this.retries || (this.retries = {}))[entry.id] || 0
      if (count >= 3) return
      this.retries[entry.id] = count + 1
      await this.drop(entry.id); this.schedule()
    }, 5000)
    this.notify()
  }
  async drop(id) {
    const entry = this.entries.get(id)
    if (!entry) return
    this.entries.delete(id); entry.closed = true
    clearTimeout(entry.heartbeat); clearTimeout(entry.sample); clearTimeout(entry.timeout); clearTimeout(entry.retry); clearTimeout(entry.playRetry)
    entry.video.onloadedmetadata = entry.video.oncanplay = null
    if (entry.reader) entry.reader.close()
    entry.video.srcObject = null; entry.video.remove()
    if (entry.session && entry.client) await entry.client.release(entry.session.session_id).catch(() => {})
  }
  async reset(id) {
    if (this.retries) this.retries[id] = 0
    await this.drop(id); this.cameraRequest = null; this.schedule()
  }
  activate(id) {
    const entry = this.entries.get(String(id))
    if (!this.valid(entry)) return null
    if (this.displayed !== String(id)) { this.displayed = String(id); this.schedule() }
    if (this.retries) this.retries[id] = 0
    return entry
  }
  park(entry) {
    if (!entry || entry.closed || this.closed) return
    entry.video.style.cssText = 'width:2px;height:2px;'
    if (entry.video.parentNode !== this.host) { this.host.appendChild(entry.video); this.play(entry) }
  }
  async close() {
    if (this.closed) return
    this.closed = true
    window.removeEventListener('pagehide', this.onPageHide)
    this.listeners.clear()
    await Promise.all([...this.entries.keys()].map(id => this.drop(id)))
    await this.releases
    this.host.remove()
  }
}
