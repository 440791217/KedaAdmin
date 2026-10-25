import { startPreviewFrames } from '@/utils/preview-frames'
import { stepImage } from '@/utils/step-image'
import cameraSource from '@/views/sop/editor/js/camera_source'
import { createDetectionClient } from '@/utils/detection-service'
import LiveGuidanceOverlay from '@/shared/execution/components/LiveGuidanceOverlay.vue'
import DetectionStatus from '@/shared/execution/components/DetectionStatus.vue'
import { evaluateRegions, relevantDetections, drawDetectionBoxes } from '@/shared/execution/js/live_regions'

export default {
  name: 'LiveDetection',
  mixins: [cameraSource],
  components: { LiveGuidanceOverlay, DetectionStatus },
  props: { regionsVisible: { type: Boolean, default: true }, cameraPool: { type: Object, default: null }, cameraSteps: { type: Array, default: () => [] }, cameraStepIndex: { type: Number, default: 0 }, visible: { type: Boolean, default: true }, previewActive: { type: Boolean, default: true }, executionId: { type: String, default: '' }, stepId: { type: String, required: true }, step: { type: Object, default: null }, running: Boolean, stepConfirmed: Boolean, embedded: Boolean },
  data() { return { showRegions: this.regionsVisible, models: [], modelId: '', detectionError: '', detecting: false, result: null, videoWidth: 16, videoHeight: 9 } },
  computed: {
    measuredDetectionText() {
      if (!this.executionId) return '检测未启动'
      if (this.stepConfirmed) return '检测已完成'
      if (!this.running) return '检测已暂停'
      if (!this.detectionConfigured) return '检测未启用'
      if (this.detectionError) return '检测异常'
      return '检测 ' + (this.measuredDetectionFps == null ? '统计中' : this.measuredDetectionFps.toFixed(1) + ' FPS')
    },
    detectionConfig() { return this.step && this.step.detection },
    boundCameraId() { return this.detectionConfig && this.detectionConfig.camera_id ? String(this.detectionConfig.camera_id) : '' },
    baselineAttachment() { const image = stepImage(this.step); return image && String(image.id) === String((this.detectionConfig || {}).attachment_id) ? image : null },
    activeVisual() { return this.baselineAttachment ? this.baselineAttachment.visual : null },
    detectionConfigured() { return !!(this.detectionConfig && this.detectionConfig.enabled && this.detectionConfig.confirmed && this.boundCameraId && this.activeVisual && (this.activeVisual.detection_regions || []).some(r => r.enabled !== false)) },
    regionStates() { return evaluateRegions(this.activeVisual, this.result) },
    visibleDetections() { return relevantDetections(this.regionStates, this.result) },
    detectionPassed() { return !!(this.executionId && this.running && this.result && !this.detectionError && this.regionStates.length && this.regionStates.every(state => state.matched)) },
    verdict() {
      if (!this.executionId) return { code: 'idle', text: '待开工' }
      if (this.stepConfirmed) return { code: 'ok', text: '本步骤已完成' }
      if (!this.running) return { code: 'idle', text: '检测已停止' }
      if (!this.detectionConfig || !this.detectionConfig.enabled) return { code: 'idle', text: '未启用检测' }
      if (!this.detectionConfigured) return { code: 'ng', text: '检测未配置完整' }
      if (this.detectionPassed) return { code: 'ok', text: '全部满足' }
      return { code: 'ng', text: this.connectionNotice ? '检测不可用' : '已满足 ' + this.regionStates.filter(state => state.matched).length + '/' + this.regionStates.length }
    },
    connectionNotice() { return this.failed ? '工位摄像头加载失败，请重新连接' : this.streamError || this.detectionError || (!this.loading && !this.cameras.length ? '当前工位没有可用摄像头' : '') },
    recognitionStatus() {
      if (!this.detectionConfig) return { type: 'warning', icon: 'el-icon-warning-outline', title: '步骤尚未配置视觉检测', detail: '请在任务草稿中指定摄像头和检测基准图后发布' }
      if (!this.detectionConfig.enabled) return { type: 'info', icon: 'el-icon-info', title: '本步骤未启用视觉检测', detail: '请按操作说明完成并确认本步骤' }
      if (!this.detectionConfigured) return { type: 'warning', icon: 'el-icon-warning-outline', title: '步骤检测配置待确认', detail: '请检查摄像头、基准图及参与检测的区域' }
      if (this.failed || this.streamError || this.detectionError) return { type: 'warning', icon: 'el-icon-warning-outline', title: '识别暂不可用', detail: '请检查连接后点击“重新连接”' }
      if (this.loading || this.connecting) return { type: 'info', icon: 'el-icon-loading', title: '正在连接摄像头', detail: '画面就绪后可继续操作' }
      if (!this.cameraId) return { type: 'warning', icon: 'el-icon-video-camera', title: '等待摄像头', detail: '请选择可用摄像头' }
      if (!this.executionId) return { type: 'info', icon: 'el-icon-time', title: '等待扫码开工', detail: '当前仅实时预览，输入产品码并点击“扫码开工”后开始识别' }
      if (this.stepConfirmed) return { type: 'success', icon: 'el-icon-check', title: '本步骤已完成', detail: '该步骤结果已保存' }
      if (!this.running) return { type: 'info', icon: 'el-icon-video-pause', title: '识别已暂停', detail: '作业进行中且选中当前待确认步骤时恢复识别' }
      if (!this.modelId) return { type: 'warning', icon: 'el-icon-time', title: '等待检测模型', detail: '请选择已就绪的检测模型' }
      if (this.regionStates.length) {
        const pending = this.regionStates.filter(state => !state.matched)
        return { type: pending.length ? 'warning' : 'success', icon: pending.length ? 'el-icon-search' : 'el-icon-check', title: pending.length ? '等待步骤目标满足条件' : '当前画面条件满足', detail: pending.length ? pending.map(state => state.message).join('；') : '本步骤全部检测条件满足，自动提交步骤结果' }
      }
      if (this.result) {
        return this.result.detections.length
          ? { type: 'success', icon: 'el-icon-view', title: '已识别 ' + this.result.detections.length + ' 个目标', detail: '持续识别中，检测框显示在画面上' }
          : { type: 'info', icon: 'el-icon-search', title: '等待目标出现', detail: '最近一帧未检测到目标，正在持续识别' }
      }
      if (this.detecting) return { type: 'info', icon: 'el-icon-loading', title: '正在识别', detail: '已发送画面，等待检测结果' }
      return { type: 'info', icon: 'el-icon-time', title: '等待识别', detail: '正在等待可用的摄像头画面' }
    }
  },
  watch: {
    regionsVisible(value) { this.showRegions = value },
    showRegions(value) { this.$emit('update:regionsVisible', value) },
    verdict: { immediate: true, handler(status) { this.$emit('status-change', { ...status, stepId: this.stepId, executionId: this.executionId }) } },
    running() { this.restartDetection() },
    previewActive(value) {
      this.restartDetection()
      if (this.cameraPool && this._poolEntry) {
        if (!value) {
          this.stopFrameMeasurement()
          if (this._stopPreviewFrames) this._stopPreviewFrames()
          this._stopPreviewFrames = null
          if (this.cameraPool.park) this.cameraPool.park(this._poolEntry)
        } else { this._readyStreamGeneration = null; this.selectPooled() }
      }
    },
    executionId() { this.restartDetection() },
    stepId() { this.detectionError = ''; this.restartDetection(); if (this.cameraPool) this.selectPooled() },
    boundCameraId() { if (this.cameraPool) this.selectPooled(); else this.reconnect() },
    cameraSteps() { if (this.cameraPool) this.selectPooled() },
    cameraStepIndex() { if (this.cameraPool) this.selectPooled() },
    detectionConfigured() { this.restartDetection() },
    activeVisual() { this.restartDetection() },
    cameraId() { this.stopDetection() },
    connected(value) { if (!value) this.stopDetection() },
    modelId() { this.restartDetection() },
    streamError(value) { if (value) this.stopDetection() }
  },
  mounted() {
    this._visibility = () => { if (document.hidden) this.stopDetection(); else this.restartDetection() }
    document.addEventListener('visibilitychange', this._visibility)
    this._stopOnHide = () => this.stopDetection()
    window.addEventListener('pagehide', this._stopOnHide)
    this._redraw = () => { if (this.result && this.$refs.video) this.drawResult(this.result, this.$refs.video) }
    window.addEventListener('resize', this._redraw)
    this.reconnect(false)
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this._visibility)
    window.removeEventListener('pagehide', this._stopOnHide)
    window.removeEventListener('resize', this._redraw)
    if (this._modelRequest) this._modelRequest.abort()
    this._modelRequest = null
    this.stopDetection()
  },
  methods: {
    sourceVideo() { return this.cameraPool && this._poolEntry ? this._poolEntry.video : this.$refs.video },
    stopStream() {
      this.stopFrameMeasurement()
      if (!this.cameraPool) return cameraSource.methods.stopStream.call(this)
      if (this._poolUnsubscribe) this._poolUnsubscribe()
      this._poolUnsubscribe = null
      if (this._stopPreviewFrames) this._stopPreviewFrames()
      if (this._poolEntry && this.$refs.poolVideoHost && this._poolEntry.video.parentNode === this.$refs.poolVideoHost && this.cameraPool.park) this.cameraPool.park(this._poolEntry)
      this._stopPreviewFrames = null; this._poolEntry = null; this._active = null
      this._streamGeneration = (this._streamGeneration || 0) + 1
      this.connecting = false; this.connected = false
    },
    load() { if (this.cameraPool) return this.selectPooled(); return cameraSource.methods.load.call(this) },
    selectPooled(force = false) {
      const pool = this.cameraPool
      if (!pool || this._isDestroyed || this._isBeingDestroyed) return
      const id = this.boundCameraId
      if (!id) {
        this.stopStream(); this.stopDetection(); this.cameraId = ''
        pool.displayed = ''; pool.plan('', this.cameraSteps, this.cameraStepIndex)
        const canvas = this.$refs.previewCanvas
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        return
      }
      const changed = this.cameraId !== id || force
      if (changed) {
        this.stopFrameMeasurement()
        this.stopDetection(); this.cameraId = id; this._active = null; this._readyStreamGeneration = null
        this._streamGeneration = (this._streamGeneration || 0) + 1
      }
      const update = () => {
        if (this.cameraPool !== pool || this.boundCameraId !== id || this._isDestroyed || this._isBeingDestroyed) return
        const entry = pool.entries.get(id)
        this.loading = false; this.failed = false
        this.streamError = entry && entry.error ? entry.error : ''
        const ready = pool.valid(entry)
        this.connecting = !ready && !this.streamError
        this.connected = ready
        if (!ready) {
          this.stopFrameMeasurement()
          this._active = null
          return
        }
        this.cameras = entry.cameras; this.frameRates = entry.rates
        pool.activate(id)
        if (this._poolEntry === entry && this._active && this._readyStreamGeneration === this._streamGeneration) {
          if (this.running && this.previewActive && !document.hidden && !this.detecting && !this._detectionTimer && !this._predictionRequest) this.restartDetection()
          return
        }
        this.stopDetection()
        this._poolEntry = entry; this._active = { client: entry.client, session: entry.session }
        this._readyStreamGeneration = this._streamGeneration
        this.videoWidth = entry.video.videoWidth; this.videoHeight = entry.video.videoHeight
        this.$nextTick(() => {
          if (this._poolEntry !== entry || this.boundCameraId !== id || !pool.valid(entry) || this._isBeingDestroyed) return
          if (this._stopPreviewFrames) this._stopPreviewFrames()
          this._stopPreviewFrames = null
          if (!this.previewActive) { if (pool.park) pool.park(entry); return }
          this.startFrameMeasurement(entry.video, !!this.frameRates.refresh_fps)
          const host = this.$refs.poolVideoHost
          if (host) [...host.children].forEach(video => { const previous = [...pool.entries.values()].find(item => item.video === video); if (previous && pool.park) pool.park(previous) })
          if (!this.frameRates.refresh_fps && host) {
            entry.video.style.cssText = 'display:block;position:absolute;width:100%;height:100%;object-fit:contain;'
            host.appendChild(entry.video)
            if (pool.play) pool.play(entry)
          } else {
            if (pool.park) pool.park(entry)
            this._stopPreviewFrames = startPreviewFrames(entry.video, this.$refs.previewCanvas, this.frameRates.refresh_fps, true, this.recordPaintedFrame)
          }
          this.restartDetection()
        })
      }
      if (this._poolUnsubscribe) this._poolUnsubscribe()
      this._poolUnsubscribe = pool.subscribe(update)
      if (force) pool.reset(id).then(() => { if (!this._isBeingDestroyed && this.boundCameraId === id) pool.plan(id, this.cameraSteps, this.cameraStepIndex) })
      else pool.plan(id, this.cameraSteps, this.cameraStepIndex)
      update()
    },
    evidenceKey() { return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'evidence_' + Date.now() + '_' + Math.random().toString(36).slice(2) },
    async captureEvidence() {
      const video = this.sourceVideo()
      if (!this._active || (this.cameraPool && !this.cameraPool.valid(this._poolEntry)) || !video || video.readyState < 2 || !video.videoWidth || this.connecting || this.streamError) throw new Error('摄像头画面尚未就绪，无法保存现场照片')
      const frame = document.createElement('canvas'); const scale = Math.min(1, 960 / video.videoWidth, 960 / video.videoHeight)
      frame.width = Math.round(video.videoWidth * scale); frame.height = Math.round(video.videoHeight * scale)
      frame.getContext('2d').drawImage(video, 0, 0, frame.width, frame.height)
      const context = [this.executionId, this.stepId, this.cameraId, this._streamGeneration].join(':')
      const file = await new Promise(resolve => frame.toBlob(resolve, 'image/jpeg', 0.8))
      if (context !== [this.executionId, this.stepId, this.cameraId, this._streamGeneration].join(':') || (this.cameraPool && !this.cameraPool.valid(this._poolEntry))) throw new Error('步骤或摄像头已变化，请重新确认')
      if (!file) throw new Error('现场照片截取失败，请重试')
      return { file, metadata: { request_key: this.evidenceKey(), camera_id: this.cameraId, image_width: frame.width, image_height: frame.height, captured_at: new Date().toISOString(), automatic: false, detections: [] }}
    },
    preferredCamera() { return this.boundCameraId },
    videoReady() {
      const video = this.sourceVideo()
      if (!this._active || this.connecting) return
      this._readyStreamGeneration = this._streamGeneration
      if (video && video.videoWidth) { this.videoWidth = video.videoWidth; this.videoHeight = video.videoHeight }
      this.restartDetection()
    },
    async reconnect(force = true) {
      this.stopDetection(); this.detectionError = ''
      this._readyStreamGeneration = null
      if (this.cameraPool) this.selectPooled(force)
      else if (this.boundCameraId) this.load(); else { this.cleanup(); this.cameraId = ''; this.cameras = [] }
      if (this._modelRequest) this._modelRequest.abort()
      const controller = new AbortController(); this._modelRequest = controller
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const data = await createDetectionClient().models(controller.signal)
        if (this._modelRequest !== controller || this._isBeingDestroyed || this._isDestroyed) return
        this.models = data.models.filter(model => model.status === 'ready')
        this.modelId = this.models.some(model => model.id === this.modelId) ? this.modelId : (this.models[0] || {}).id || ''
        if (!this.modelId) this.detectionError = '检测服务没有就绪模型'
        this.restartDetection()
      } catch (error) {
        if (this._modelRequest === controller && !this._isBeingDestroyed && !this._isDestroyed) this.detectionError = error.name === 'AbortError' ? '检测服务连接超时' : error.message
      } finally { clearTimeout(timeout) }
    },
    stopDetection() {
      this.resetDetectionRate()
      this._detectionGeneration = (this._detectionGeneration || 0) + 1
      clearTimeout(this._detectionTimer)
      this._detectionTimer = null
      if (this._predictionRequest) this._predictionRequest.abort()
      this._predictionRequest = null; this.detecting = false; this.result = null
      const canvas = this.$refs.overlay
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    },
    restartDetection() {
      this.stopDetection()
      if (!this.detectionConfigured || !this.running || !this.previewActive || !this.modelId || document.hidden || !this._active || this.cameraId !== this.boundCameraId || this.streamError || this._readyStreamGeneration !== this._streamGeneration) return
      const generation = this._detectionGeneration
      const stream = this._streamGeneration
      const context = { stepId: this.stepId, executionId: this.executionId, cameraId: this.boundCameraId, visual: this.activeVisual }
      const current = () => generation === this._detectionGeneration && stream === this._streamGeneration && this.running && this.previewActive && !document.hidden && (!this.cameraPool || this.cameraPool.valid(this._poolEntry)) && this.stepId === context.stepId && this.executionId === context.executionId && this.boundCameraId === context.cameraId && this.activeVisual === context.visual && !this._isDestroyed && !this._isBeingDestroyed
      let lastFrame
      const tick = async() => {
        if (!current()) return
        const video = this.sourceVideo()
        if (!video || video.readyState < 2 || !video.videoWidth) { this._detectionTimer = setTimeout(tick, 500); return }
        const quality = video.getVideoPlaybackQuality && video.getVideoPlaybackQuality()
        const frameKey = quality && quality.totalVideoFrames > 0 ? quality.totalVideoFrames : video.currentTime
        if (frameKey === lastFrame) { this._detectionTimer = setTimeout(tick, 1000 / this.frameRates.detect_fps); return }
        lastFrame = frameKey
        const tickStarted = performance.now()
        const controller = new AbortController(); this._predictionRequest = controller
        const timeout = setTimeout(() => controller.abort(), 15000)
        this.detecting = true
        try {
          const frame = document.createElement('canvas')
          const capturedAt = new Date().toISOString()
          const scale = Math.min(1, 960 / video.videoWidth, 960 / video.videoHeight)
          frame.width = Math.round(video.videoWidth * scale); frame.height = Math.round(video.videoHeight * scale)
          frame.getContext('2d').drawImage(video, 0, 0, frame.width, frame.height)
          const blob = await new Promise(resolve => frame.toBlob(resolve, 'image/jpeg', 0.8))
          if (!current()) return
          if (!blob) throw new Error('摄像头截帧失败')
          const metadata = { model_id: this.modelId, frame_id: String(Date.now()) + '-' + generation, station_id: this.stationId, execution_id: this.executionId, step_id: this.stepId }
          const result = await createDetectionClient().predict(blob, metadata, controller.signal)
          if (!current()) return
          if (!result.context || Object.keys(metadata).some(key => result.context[key] !== metadata[key]) || result.image_width !== frame.width || result.image_height !== frame.height || !Array.isArray(result.detections)) throw new Error('检测结果与当前画面不匹配')
          this.recordDetectionFrame()
          this.result = result; this.detectionError = ''; this.drawResult(result, video)
          const states = evaluateRegions(this.activeVisual, result)
          if (this.executionId && this.running && states.length && states.every(state => state.matched)) this.$emit('satisfied', { executionId: this.executionId, stepId: this.stepId, photo: { file: blob, metadata: { request_key: this.evidenceKey(), camera_id: this.cameraId, model_id: metadata.model_id, frame_id: metadata.frame_id, captured_at: capturedAt, image_width: frame.width, image_height: frame.height, automatic: true, detections: result.detections }}})
        } catch (error) {
          if (current()) { this.result = null; this.drawResult(null, video); this.detectionError = error.name === 'AbortError' ? '检测请求超时，正在重试' : error.message }
        } finally {
          clearTimeout(timeout)
          if (current()) { this.detecting = false; this._predictionRequest = null; this._detectionTimer = setTimeout(tick, this.detectionError ? 2000 : Math.max(0, 1000 / this.frameRates.detect_fps - (performance.now() - tickStarted))) }
        }
      }
      tick()
    },
    drawResult(result, video) {
      const canvas = this.$refs.overlay
      if (!canvas) return
      canvas.width = this.$refs.video.clientWidth || video.videoWidth; canvas.height = this.$refs.video.clientHeight || video.videoHeight
      drawDetectionBoxes(canvas, result, this.activeVisual)
    }
  }
}
