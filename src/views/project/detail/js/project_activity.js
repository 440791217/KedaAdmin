import Pagination from '@/components/Pagination'
import { fetchProjectActivities } from '@/api/project'
export default {
  name: 'ProjectActivity', components: { Pagination }, props: { project: { type: Object, required: true }},
  data() { return { query: { page: 1, limit: 20 }, items: [], total: 0, loading: false, failed: false, sequence: 0, labels: { TASK_DELETED: '删除SOP任务', SUBPROJECT_DELETED: '删除子项目', PROJECT_DELETED: '删除项目', SOP_OWNER_CHANGED: '转移SOP负责人', MEMBER_ADDED: '添加成员', MEMBER_RESTORED: '重新加入成员', MEMBER_ACCESS_CHANGED: '修改成员权限', MEMBER_REMOVED: '移除成员', PROJECT_OWNER_CHANGED: '转移项目负责人', SUBPROJECT_OWNER_CHANGED: '转移子项目负责人' }} },
  created() { this.load() }, beforeDestroy() { ++this.sequence },
  methods: {
    async load() {
      const seq = ++this.sequence; this.loading = true; this.failed = false
      try { const { data } = await fetchProjectActivities(this.project.id, this.query); if (seq !== this.sequence) return; this.items = data.items; this.total = data.total } catch (error) { if (seq === this.sequence) { this.items = []; this.total = 0; this.failed = true } } finally { if (seq === this.sequence) this.loading = false }
    }
  }
}
