import { TaskCameraPool } from '@/utils/task-camera-pool'
import { ExecutionHeartbeat } from '@/utils/execution-heartbeat'
import { voice, announceExecution } from '@/shared/execution/voice-events'
import JobVoiceControl from '@/shared/execution/components/JobVoiceControl.vue'
import { fetchExecution, actExecution, confirmExecutionStep, confirmExecutionEvidence } from '@/api/execution'
import OperationGuide from '@/shared/execution/components/OperationGuide.vue'
import LiveDetection from '@/shared/execution/components/LiveDetection.vue'
export default {
  name: 'ExecutionPanel',
  components: { OperationGuide, LiveDetection, JobVoiceControl },
  props: { regionsVisible: { type: Boolean, default: true }, cameraPool: { type: Object, default: null }, initialExecution: { type: Object, default: null }, executionId: { type: String, required: true }, readonly: Boolean },
  data() { return { clockConnected: false, clockConnecting: false, clockError: '', ownedCameraPool: null, execution: null, loading: false, busy: false, failed: false, autoAttempt: '', autoFailed: false, detectionStatus: null, stepIndex: 0, sequence: 0, reasonOpen: false, pendingAction: '', reason: '', states: ['进行中', '已暂停', '已完成', '已中止'], actions: { start: '开工', confirm: '确认步骤', pause: '暂停', resume: '恢复', complete: '完成', abort: '中止' }} },
  computed: {
    navigationLocked() { return !this.readonly && !!this.execution && this.execution.status < 2 },
    liveCameraPool() { return this.cameraPool || this.ownedCameraPool },
    steps() { return this.execution ? this.execution.content.steps : [] },
    step() { return this.steps[this.stepIndex] },
    automaticStep() { return !!(this.step && this.step.detection && this.step.detection.enabled) },
    liveStatus() {
      if (!this.execution) return { code: 'idle', text: '待检测' }
      if (this.execution.steps[this.stepIndex] && this.execution.steps[this.stepIndex].confirmed_at) return { code: 'ok', text: '本步骤已完成' }
      if (this.execution.status === 1) return { code: 'idle', text: '已暂停' }
      if (this.execution.clock_supported && !this.clockConnected && this.nextPosition) return { code: 'idle', text: this.clockConnecting ? '连接中' : '执行中断' }
      if (this.autoFailed) return { code: 'ng', text: '提交失败' }
      if (this.busy) return { code: 'idle', text: '提交中' }
      const status = this.detectionStatus
      return status && status.executionId === this.executionId && status.stepId === String((this.step && this.step.id) || this.stepIndex + 1) ? status : { code: 'idle', text: '待检测' }
    },
    completedCount() { return this.execution ? this.execution.steps.filter(s => !!s.confirmed_at).length : 0 },
    canComplete() { return this.canOperate && this.execution.status === 0 && this.steps.length > 0 && this.nextPosition === 0 },
    statusType() { return ['', 'warning', 'success', 'info'][this.execution.status] },
    nextPosition() { if (!this.execution) return 0; const s = this.execution.steps.find(s => !s.confirmed_at); return s ? Number(s.position) : 0 },
    canOperate() { return !this.readonly && !this.loading && !this.failed && this.execution && this.execution.can_operate },
    canAbort() { return !this.readonly && this.execution && this.execution.can_abort },
    canConfirm() { return this.canOperate && this.execution.status === 0 && this.stepIndex + 1 === this.nextPosition && (!this.execution.clock_supported || this.clockConnected) }
  },
  watch: { executionId() { this.load() } },
  created() { if (this.initialExecution && String(this.initialExecution.id) === String(this.executionId) && this.initialExecution.content && (this.initialExecution.clock_supported || this.readonly || this.initialExecution.status >= 2)) { this.accept(this.initialExecution); this.$emit('loaded', this.initialExecution) } else this.load() },
  mounted() { this._clockMounted = true; this._pageActive = true; this._clockVisibility = () => { if (document.hidden) this.suspendClock() }; document.addEventListener('visibilitychange', this._clockVisibility); window.addEventListener('pagehide', this.suspendClock); this.syncClock() },
  activated() { this._pageActive = true; if (this._clockMounted) this.syncClock() },
  deactivated() { this._pageActive = false; this.suspendClock() },
  beforeDestroy() {
    if (!this.execution || this.execution.status < 2) {
      voice.cancelScope('execution:' + this.executionId)
    }
    this.stopClock(true)
    document.removeEventListener('visibilitychange', this._clockVisibility)
    window.removeEventListener('pagehide', this.suspendClock)
    if (this.ownedCameraPool) this.ownedCameraPool.close()
    ++this.sequence
  },
  methods: {
    announceAction(action, data) {
      const events = {
        pause: 'execution.paused',
        resume: 'execution.resumed',
        abort: 'execution.aborted',
        complete: 'execution.completed'
      }
      const allConfirmed = data.steps.length > 0 && data.steps.every(row => !!row.confirmed_at)
      const event = action === 'confirm' && allConfirmed ? 'execution.stepsCompleted' : events[action]
      if (!event) return
      announceExecution(event, {
        scopeId: 'execution:' + this.executionId,
        operationId: String(data.version)
      })
    },
    stopClock(release = true) { const heartbeat = this._heartbeat; this._heartbeat = null; if (heartbeat) heartbeat.stop(release); this.clockConnected = false; this.clockConnecting = false },
    suspendClock() { this._clockBlocked = true; this.stopClock(true); if (this.execution && this.execution.clock_supported) this.execution.steps = this.execution.steps.map(row => ({ ...row, timing_running: false })) },
    async resumeClock() { this._clockBlocked = false; this.clockError = ''; await this.load() },
    syncClock() {
      if (!this._clockMounted || this._isBeingDestroyed || this._isDestroyed || !this.execution) return
      if (!this.execution.clock_supported) { if (!this._clockSupportChecked && !this.readonly && this.execution.status === 0) this.load(); return }
      if (this.readonly || !this.execution.can_operate || this.execution.status !== 0 || !this.nextPosition) { this.stopClock(false); return }
      if (this._pageActive === false || document.hidden || this._clockBlocked) return
      if (this._heartbeat && !this._heartbeat.closed && this._heartbeat.id === this.executionId && this._heartbeat.position === this.nextPosition) return
      this.stopClock(false); this.clockConnecting = true
      const heartbeat = new ExecutionHeartbeat(this.executionId, this.nextPosition, data => {
        if (this._heartbeat !== heartbeat || this._isBeingDestroyed) return
        this.execution.steps = this.execution.steps.map(row => Number(row.position) === Number(data.position) ? { ...row, ...data } : row)
        this.clockConnected = true; this.clockError = ''
      }, error => {
        if (this._heartbeat !== heartbeat || this._isBeingDestroyed) return
        this._clockBlocked = true; this.clockConnected = false; this.clockError = error.message || '执行心跳已中断'
        this.execution.steps = this.execution.steps.map(row => ({ ...row, timing_running: false }))
      })
      this._heartbeat = heartbeat
      heartbeat.start().catch(() => {}).finally(() => { if (this._heartbeat === heartbeat) this.clockConnecting = false })
    },
    selectStep(index) { if (!this.navigationLocked && !this.busy && Number.isInteger(index) && index >= 0 && index < this.steps.length) this.stepIndex = index },
    async load() {
      this._clockSupportChecked = true
      const seq = ++this.sequence; this.loading = true; this.failed = false; this.autoAttempt = ''; this.autoFailed = false; this.detectionStatus = null
      if (this.execution && String(this.execution.id) !== String(this.executionId)) { this.stopClock(true); this._clockBlocked = false; this.execution = null }
      try { const { data } = await fetchExecution(this.executionId); if (seq === this.sequence) { this.accept(data); this.$emit('loaded', data) } } catch (e) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    accept(data) {
      if (!this.readonly && !this.cameraPool && data.status < 2 && (!this.ownedCameraPool || this.ownedCameraPool.stationId !== String(data.station_id))) { if (this.ownedCameraPool) this.ownedCameraPool.close(); this.ownedCameraPool = new TaskCameraPool(data.station_id) }
      if (data.status >= 2 && this.ownedCameraPool) { this.ownedCameraPool.close(); this.ownedCameraPool = null }
      this.execution = data; const pending = data.steps.findIndex(s => !s.confirmed_at); this.stepIndex = pending < 0 ? Math.max(0, data.content.steps.length - 1) : pending; this.$nextTick(() => this.syncClock())
    },
    time(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' },
    async autoConfirm(event) {
      if (!this.canConfirm || !this.automaticStep || this.busy || this.reasonOpen || this.autoFailed || event.executionId !== this.executionId || event.stepId !== String((this.step && this.step.id) || this.stepIndex + 1)) return
      const key = [this.executionId, this.execution.version, event.stepId].join(':')
      if (this.autoAttempt === key) return
      this.autoAttempt = key
      const success = await this.submit('confirm', undefined, event.photo)
      if (this.autoAttempt === key) this.autoFailed = !success
    },
    async action(action) {
      if ((!this.canOperate && !(action === 'abort' && this.canAbort)) || this.busy) return
      if (action === 'pause' || action === 'abort') { this.pendingAction = action; this.reason = ''; this.reasonOpen = true; return }
      if (action === 'complete') { try { await this.$confirm('确认本次产品作业已全部完成？', '完成作业', { type: 'warning' }) } catch (e) { return } }
      await this.submit(action)
    },
    async submitReason() { if (!this.reason.trim()) return this.$message.warning('请填写原因'); await this.submit(this.pendingAction, this.reason.trim()) },
    async submit(action, reason, photo) {
      if ((!this.canOperate && !(action === 'abort' && this.canAbort)) || this.busy) return
      if (action === 'confirm' && !this.canConfirm) return
      const seq = this.sequence; const id = this.executionId
      const position = this.stepIndex + 1; const stepId = this.step && this.step.id
      this.busy = true
      try {
        if (this.execution.clock_supported && this._heartbeat && this.clockConnected && this.execution.status === 0) await this._heartbeat.flush()
        const clockSessionId = this._heartbeat && this.clockConnected ? this._heartbeat.session : undefined
        if (action === 'confirm' && this.execution.clock_supported && !clockSessionId) throw new Error('执行已中断，请继续作业后重新检测')
        const payload = { version: this.execution.version, reason, ...(clockSessionId ? { clock_session_id: clockSessionId } : {}) }
        const withCamera = action === 'confirm' && this.step && this.step.detection && this.step.detection.camera_id
        if (withCamera && !photo) {
          if (this.automaticStep) throw new Error('缺少通过检测的现场照片，请刷新状态重新检测')
          if (!this.$refs.live) throw new Error('无法获取摄像头画面，请返回实时画面后重试')
          photo = await this.$refs.live.captureEvidence()
        }
        if (seq !== this.sequence || action === 'confirm' && (position !== this.stepIndex + 1 || stepId !== (this.step && this.step.id))) return
        const { data } = withCamera ? await confirmExecutionEvidence(id, position, photo, this.execution.version, clockSessionId) : action === 'confirm' ? await confirmExecutionStep(id, position, payload) : await actExecution(id, action, payload)
        if (seq !== this.sequence) return
        if (action === 'resume') { this._clockBlocked = false; this.autoFailed = false; this.autoAttempt = '' }
        this.announceAction(action, data)
        this.accept(data); this.reasonOpen = false; this.$emit('changed', data)
        this.$message.success(action === 'confirm' ? '步骤已确认' : '作业状态已更新')
        return true
      } catch (e) { if (seq === this.sequence) { if (e.code === 409) this.$message.warning('作业状态已变化，请点击刷新确认最新结果后再操作'); else if (action === 'confirm') this.$message.warning(e.message || '现场照片保存失败，请刷新状态重试') } } finally { this.busy = false }
    }
  }
}
