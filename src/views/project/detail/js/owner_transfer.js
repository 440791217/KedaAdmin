import { fetchMemberOptions, transferProjectOwner, transferSubprojectOwner } from '@/api/project'
export default {
  name: 'OwnerTransfer', props: { visible: Boolean, project: { type: Object, required: true }, entity: { type: Object, default: null }},
  data() { return { form: { owner_user_id: '' }, options: [], saving: false, loading: false, sequence: 0 } },
  watch: { visible(value) { if (!value) ++this.sequence } }, beforeDestroy() { ++this.sequence },
  methods: {
    init() { this.form = { owner_user_id: '' }; this.options = []; this.$nextTick(() => this.$refs.form.clearValidate()); this.search('') },
    close(value) { if (!this.saving) this.$emit('update:visible', value) },
    async search(keyword) {
      const seq = ++this.sequence; this.loading = true
      try { const { data } = await fetchMemberOptions(this.project.id, keyword, this.entity ? 'subproject_owner' : 'project_owner'); if (seq === this.sequence) this.options = data.filter(user => user.id !== (this.entity || this.project).owner_user_id) } catch (error) { /* reported */ } finally { if (seq === this.sequence) this.loading = false }
    },
    async save() {
      if (this.saving) return
      this.saving = true
      try {
        if (!await this.$refs.form.validate().catch(() => false)) return
        const target = this.options.find(user => user.id === this.form.owner_user_id)
        try { await this.$confirm(`确认将负责人转移给“${target ? target.real_name : this.form.owner_user_id}”？`, '负责人交接', { type: 'warning' }) } catch (error) { return }
        const data = { owner_user_id: this.form.owner_user_id, version: (this.entity || this.project).version }
        if (this.entity) await transferSubprojectOwner(this.project.id, this.entity.id, data)
        else await transferProjectOwner(this.project.id, data)
        this.$message.success('负责人已转移'); this.$emit('update:visible', false); this.$emit('transferred', { main: !this.entity })
      } catch (error) { if (error.code === 409) { this.$emit('update:visible', false); this.$emit('stale') } } finally { this.saving = false }
    }
  }
}
