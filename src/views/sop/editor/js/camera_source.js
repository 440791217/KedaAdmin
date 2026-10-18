import { fetchResource, snapshotDevice } from '@/api/resource'
import { readCameraStream } from '@/shared/resource/js/camera_stream'
export default {
  name: 'CameraSource',
  props: { visible: Boolean, stationId: { type: String, required: true }},
  data() {
    return { cameras: [], loading: false, failed: false, sequence: 0, cameraId: '', previewUrl: '', snapshotUrl: '', snapshot: null, capturing: false, uploading: false, connecting: false, streamError: '', controller: null, reconnect: null }
  },
  watch: {
    visible(value) { if (!value) this.cleanup() },
    stationId() { this.cleanup(); if (this.visible) this.load() }
  },
  beforeDestroy() { this.cleanup() },
  methods: {
    stopStream() {
      clearTimeout(this.reconnect)
      this.reconnect = null
      if (this.controller) this.controller.abort()
      this.controller = null
      this.connecting = false
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
      this.previewUrl = ''
    },
    clearSnapshot() {
      if (this.snapshotUrl) URL.revokeObjectURL(this.snapshotUrl)
      this.snapshotUrl = ''
      this.snapshot = null
    },
    cleanup() {
      ++this.sequence
      this.stopStream()
      this.clearSnapshot()
      this.capturing = false
      this.uploading = false
    },
    async load() {
      this.cleanup()
      const seq = this.sequence
      this.loading = true
      this.failed = false
      this.streamError = ''
      this.cameraId = ''
      this.cameras = []
      try {
        const { data } = await fetchResource('station', this.stationId)
        if (seq !== this.sequence) return
        this.cameras = data.devices.filter(d => d.type_code === 'camera' && Number(d.status) === 0 && Number(d.model_status) === 0)
        if (this.cameras.length) { this.cameraId = this.cameras[0].id; this.startStream() }
      } catch (e) {
        if (seq === this.sequence) this.failed = true
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    changeCamera() { ++this.sequence; this.stopStream(); this.clearSnapshot(); this.startStream() },
    async startStream() {
      this.stopStream()
      if (!this.visible || !this.cameraId) return
      const controller = new AbortController()
      this.controller = controller
      this.streamError = ''
      this.connecting = true
      try {
        await readCameraStream(this.cameraId, controller.signal, blob => {
          if (controller !== this.controller) return
          const previous = this.previewUrl
          this.previewUrl = URL.createObjectURL(blob)
          this.connecting = false
          if (previous) URL.revokeObjectURL(previous)
        })
        if (controller === this.controller && this.visible) this.reconnect = setTimeout(() => this.startStream(), 500)
      } catch (e) {
        if (controller === this.controller && !controller.signal.aborted) { this.streamError = e.message || '预览失败，请重试'; this.connecting = false }
      }
    },
    async capture() {
      if (!this.cameraId || this.capturing || this.uploading) return
      const seq = ++this.sequence
      const id = this.cameraId
      this.stopStream()
      this.clearSnapshot()
      this.capturing = true
      this.streamError = ''
      try {
        const blob = await snapshotDevice(id)
        if (seq !== this.sequence || !this.visible) return
        this.snapshot = blob
        this.snapshotUrl = URL.createObjectURL(blob)
      } catch (e) {
        if (seq === this.sequence) this.streamError = '拍照失败，请检查连接后重试'
      } finally {
        if (seq === this.sequence) this.capturing = false
      }
    },
    retake() { this.clearSnapshot(); this.startStream() },
    useSnapshot() {
      if (!this.snapshot || this.uploading) return
      const seq = this.sequence
      this.uploading = true
      this.$emit('capture', {
        file: new File([this.snapshot], `camera-${this.cameraId}-${Date.now()}.jpg`, { type: 'image/jpeg' }),
        onSuccess: () => { if (seq === this.sequence) { this.uploading = false; this.$emit('update:visible', false) } },
        onError: () => { if (seq === this.sequence) this.uploading = false }
      })
    }
  }
}
