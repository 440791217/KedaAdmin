import { voice } from '@/shared/execution/voice-events'
import { stepImage } from '@/utils/step-image'
import { regionRequirements } from '@/utils/region-requirements'
import AnnotatedImage from '@/shared/sop/components/AnnotatedImage.vue'
import DetectionStatus from '@/shared/execution/components/DetectionStatus.vue'
import ExecutionEvidence from '@/shared/execution/components/ExecutionEvidence.vue'
export default {
  name: 'OperationGuide',
  components: { AnnotatedImage, DetectionStatus, ExecutionEvidence },
  props: {
    steps: { type: Array, default: () => [] }, stepIndex: { type: Number, default: 0 },
    imageContext: { type: Object, default: () => ({}) }, confirmed: { type: Array, default: () => [] },
    executing: Boolean, timingInterrupted: Boolean, timingAdvanceLimit: { type: Number, default: Infinity }, navigationLocked: Boolean, voiceAlertsEnabled: Boolean, executionStatus: { type: Number, default: null }, stationName: { type: String, default: '' },
    liveEnabled: { type: Boolean, default: true }, recordsMode: Boolean, evidenceSteps: { type: Array, default: () => [] },
    detectionStatus: { type: Object, default: () => ({ code: 'idle', text: '待开工' }) }
  },
  data() { return { stepVoiceError: '', timeoutVoiceError: '', clock: performance.now(), timingBase: performance.now(), visualMode: this.recordsMode ? 'evidence' : 'live', imageIndex: 0, expanded: false, stageWidth: 0, stageHeight: 0, imageWidth: 16, imageHeight: 9 } },
  computed: {
    timingSignature() { return JSON.stringify([this.imageContext.executionId, this.evidenceSteps.map(row => [row.position, row.elapsed_ms, row.remaining_ms, row.timing_running])]) },
    step() { return this.steps[this.stepIndex] || null },
    hasLive() { return this.liveEnabled && !!(this.$slots.live || this.$scopedSlots.live) },
    evidence() { return (this.evidenceSteps[this.stepIndex] || {}).evidence || null },
    automaticStep() { return !!(this.step && this.step.detection && this.step.detection.enabled) },
    stepParameters() {
      if (!this.step) return []
      const seconds = Number(this.step.expected_duration_seconds) || 0
      return [{ label: '作业时限', value: seconds > 0 ? seconds + ' 秒' : '不限时' }, { label: '执行方式', value: this.automaticStep ? '自动检测' : '人工确认' }]
    },
    detectionRequirements() {
      const image = stepImage(this.step)
      if (!this.automaticStep || !image || !image.visual) return []
      return (image.visual.detection_regions || []).filter(region => region.enabled !== false).map((region, i) => ({ id: region.id || i, lines: regionRequirements(region) }))
    },
    images() { if (this.step && Object.prototype.hasOwnProperty.call(this.step, 'image')) { const image = stepImage(this.step); return image ? [image] : [] } return this.step && this.step.attachments ? this.step.attachments : [] },
    image() { return this.images[this.imageIndex] || null },
    imageIdentity() { return [this.imageContext.executionId, this.imageContext.taskId, this.step && this.step.id, this.image && this.image.id].join(':') },
    imageStyle() {
      if (!this.stageWidth || !this.stageHeight) return { width: '100%' }
      const width = this.image && this.image.visual ? this.image.visual.image_width : this.imageWidth
      const height = this.image && this.image.visual ? this.image.visual.image_height : this.imageHeight
      return { width: Math.max(1, Math.min(this.stageWidth - 32, (this.stageHeight - 32) * width / height)) + 'px' }
    },
    completedCount() { return this.confirmed.filter(Boolean).length }
  },
  mounted() {
    this._timeoutAttempts = new Set()
    this._stepVoiceAttempts = new Set()
    this._clockTimer = setInterval(() => {
      this.clock = performance.now()
      this.checkStepVoice()
      this.checkTimeoutVoice()
    }, 250)
    this.measure()
    if (typeof ResizeObserver !== 'undefined') { this.stageObserver = new ResizeObserver(this.measure); this.stageObserver.observe(this.$refs.stage) }
    window.addEventListener('resize', this.measure)
  },
  beforeDestroy() { this.stopStepVoice(); this.stopTimeoutVoice(); clearInterval(this._clockTimer); if (this.stageObserver) this.stageObserver.disconnect(); window.removeEventListener('resize', this.measure) },
  watch: { timingSignature() { this.timingBase = this.clock = performance.now() }, recordsMode(value) { this.visualMode = value ? 'evidence' : 'live' }, visualMode() { this.$nextTick(this.measure) }, imageIndex() { this.imageWidth = 16; this.imageHeight = 9 }, stepIndex() { this.imageIndex = 0; this.expanded = false }, steps() { this.imageIndex = 0; this.expanded = false } },
  methods: {
    stepVoiceTarget() {
      if (!this.voiceAlertsEnabled || !this.executing || this.recordsMode || this.executionStatus !== 0 || !this.imageContext.executionId) return null
      const index = this.evidenceSteps.findIndex(row => row.timing_running && !row.confirmed_at)
      const step = this.steps[index]
      if (!step || this.confirmed[index] || step.voice_enabled === false || Number(step.voice_enabled) === 0) return null
      const text = String(step.voice_text || '').trim()
      if (!text) return null
      return {
        key: 'sop-step-voice:' + this.imageContext.executionId + ':' + String(step.id || index + 1),
        text
      }
    },
    stopStepVoice() {
      if (this._stepVoiceHandle) this._stepVoiceHandle.cancel()
      this._stepVoiceHandle = null
      this._stepVoiceKey = null
    },
    checkStepVoice(retry = false) {
      if (this.timeoutTarget()) {
        this.stopStepVoice()
        return
      }
      const target = this.stepVoiceTarget()
      if (!target || this._stepVoiceKey !== target.key) {
        this.stopStepVoice()
        this.stepVoiceError = ''
      }
      if (!target || (!retry && this._stepVoiceAttempts.has(target.key))) return
      this.stopStepVoice()
      this.stepVoiceError = ''
      this._stepVoiceAttempts.add(target.key)
      this._stepVoiceKey = target.key
      this._stepVoiceHandle = voice.announce('step.entered', {
        ...target,
        scopeId: 'execution:' + this.imageContext.executionId,
        retry,
        onError: () => { this.stepVoiceError = '步骤语音未播放，请检查浏览器声音权限' },
        onCancel: started => {
          if (!started) this._stepVoiceAttempts.delete(target.key)
        }
      })
    },
    timeoutTarget() {
      if (!this.voiceAlertsEnabled || !this.executing || this.recordsMode || this.executionStatus !== 0 || !this.imageContext.executionId) return null
      const index = this.evidenceSteps.findIndex(row => row.timing_running && !row.confirmed_at)
      if (index < 0 || this.confirmed[index]) return null
      const step = this.steps[index]
      const row = this.evidenceSteps[index]
      if (!step || step.voice_enabled === false || Number(step.voice_enabled) === 0 || row.elapsed_ms == null) return null
      const seconds = Number(step.expected_duration_seconds) || 0
      if (seconds <= 0 || Number(row.elapsed_ms) + Math.min(this.timingAdvanceLimit, Math.max(0, this.clock - this.timingBase)) < seconds * 1000) return null
      return { key: 'sop-timeout:' + this.imageContext.executionId + ':' + String(step.id || index + 1), text: '步骤“' + (step.title || String(index + 1)) + '”作业时间已到，请注意。' }
    },
    stopTimeoutVoice() {
      if (this._timeoutVoiceHandle) this._timeoutVoiceHandle.cancel()
      this._timeoutVoiceHandle = null
      this._timeoutKey = null
    },
    checkTimeoutVoice(retry = false) {
      const target = this.timeoutTarget()
      if (!target || (this._timeoutKey && this._timeoutKey !== target.key)) {
        this.stopTimeoutVoice()
        this.timeoutVoiceError = ''
      }
      if (!target || (!retry && this._timeoutAttempts.has(target.key))) return
      this.stopTimeoutVoice()
      this.stopStepVoice()
      this.timeoutVoiceError = ''
      this._timeoutAttempts.add(target.key)
      this._timeoutKey = target.key
      this._timeoutVoiceHandle = voice.announce('step.timeout', {
        ...target,
        scopeId: 'execution:' + this.imageContext.executionId,
        retry,
        onError: () => { this.timeoutVoiceError = '到时语音未播放，请检查浏览器声音权限' },
        onCancel: started => {
          if (!started) this._timeoutAttempts.delete(target.key)
        }
      })
    },
    stepTiming(index) {
      const row = this.evidenceSteps[index] || {}
      const format = seconds => { const value = Math.max(0, Math.floor(seconds)); return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0') }
      if (row.elapsed_ms == null) return { text: this.confirmed[index] ? '已完成 · 用时 —' : this.stepState(index), type: this.confirmed[index] ? 'done' : 'pending' }
      const advance = row.timing_running ? Math.min(this.timingAdvanceLimit, Math.max(0, this.clock - this.timingBase)) : 0
      const elapsed = (Number(row.elapsed_ms) + advance) / 1000
      if (this.confirmed[index]) return { text: '已完成 · 用时 ' + format(elapsed), type: 'done' }
      if (this.executionStatus === 3) return { text: '已中止 · 用时 ' + format(elapsed), type: 'over' }
      const limit = Number((this.steps[index] || {}).expected_duration_seconds) || 0
      const remaining = row.remaining_ms == null ? limit - elapsed : (Number(row.remaining_ms) - advance) / 1000
      const text = limit > 0 ? (remaining > 0 ? '剩余 ' + format(Math.ceil(remaining)) : '超时 ' + format(-remaining)) : '用时 ' + format(elapsed)
      if (this.executionStatus === 1) return { text: '已暂停 · ' + text, type: 'paused' }
      if (this.timingInterrupted && !this.recordsMode && this.executionStatus === 0) return { text: '已中断 · ' + text, type: 'paused' }
      return { text, type: limit > 0 && remaining <= 0 ? 'over' : limit > 0 && remaining <= Math.min(5, limit * 0.2) ? 'near' : 'running' }
    },
    measure() { if (this.$refs.stage) { this.stageWidth = this.$refs.stage.clientWidth; this.stageHeight = this.$refs.stage.clientHeight } },
    imageLoaded(size) { this.imageWidth = size.width; this.imageHeight = size.height; this.measure() },
    select(index) { if (!this.navigationLocked && Number.isInteger(index) && index >= 0 && index < this.steps.length) this.$emit('select', index) },
    stepState(index) { return this.confirmed[index] ? '已确认' : index === this.stepIndex ? (this.executing ? '当前步骤' : '正在查看') : (this.executing ? '待操作' : '操作步骤') }
  }
}
