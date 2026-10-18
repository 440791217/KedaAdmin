import Pagination from '@/components/Pagination'
import { fetchProjectMembers, fetchMemberOptions, addProjectMember, updateProjectMember, removeProjectMember } from '@/api/project'
export default {
  name: 'ProjectMembers', components: { Pagination }, props: { project: { type: Object, required: true }},
  data() { return { query: { page: 1, limit: 20, status: 1, keyword: '' }, items: [], total: 0, loading: false, failed: false, busy: false, dialog: false, selected: null, form: {}, options: [], optionsLoading: false, sequence: 0, optionsSequence: 0, projectVersion: 0 } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence; this.invalidateOptions() },
  methods: {
    async load() {
      const seq = ++this.sequence; this.loading = true; this.failed = false
      try { const { data } = await fetchProjectMembers(this.project.id, this.query); if (seq !== this.sequence) return; this.items = data.items; this.total = data.total; this.projectVersion = data.project_version } catch (error) { if (seq === this.sequence) { this.failed = true; this.items = []; this.total = 0 } } finally { if (seq === this.sequence) this.loading = false }
    },
    search() { this.query.page = 1; this.load() },
    invalidateOptions() { ++this.optionsSequence; this.optionsLoading = false },
    open(row) { this.selected = row; this.form = { user_id: row ? row.user_id : '', access_level: row ? row.access_level : 0 }; this.options = []; this.dialog = true; this.$nextTick(() => this.$refs.form.clearValidate()); if (!row) this.searchOptions('') },
    async searchOptions(keyword) {
      const seq = ++this.optionsSequence; this.optionsLoading = true
      try { const { data } = await fetchMemberOptions(this.project.id, keyword); if (seq === this.optionsSequence) this.options = data } catch (error) { /* reported */ } finally { if (seq === this.optionsSequence) this.optionsLoading = false }
    },
    async save() {
      if (this.busy) return
      this.busy = true
      try {
        if (!await this.$refs.form.validate().catch(() => false)) return
        if (this.selected) await updateProjectMember(this.project.id, this.selected.user_id, { access_level: this.form.access_level, version: this.selected.version })
        else await addProjectMember(this.project.id, { ...this.form, version: this.projectVersion })
        this.dialog = false; this.$message.success('成员已更新'); this.$emit('changed')
      } catch (error) { if (error.code === 409) { this.dialog = false; this.$emit('changed') } } finally { this.busy = false }
    },
    async command(action, row) {
      if (this.busy) return
      if (action === 'access') return this.open(row)
      this.busy = true
      try {
        try { await this.$confirm(`移除“${row.real_name}”？移除后立即失去本项目访问权，历史记录保留。`, '移除成员', { type: 'warning' }) } catch (error) { return }
        await removeProjectMember(this.project.id, row.user_id, row.version)
        this.$message.success('成员已移除'); this.$emit('changed')
      } catch (error) { if (error.code === 409) this.$emit('changed') } finally { this.busy = false }
    }
  }
}
