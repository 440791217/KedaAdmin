import SopTasks from '@/views/project/detail/components/SopTasks.vue'
import EntityDialog from '@/shared/project/components/EntityDialog.vue'
import ProjectMembers from '@/views/project/detail/components/ProjectMembers.vue'
import ProjectStations from '@/views/project/detail/components/ProjectStations.vue'
import ProjectActivity from '@/views/project/detail/components/ProjectActivity.vue'
import OwnerTransfer from '@/views/project/detail/components/OwnerTransfer.vue'
import { fetchProject, fetchSubprojects, fetchSubproject, setProjectStatus, deleteProject, setSubprojectStatus, deleteSubproject, sortSubprojects, restoreProject, restoreSubproject } from '@/api/project'
import { statusLabels, statusTypes, nextStatuses } from '@/shared/project/js/project_helpers'
export default {
  name: 'ProjectDetail', components: { SopTasks, EntityDialog, ProjectMembers, ProjectStations, ProjectActivity, OwnerTransfer },
  data() { return { project: null, record: null, children: [], loading: false, busy: false, failed: false, dialog: false, selected: null, editingSub: false, sequence: 0, statusLabels, statusTypes, activeTab: 'children', ownerDialog: false, ownerEntity: null } },
  computed: {
    projectId() { return this.$route.params.projectId },
    isSub() { return !!this.$route.params.subprojectId }
  },
  watch: { '$route.fullPath'() { this.dialog = false; this.ownerDialog = false; this.activeTab = this.isSub ? 'tasks' : 'children'; this.load() } },
  created() { this.activeTab = this.isSub ? 'tasks' : 'children'; this.load() },
  beforeDestroy() { ++this.sequence },
  methods: {
    nextStatuses,
    subStatuses(row) { return nextStatuses(row.status).filter(status => status !== 1 || this.project.status === 1) },
    async load() {
      const sequence = ++this.sequence
      const projectId = this.projectId
      const subprojectId = this.$route.params.subprojectId
      this.loading = true; this.failed = false; this.record = null
      if (!projectId) { this.loading = false; return }
      try {
        const [projectResponse, response] = await Promise.all([
          fetchProject(projectId),
          subprojectId ? fetchSubproject(projectId, subprojectId) : fetchSubprojects(projectId)
        ])
        if (sequence !== this.sequence) return
        this.project = projectResponse.data; this.record = subprojectId ? response.data : projectResponse.data; this.children = subprojectId ? [] : response.data
      } catch (error) { if (sequence === this.sequence) { this.record = null; this.project = null; this.children = []; this.failed = true } } finally { if (sequence === this.sequence) this.loading = false }
    },
    openForm(row, sub) { this.selected = row; this.editingSub = sub; this.dialog = true },
    async transferred(result) { if (result.main) await this.$router.push('/project/list'); else await this.load() },
    async command(action, row, sub) {
      if (this.busy || this.loading) return
      if (action === 'delete' && row.can_delete !== true) return
      const projectId = this.projectId
      const routePath = this.$route.fullPath
      if (action === 'view') return this.$router.push(`/project/${this.projectId}/subproject/${row.id}`)
      if (action === 'edit' || action === 'owner') {
        this.busy = true
        try {
          const response = sub ? await fetchSubproject(projectId, row.id) : await fetchProject(projectId)
          if (routePath === this.$route.fullPath) {
            if (action === 'owner') { if (!sub) this.project = response.data; this.ownerEntity = sub ? response.data : null; this.ownerDialog = true } else this.openForm(response.data, sub)
          }
        } catch (error) { /* reported */ } finally { this.busy = false }
        return
      }
      this.busy = true
      let navigated = false
      let requested = false
      try {
        try { await this.$confirm(action === 'restore' ? `恢复“${row.name}”至归档前状态？${sub ? '' : '随主项目归档的子项目同步恢复，原先单独归档的保持归档。'}旧档无状态记录时恢复为未开始。` : action === 'delete' ? `删除“${row.name}”${sub ? '及其全部SOP任务' : '及其全部子项目和SOP任务'}？删除后从业务页面移除，保留执行历史；有未结束作业时不能删除。` : action === 3 ? `归档“${row.name}”？${sub ? '' : '其有效子项目也会归档。'}归档后只读，有权限的人可以恢复。` : `将“${row.name}”设为${statusLabels[action]}？`, '操作确认', { type: 'warning' }) } catch (error) { return }
        if (routePath !== this.$route.fullPath) return
        requested = true
        if (action === 'restore') {
          if (sub) await restoreSubproject(projectId, row.id, row.version)
          else await restoreProject(row.id, row.version)
        } else if (action === 'delete') {
          if (sub) await deleteSubproject(projectId, row.id, row.version)
          else await deleteProject(row.id, row.version)
        } else if (sub) await setSubprojectStatus(projectId, row.id, action, row.version)
        else await setProjectStatus(row.id, action, row.version)
        this.$message.success('操作成功')
        if (routePath === this.$route.fullPath && action === 'delete' && (!sub || this.isSub)) {
          navigated = true
          await this.$router.push(sub ? `/project/${projectId}` : '/project/list')
          return
        }
      } catch (error) { /* reported */ } finally { if (requested && !navigated && routePath === this.$route.fullPath) await this.load(); this.busy = false }
    },
    async move(index, direction) {
      if (this.busy || this.loading) return
      const items = this.children.slice()
      const target = index + direction
      if (target < 0 || target >= items.length) return
      ;[items[index], items[target]] = [items[target], items[index]]
      this.busy = true
      try {
        await sortSubprojects(this.projectId, items.map(item => item.id), this.project.version)
        this.$message.success('排序已保存')
      } catch (error) { /* reported */ } finally { await this.load(); this.busy = false }
    }
  }
}
