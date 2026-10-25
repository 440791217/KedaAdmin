import { TaskCameraPool } from '@/utils/task-camera-pool'
import { voice, announceExecution } from '@/shared/execution/voice-events'
import JobVoiceControl from '@/shared/execution/components/JobVoiceControl.vue'
import { fetchExecution, fetchExecutions, startExecution } from '@/api/execution'
import ExecutionPanel from '@/shared/execution/components/ExecutionPanel.vue'
import { fetchResources, fetchResource, fetchStationTasks, previewTask } from '@/api/resource'
import OperationGuide from '@/shared/execution/components/OperationGuide.vue'
import LiveDetection from '@/shared/execution/components/LiveDetection.vue'
export default {
  name: 'OnsiteWorkbench',
  components: { OperationGuide, ExecutionPanel, LiveDetection, JobVoiceControl },
  data() {
    return { regionsVisible: true, cameraPool: null, focused: false, canStart: false, executionId: '', activeExecution: null, productCode: '', startKey: '', starting: false, executionFailed: false, stations: [], stationId: '', station: null, items: [], keyword: '', task: null, revision: null, stepIndex: 0, loading: false, failed: '', stationFailed: false, sequence: 0, searchSequence: 0 }
  },
  computed: {
    activeEntryLabel() { return this.executionEntryLabel(this.activeExecution) },
    readyToStart() { return !!this.task && this.task.onsite_available === true },
    filteredTasks() { const q = this.keyword.trim().toLowerCase(); return this.items.filter(t => [t.name, t.code, t.project_name, t.subproject_name].join(' ').toLowerCase().includes(q)) },
    step() { return this.revision && this.revision.steps[this.stepIndex] },
    imageKey() { return [this.task && this.task.id, this.revision && this.revision.id, this.stepIndex].join(':') }
  },
  created() {
    window.addEventListener('keydown', this.exitFocus)
    this.searchStations('')
    if (this.$route && this.$route.query.station) { this.stationId = this.$route.query.station; this.selectStation() }
  },
  watch: { executionId(id) { if (id && !this.cameraPool && this.stationId) this.cameraPool = new TaskCameraPool(this.stationId) } },
  beforeDestroy() {
    if (this._voiceScope) voice.cancelScope(this._voiceScope)
    if (this.cameraPool) this.cameraPool.close()
    ++this.sequence
    ++this.searchSequence
    window.removeEventListener('keydown', this.exitFocus)
  },
  methods: {
    executionEntryLabel(execution) {
      if (!execution) return '查看作业'
      const userId = this.$store && this.$store.getters.user_id
      const operate = execution.can_operate === true || (execution.can_operate == null && this.canStart && userId && String(execution.operator_id) === String(userId))
      if (!operate) return '查看作业'
      return Number(execution.status) === 1 ? '查看暂停作业' : '继续作业'
    },
    taskEntry(t) {
      if (this.activeExecution && String(this.activeExecution.task_id) === String(t.id)) return { label: this.activeEntryLabel, mode: 'execution', reason: '产品码：' + this.activeExecution.product_code + (Number(this.activeExecution.status) === 1 ? ' · 已暂停' : ' · 进行中'), disabled: false }
      if (!t.revision_id) return { label: '暂无指导', mode: 'preview', reason: '任务内容尚未发布', disabled: true }
      if (this.executionFailed) return { label: '预览指导', mode: 'preview', reason: '作业状态加载失败，暂不可开工', disabled: false }
      if (this.activeExecution) return { label: '预览指导', mode: 'preview', reason: '工位被「' + (this.activeExecution.task_name || '其他任务') + '」占用', disabled: false }
      if (!t.onsite_available) return { label: '预览指导', mode: 'preview', reason: this.unavailable(t), disabled: false }
      if (!this.canStart) return { label: '预览指导', mode: 'preview', reason: '当前账号仅可查看指导', disabled: false }
      return { label: '进入作业', mode: 'start', reason: '', disabled: false }
    },
    async openActive() {
      if (!this.activeExecution || this.loading) return
      const id = this.activeExecution.id; const seq = ++this.sequence
      this.loading = true; this.failed = ''
      try {
        const { data } = await fetchExecution(id)
        if (seq !== this.sequence) return
        this.activeExecution = data.status < 2 ? data : null
        if (Number(data.status) >= 2) { this.failed = '该作业已结束，请刷新工位任务'; return }
        if (this.task && String(this.task.id) !== String(data.task_id)) { this.task = null; this.revision = null }
        if (this.cameraPool && this._cameraTaskId && this._cameraTaskId !== String(data.task_id)) { this.cameraPool.close(); this.cameraPool = null }
        this._cameraTaskId = String(data.task_id)
        this.executionId = String(data.id)
        this._voiceScope = 'execution:' + data.id
      } catch (error) { if (seq === this.sequence) this.failed = '作业加载失败，请刷新重试' } finally { if (seq === this.sequence) this.loading = false }
    },
    async enterTask(t) {
      if (this.taskEntry(t).disabled || this.loading) return
      const seq = ++this.sequence
      this.loading = true; this.failed = ''
      try {
        const { data } = await fetchExecutions({ station_id: this.stationId, active: true, limit: 1 })
        if (seq !== this.sequence) return
        this.activeExecution = data.items[0] || null; this.canStart = data.can_start === true; this.executionFailed = false
      } catch (error) { if (seq === this.sequence) this.executionFailed = true } finally { if (seq === this.sequence) this.loading = false }
      if (seq !== this.sequence) return
      if (this.activeExecution && String(this.activeExecution.task_id) === String(t.id)) await this.openActive()
      else await this.openTask(t)
    },
    exitFocus(event) { if (event.key === 'Escape' && !document.querySelector('.v-modal')) this.focused = false },
    async searchStations(keyword) {
      const seq = ++this.searchSequence
      this.stationFailed = false
      try { const { data } = await fetchResources('station', { keyword, status: 0, page: 1, limit: 100 }); if (seq === this.searchSequence) this.stations = data.items } catch (e) { if (seq === this.searchSequence) this.stationFailed = true }
    },
    async selectStation(keepPool = false) {
      if (keepPool !== true) { if (this.cameraPool) this.cameraPool.close(); this.cameraPool = null; this._cameraTaskId = null }
      const seq = ++this.sequence
      // Vue Router 3.0.x returns void; callbacks also handle duplicate navigation.
      if (this.$router && this.$route) this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, station: this.stationId || undefined }}, () => {}, () => {})
      this.canStart = false; this.executionId = ''; this.activeExecution = null; this.productCode = ''; this.startKey = ''; this.executionFailed = false; this.task = null; this.revision = null; this.items = []; this.station = null; this.failed = ''; this.keyword = ''
      if (!this.stationId) { this.loading = false; return }
      this.loading = true
      try {
        const [detail, tasks] = await Promise.all([fetchResource('station', this.stationId), fetchStationTasks(this.stationId)])
        if (seq !== this.sequence) return
        this.station = detail.data; this.items = tasks.data.items
        if (!this.stations.some(s => s.id === detail.data.id)) this.stations.push(detail.data)
        try { const { data } = await fetchExecutions({ station_id: this.stationId, active: true, limit: 1 }); if (seq === this.sequence) { this.activeExecution = data.items[0] || null; this.canStart = data.can_start === true } } catch (e) { if (seq === this.sequence) this.executionFailed = true }
      } catch (e) { if (seq === this.sequence) this.failed = '工位任务加载失败，请刷新重试' } finally { if (seq === this.sequence) this.loading = false }
    },
    canPreview(t) { return !!t.revision_id },
    unavailable(t) {
      if (typeof t.onsite_available !== 'boolean') return '后端接口版本不匹配，请更新并重启 Java 后端后刷新'
      if (t.onsite_unavailable_reasons && t.onsite_unavailable_reasons.length) return t.onsite_unavailable_reasons.join('；')
      if (Number(t.status) === 2) return '任务已取消'
      if (Number(t.project_status) === 0) return '项目尚未开始，请先开始项目'
      if (Number(t.subproject_status) === 0) return '子项目尚未开始，请先开始子项目'
      if (Number(t.project_status) >= 2 || Number(t.subproject_status) >= 2) return '项目或子项目已完成／归档'
      if (!t.revision_id) return '内容尚未发布'
      if (t.issues && t.issues.length) return t.issues.join('；')
      return '后台判定任务不可用，请刷新或检查后台返回的可用状态'
    },
    async openTask(t) {
      if (!this.canPreview(t) || this.loading) return
      const seq = ++this.sequence
      this.loading = true; this.failed = ''; this.revision = null; this.task = t; this.stepIndex = 0; this.productCode = ''; this.startKey = ''
      try {
        // Refresh task eligibility before opening; never substitute a draft for a publication.
        const { data: current } = await fetchStationTasks(this.stationId)
        if (seq !== this.sequence) return
        const fresh = current.items.find(row => row.id === t.id)
        this.items = current.items
        if (!fresh || !this.canPreview(fresh)) { this.task = null; this.failed = fresh ? this.unavailable(fresh) : '任务已移出当前工位，请重新选择'; return }
        const { data } = await previewTask(fresh.project_id, fresh.subproject_id, fresh.id)
        if (seq !== this.sequence) return
        if (!this.cameraPool || (this._cameraTaskId && this._cameraTaskId !== String(fresh.id))) { if (this.cameraPool) this.cameraPool.close(); this.cameraPool = new TaskCameraPool(this.stationId) }
        this._cameraTaskId = String(fresh.id)
        this.task = fresh; this.revision = data
      } catch (e) { if (seq === this.sequence) this.failed = '已发布指导加载失败，请返回任务列表重试' } finally { if (seq === this.sequence) this.loading = false }
    },
    async start() {
      if (!this.readyToStart || !this.canStart || this.starting || this.activeExecution || this.executionFailed || !this.task || !this.revision || !this.productCode.trim()) return
      if (!this.startKey) this.startKey = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'start_' + Date.now() + '_' + Math.random().toString(36).slice(2)
      const seq = this.sequence; this.starting = true
      try {
        const { data } = await startExecution({ project_id: this.task.project_id, subproject_id: this.task.subproject_id, task_id: this.task.id, station_id: this.stationId, revision_id: this.revision.id, task_version: this.task.version, product_code: this.productCode.trim(), request_key: this.startKey })
        if (seq !== this.sequence) return
        if (this._voiceScope) voice.cancelScope(this._voiceScope)
        this._voiceScope = 'execution:' + data.id
        announceExecution('execution.started', {
          scopeId: this._voiceScope,
          operationId: this.startKey
        })
        this.executionId = data.id; this.activeExecution = data; this.$message.success('开工成功')
      } catch (e) { /* Preserve request key and barcode for safe retry after a lost response. */ } finally { this.starting = false }
    },
    productChanged() { this.startKey = '' },
    async executionChanged(data) {
      if (String(data.id) !== String(this.executionId)) return
      this.activeExecution = data.status < 2 ? data : null
      if (Number(data.status) === 3 && this.cameraPool) { this.cameraPool.close(); this.cameraPool = null }
      if (Number(data.status) !== 2) return
      const taskId = String(data.task_id || (this.task && this.task.id) || '')
      const stationId = this.stationId; const seq = ++this.sequence
      // Return to preview immediately while refreshing publication and eligibility in the background.
      // Never release the workbench-owned camera pool between consecutive products.
      if (!this.task && data.content) this.task = { id: taskId, name: data.task_name, project_id: data.project_id, subproject_id: data.subproject_id, project_name: data.project_name, subproject_name: data.subproject_name, onsite_available: false }
      if (!this.revision && data.content) this.revision = data.content
      this.executionId = ''; this.productCode = ''; this.startKey = ''; this.stepIndex = 0; this.canStart = false; this.executionFailed = false; this.failed = ''
      try {
        const [station, tasks, active] = await Promise.all([fetchResource('station', stationId), fetchStationTasks(stationId), fetchExecutions({ station_id: stationId, active: true, limit: 1 })])
        if (seq !== this.sequence || stationId !== this.stationId) return
        this.station = station.data; this.items = tasks.data.items; this.activeExecution = active.data.items[0] || null
        const task = this.items.find(item => String(item.id) === taskId)
        if (!task || !task.onsite_available) { this.failed = task ? this.unavailable(task) : '原任务已不在当前工位，请重新选择任务'; if (this.cameraPool) this.cameraPool.close(); this.cameraPool = null; return }
        const { data: publication } = await previewTask(task.project_id, task.subproject_id, task.id)
        if (seq !== this.sequence || stationId !== this.stationId) return
        this.task = task; this.revision = publication; this._cameraTaskId = taskId; this.canStart = active.data.can_start === true
        await this.$nextTick()
        if (seq === this.sequence && !this.activeExecution && this.canStart && this.$refs.productCodeInput) this.$refs.productCodeInput.focus()
      } catch (error) { if (seq === this.sequence) { this.executionFailed = true; this.failed = '开工信息刷新失败，请刷新后再扫码' } }
    },
    async leaveExecution() {
      if (this._voiceScope) voice.cancelScope(this._voiceScope)
      this.executionId = ''
      await this.selectStation()
    },
    back() {
      if (this._voiceScope) voice.cancelScope(this._voiceScope)
      if (this.cameraPool) this.cameraPool.close()
      this.cameraPool = null
      this._cameraTaskId = null
      ++this.sequence
      this.loading = false
      this.task = null
      this.revision = null
      this.failed = ''
    }
  }
}
