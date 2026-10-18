import { fetchExecution, actExecution, confirmExecutionStep } from '@/api/execution'
import OperationGuide from '@/shared/execution/components/OperationGuide.vue'
export default {
  name: 'ExecutionPanel',
  components: { OperationGuide },
  props: { executionId: { type: String, required: true }, readonly: Boolean },
  data() { return { execution: null, loading: false, busy: false, failed: false, stepIndex: 0, sequence: 0, reasonOpen: false, pendingAction: '', reason: '', states: ['进行中', '已暂停', '已完成', '已中止'], actions: { start: '开工', confirm: '确认步骤', pause: '暂停', resume: '恢复', complete: '完成', abort: '中止' }} },
  computed: {
    steps() { return this.execution ? this.execution.content.steps : [] },
    step() { return this.steps[this.stepIndex] },
    nextPosition() { if (!this.execution) return 0; const s = this.execution.steps.find(s => !s.confirmed_at); return s ? Number(s.position) : 0 },
    canOperate() { return !this.readonly && this.execution && this.execution.can_operate },
    canAbort() { return !this.readonly && this.execution && this.execution.can_abort },
    canConfirm() { return this.canOperate && this.execution.status === 0 && this.stepIndex + 1 === this.nextPosition }
  },
  watch: { executionId() { this.load() } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence },
  methods: {
    async load() {
      const seq = ++this.sequence; this.loading = true; this.failed = false; this.execution = null
      try { const { data } = await fetchExecution(this.executionId); if (seq === this.sequence) { this.accept(data); this.$emit('loaded', data) } } catch (e) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    accept(data) { this.execution = data; const pending = data.steps.findIndex(s => !s.confirmed_at); this.stepIndex = pending < 0 ? Math.max(0, data.content.steps.length - 1) : pending },
    time(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' },
    async action(action) {
      if ((!this.canOperate && !(action === 'abort' && this.canAbort)) || this.busy) return
      if (action === 'pause' || action === 'abort') { this.pendingAction = action; this.reason = ''; this.reasonOpen = true; return }
      if (action === 'complete') { try { await this.$confirm('确认本次产品作业已全部完成？', '完成作业', { type: 'warning' }) } catch (e) { return } }
      await this.submit(action)
    },
    async submitReason() { if (!this.reason.trim()) return this.$message.warning('请填写原因'); await this.submit(this.pendingAction, this.reason.trim()) },
    async submit(action, reason) {
      if ((!this.canOperate && !(action === 'abort' && this.canAbort)) || this.busy) return
      const seq = this.sequence; const id = this.executionId
      this.busy = true
      try {
        const payload = { version: this.execution.version, reason }
        const { data } = action === 'confirm' ? await confirmExecutionStep(id, this.stepIndex + 1, payload) : await actExecution(id, action, payload)
        if (seq !== this.sequence) return
        this.accept(data); this.reasonOpen = false; this.$emit('changed', data)
        this.$message.success(action === 'confirm' ? '步骤已确认' : '作业状态已更新')
      } catch (e) { if (seq === this.sequence && e.code === 409) { this.$message.warning('作业状态已变化，请点击刷新确认最新结果后再操作') } } finally { this.busy = false }
    }
  }
}
