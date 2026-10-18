import OwnerTransfer from '@/views/project/detail/components/OwnerTransfer.vue'
import Pagination from '@/components/Pagination'
import EntityDialog from '@/shared/project/components/EntityDialog.vue'
import { fetchProjectList, fetchProject, deleteProject, setProjectStatus, restoreProject } from '@/api/project'
import { statusLabels, statusTypes, nextStatuses } from '@/shared/project/js/project_helpers'
export default {
  name: 'ProjectManagement', components: { Pagination, EntityDialog, OwnerTransfer },
  data() { return { ownerDialog: false, ownerProject: null, query: { page: 1, limit: 20, keyword: '', status: '' }, items: [], total: 0, canCreate: false, loading: false, failed: false, busy: false, dialog: false, selected: null, sequence: 0, statusLabels, statusTypes } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence },
  methods: {
    nextStatuses,
    async load() {
      const sequence = ++this.sequence
      this.loading = true; this.failed = false
      try {
        const response = await fetchProjectList({ ...this.query, status: this.query.status === '' ? undefined : this.query.status })
        if (sequence !== this.sequence) return
        this.items = response.data.items; this.total = response.data.total; this.canCreate = response.data.can_create
      } catch (error) { if (sequence === this.sequence) { this.items = []; this.total = 0; this.canCreate = false; this.failed = true } } finally { if (sequence === this.sequence) this.loading = false }
    },
    search() { this.query.page = 1; this.load() },
    reset() { this.query = { page: 1, limit: 20, keyword: '', status: '' }; this.load() },
    openForm(row) { this.selected = row; this.dialog = true },
    async saved(result) { if (result.created) this.query.page = 1; await this.load() },
    async transferOwner(row) {
      if (this.busy || this.loading || !row.can_transfer_owner) return
      this.busy = true
      try { this.ownerProject = (await fetchProject(row.id)).data; this.ownerDialog = true } catch (e) { /* reported */ } finally { this.busy = false }
    },
    async command(action, row) {
      if (this.busy || this.loading) return
      if (action === 'delete' && row.can_delete !== true) return
      if (action === 'view') return this.$router.push(`/project/${row.id}`)
      if (action === 'edit') {
        this.busy = true
        try { this.openForm((await fetchProject(row.id)).data) } catch (error) { /* reported */ } finally { this.busy = false }
        return
      }
      this.busy = true
      let requested = false
      try {
        try { await this.$confirm(action === 'restore' ? `恢复项目“${row.name}”及随其归档的子项目至归档前状态？原先单独归档的子项目保持归档；旧档无状态记录时恢复为未开始。` : action === 'delete' ? `删除项目“${row.name}”及其全部子项目、SOP任务？这些内容将从业务页面移除，保留执行历史；有未结束作业时不能删除。` : action === 3 ? `归档项目“${row.name}”及其子项目？归档后只读，有权限的人可以恢复。` : `确认将项目状态改为“${statusLabels[action]}”？`, '操作确认', { type: 'warning' }) } catch (error) { return }
        requested = true
        if (action === 'restore') await restoreProject(row.id, row.version)
        else if (action === 'delete') { await deleteProject(row.id, row.version); if (this.items.length === 1 && this.query.page > 1) this.query.page-- } else await setProjectStatus(row.id, action, row.version)
        this.$message.success('操作成功')
      } catch (error) { /* reported */ } finally { if (requested) await this.load(); this.busy = false }
    }
  }
}
