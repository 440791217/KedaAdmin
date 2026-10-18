import { fetchTasks, saveTask, deleteTask } from '@/api/resource'
export default {
  name: 'SopTasks',
  props: { projectId: { type: String, required: true }, subprojectId: { type: String, required: true }},
  data() { return { items: [], canManage: false, canDelete: false, loading: false, failed: false, busy: false, sequence: 0 } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence },
  watch: { subprojectId() { this.load() } },
  methods: {
    async load() {
      const seq = ++this.sequence; this.loading = true; this.failed = false; this.items = []; this.canManage = false; this.canDelete = false
      try { const { data } = await fetchTasks(this.projectId, this.subprojectId); if (seq === this.sequence) { this.items = data.items; this.canManage = data.can_manage; this.canDelete = data.can_delete === true } } catch (e) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    open(row) { this.$router.push(`/project/${this.projectId}/subproject/${this.subprojectId}/task/${row ? row.id : 'new'}`) },
    taskRowClass({ row }) { return row.id === this.$route.query.task_id ? 'task-current-row' : '' },
    async command(action, row) {
      if (this.busy) return
      if (action === 'delete') {
        if (!this.canDelete || this.loading) return
        this.busy = true
        try {
          await this.$confirm(`删除SOP任务“${row.name}”？删除后将从项目和现场工作台移除，保留已产生的执行历史；有未结束作业时不能删除。`, '删除SOP任务', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' })
          await deleteTask(this.projectId, this.subprojectId, row); this.$message.success('任务已删除'); await this.load()
        } catch (e) { /* request reports */ } finally { this.busy = false }
        return
      }
      if (action !== 'cancel') return this.$router.push({ path: `/project/${this.projectId}/subproject/${this.subprojectId}/task/${row.id}`, query: { mode: action === 'edit' ? 'edit' : 'view' }})
      if (!this.canManage || row.status === 2) return
      this.busy = true
      try { await this.$confirm('取消该任务？取消后保留记录，不再允许编辑。', '取消任务', { type: 'warning' }); await saveTask(this.projectId, this.subprojectId, { id: row.id, code: row.code, name: row.name, station_id: row.station_id, owner_user_id: row.owner_user_id, sort_order: row.sort_order, description: row.description, sop_id: row.sop_id, revision_id: row.revision_id, version: row.version, status: 2 }); await this.load() } catch (e) { /* request reports */ } finally { this.busy = false }
    }
  }
}
