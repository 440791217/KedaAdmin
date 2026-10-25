import { fetchResource, fetchCameraCaptureConfig } from '@/api/resource'
import { createCaptureClient, loadCaptureReader } from '@/utils/capture-session'
import { startPreviewFrames } from '@/utils/preview-frames'
import frameStatistics from '@/shared/execution/js/frame_statistics'
export default {
  name: 'CameraSource',
  mixins: [frameStatistics],
  props: { visible: Boolean, stationId: { type: String, required: true }, preferredCameraId: { type: String, default: '' }, replacing: Boolean },
  data() {
    return { frameRates: { refresh_fps: 0, detect_fps: 2 }, cameras: [], loading: false, failed: false, sequence: 0, cameraId: '', snapshotUrl: '', snapshot: null, capturing: false, uploading: false, connecting: false, connected: false, streamError: '' }
  },
  watch: {
    visible(value) { if (!value) this.cleanup() },
    stationId() { this.cleanup(); if (this.visible) this.load() }
  },
  created() { this._pageHide = () => this.cleanup(); window.addEventListener('pagehide', this._pageHide) },
  beforeDestroy() { window.removeEventListener('pagehide', this._pageHide); this.cleanup() },
  methods: {
    preferredCamera() { return this.preferredCameraId },
    stopStream() {
      this.stopFrameMeasurement()
      if (this._stopPreviewFrames) this._stopPreviewFrames()
      this._stopPreviewFrames = null
      this._streamGeneration = (this._streamGeneration || 0) + 1
      clearTimeout(this._heartbeat); this._heartbeat = null
      if (this._reader) this._reader.close()
      this._reader = null
      if (this.$refs.video) this.$refs.video.srcObject = null
      const active = this._active
      this._active = null
      this.connecting = false; this.connected = false
      if (active) active.client.release(active.session.session_id).catch(() => {})
    },
    clearSnapshot() {
      if (this.snapshotUrl) URL.revokeObjectURL(this.snapshotUrl)
      this.snapshotUrl = ''; this.snapshot = null
    },
    cleanup() {
      ++this.sequence
      this.stopStream(); this.clearSnapshot()
      this.loading = false; this.capturing = false; this.uploading = false
    },
    async load() {
      this.cleanup()
      const seq = this.sequence
      this.loading = true; this.failed = false; this.streamError = ''; this.cameraId = ''; this.cameras = []
      try {
        const { data } = await fetchResource('station', this.stationId)
        if (seq !== this.sequence) return
        this.cameras = data.devices.filter(d => d.type_code === 'camera' && Number(d.status) === 0 && Number(d.model_status) === 0)
        const preferred = this.preferredCamera()
        const selected = preferred ? this.cameras.find(camera => String(camera.id) === preferred) : this.cameras[0]
        if (selected) { this.cameraId = String(selected.id); this.startStream() } else if (preferred) this.streamError = '步骤绑定的摄像头不可用，请检查步骤配置'
      } catch (error) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    changeCamera() { ++this.sequence; this.stopStream(); this.clearSnapshot(); this.startStream() },
    async startStream() {
      this.stopStream()
      if (!this.visible || !this.cameraId) return
      const generation = this._streamGeneration
      const current = () => generation === this._streamGeneration && this.visible
      this.streamError = ''; this.connecting = true
      try {
        const client = createCaptureClient()
        const { data: config } = await fetchCameraCaptureConfig(this.cameraId)
        if (!current()) return
        const { frame_rates: rates, ...captureConfig } = config
        this.frameRates = rates || { refresh_fps: 0, detect_fps: 2 }
        const session = await client.open(captureConfig)
        if (!current()) { client.release(session.session_id).catch(() => {}); return }
        const active = { client, session }
        this._active = active; this.connected = true
        const heartbeat = async() => {
          if (this._active !== active) return
          try {
            const state = await client.heartbeat(session.session_id)
            if (this._active === active && state.state !== 'ready') this.streamError = '摄像头正在重连，请稍后重试'
          } catch (error) {
            if (this._active === active) { this.stopStream(); this.streamError = error.message }
          } finally { if (this._active === active) this._heartbeat = setTimeout(heartbeat, 10000) }
        }
        this._heartbeat = setTimeout(heartbeat, 10000)
        if (!window.RTCPeerConnection) {
          this.connecting = false; this.streamError = '当前浏览器无法建立视频预览，仍可拍照获取画面'
          return
        }
        const Reader = await loadCaptureReader()
        if (!current()) return
        await this.$nextTick()
        if (!current()) return
        this._reader = new Reader({
          url: client.previewURL(session), token: client.token,
          onTrack: event => {
            if (!current()) return
            const video = this.$refs.video
            if (video) {
              video.srcObject = event.streams[0]
              if (this._stopPreviewFrames) this._stopPreviewFrames()
              this.startFrameMeasurement(video, !!this.frameRates.refresh_fps)
              this._stopPreviewFrames = startPreviewFrames(video, this.$refs.previewCanvas, this.frameRates.refresh_fps, false, this.recordPaintedFrame)
              const playing = video.play()
              if (playing && playing.catch) playing.catch(() => {})
            }
            this.connecting = false; this.streamError = ''
          },
          onError: error => {
            if (current()) {
              this.connecting = false
              const detail = String(error).replace(/(?:https?|rtsps?):\/\/\S+/gi, '[地址]').slice(0, 400)
              this.streamError = '视频预览失败：' + detail + '。仍可尝试拍照。'
            }
          }
        })
      } catch (error) {
        if (current()) { this.connecting = false; this.streamError = error.message || '摄像头连接失败，请重试' }
      }
    },
    async capture() {
      if (!this._active || this.capturing || this.uploading) return
      const seq = this.sequence; const active = this._active
      this.clearSnapshot(); this.capturing = true; this.streamError = ''
      try {
        const blob = await active.client.snapshot(active.session.session_id)
        if (seq !== this.sequence || !this.visible || active !== this._active) return
        if (!(blob instanceof Blob) || blob.type !== 'image/jpeg') throw new Error('采集服务未返回有效照片，请重试')
        this.snapshot = blob; this.snapshotUrl = URL.createObjectURL(blob)
        this.stopStream()
      } catch (error) { if (seq === this.sequence) this.streamError = error.message || '拍照失败，请检查连接后重试' } finally { if (seq === this.sequence) this.capturing = false }
    },
    retake() { this.clearSnapshot(); this.startStream() },
    async useSnapshot() {
      if (!this.snapshot || this.uploading) return
      if (this.replacing) {
        try { await this.$confirm('使用这张照片将替换当前草稿的图片及其标注，已发布版本不受影响。', '替换检测图片') } catch (e) { return }
        if (!this.snapshot || this.uploading || !this.visible) return
      }
      const seq = this.sequence
      this.uploading = true
      this.$emit('capture', {
        cameraId: this.cameraId,
        file: new File([this.snapshot], `camera-${this.cameraId}-${Date.now()}.jpg`, { type: 'image/jpeg' }),
        onSuccess: () => { if (seq === this.sequence) { this.uploading = false; this.$emit('update:visible', false) } },
        onError: () => { if (seq === this.sequence) this.uploading = false }
      })
    }
  }
}
