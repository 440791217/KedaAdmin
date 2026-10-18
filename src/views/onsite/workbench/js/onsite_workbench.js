import { fetchExecutions, startExecution } from '@/api/execution'
import ExecutionPanel from '@/shared/execution/components/ExecutionPanel.vue'
import { fetchResources, fetchResource, fetchStationTasks, previewTask } from '@/api/resource'
import OperationGuide from '@/shared/execution/components/OperationGuide.vue'
export default {
  name: 'OnsiteWorkbench',
  components: { OperationGuide, ExecutionPanel },
  data() {
    return { focused: false, canStart: false, executionId: '', activeExecution: null, productCode: '', startKey: '', starting: false, executionFailed: false, stations: [], stationId: '', station: null, items: [], keyword: '', task: null, revision: null, stepIndex: 0, loading: false, failed: '', stationFailed: false, sequence: 0, searchSequence: 0 }
  },
  computed: {
    filteredTasks() { const q = this.keyword.trim().toLowerCase(); return this.items.filter(t => [t.name, t.code, t.project_name, t.subproject_name].join(' ').toLowerCase().includes(q)) },
    step() { return this.revision && this.revision.steps[this.stepIndex] },
    imageKey() { return [this.task && this.task.id, this.revision && this.revision.id, this.stepIndex].join(':') }
  },
  created() {
    window.addEventListener('keydown', this.exitFocus)
    this.searchStations('')
    if (this.$route && this.$route.query.station) { this.stationId = this.$route.query.station; this.selectStation() }
  },
  beforeDestroy() { ++this.sequence; ++this.searchSequence; window.removeEventListener('keydown', this.exitFocus) },
  methods: {
    exitFocus(event) { if (event.key === 'Escape' && !document.querySelector('.v-modal')) this.focused = false },
    async searchStations(keyword) {
      const seq = ++this.searchSequence
      this.stationFailed = false
      try { const { data } = await fetchResources('station', { keyword, status: 0, page: 1, limit: 100 }); if (seq === this.searchSequence) this.stations = data.items } catch (e) { if (seq === this.searchSequence) this.stationFailed = true }
    },
    async selectStation() {
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
    unavailable(t) {
      if (typeof t.onsite_available !== 'boolean') return '后端接口版本不匹配，请更新并重启 Java 后端后刷新'
      if (t.onsite_unavailable_reasons && t.onsite_unavailable_reasons.length) return t.onsite_unavailable_reasons.join('；')
      if (Number(t.status) === 2) return '任务已取消'
      if (Number(t.project_status) >= 2 || Number(t.subproject_status) >= 2) return '项目或子项目已完成／归档'
      if (!t.revision_id) return '内容尚未发布'
      if (t.issues && t.issues.length) return t.issues.join('；')
      return '后台判定任务不可用，请刷新或检查后台返回的可用状态'
    },
    async openTask(t) {
      if (!t.onsite_available || this.loading) return
      const seq = ++this.sequence
      this.loading = true; this.failed = ''; this.revision = null; this.task = t; this.stepIndex = 0; this.productCode = ''; this.startKey = ''
      try {
        // Refresh task eligibility before opening; never substitute a draft for a publication.
        const { data: current } = await fetchStationTasks(this.stationId)
        if (seq !== this.sequence) return
        const fresh = current.items.find(row => row.id === t.id)
        this.items = current.items
        if (!fresh || !fresh.onsite_available) { this.task = null; this.failed = fresh ? this.unavailable(fresh) : '任务已移出当前工位，请重新选择'; return }
        const { data } = await previewTask(fresh.project_id, fresh.subproject_id, fresh.id)
        if (seq !== this.sequence) return
        this.task = fresh; this.revision = data
      } catch (e) { if (seq === this.sequence) this.failed = '已发布指导加载失败，请返回任务列表重试' } finally { if (seq === this.sequence) this.loading = false }
    },
    async start() {
      if (!this.canStart || this.starting || this.activeExecution || this.executionFailed || !this.task || !this.revision || !this.productCode.trim()) return
      if (!this.startKey) this.startKey = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'start_' + Date.now() + '_' + Math.random().toString(36).slice(2)
      const seq = this.sequence; this.starting = true
      try {
        const { data } = await startExecution({ project_id: this.task.project_id, subproject_id: this.task.subproject_id, task_id: this.task.id, station_id: this.stationId, revision_id: this.revision.id, task_version: this.task.version, product_code: this.productCode.trim(), request_key: this.startKey })
        if (seq !== this.sequence) return
        this.executionId = data.id; this.activeExecution = data; this.$message.success('开工成功')
      } catch (e) { /* Preserve request key and barcode for safe retry after a lost response. */ } finally { this.starting = false }
    },
    productChanged() { this.startKey = '' },
    executionChanged(data) { this.activeExecution = data.status < 2 ? data : null },
    async leaveExecution() { this.executionId = ''; await this.selectStation() },
    back() { ++this.sequence; this.loading = false; this.task = null; this.revision = null; this.failed = '' }
  }
}
