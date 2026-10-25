import { fetchProjectStations, addProjectStation, removeProjectStation } from '@/api/project'
import { fetchResources } from '@/api/resource'

export default {
  name: 'ProjectStations',
  props: { project: { type: Object, required: true }},
  data() { return { items: [], version: 0, canManage: false, loading: false, failed: false, busy: false, dialog: false, selected: '', options: [], searching: false, sequence: 0, searchSequence: 0 } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence; ++this.searchSequence },
  methods: {
    async load() {
      const sequence = ++this.sequence
      this.loading = true; this.failed = false; this.canManage = false
      try {
        const { data } = await fetchProjectStations(this.project.id)
        if (sequence !== this.sequence) return
        this.items = data.items; this.version = data.project_version; this.canManage = data.can_manage
      } catch (error) { if (sequence === this.sequence) { this.items = []; this.failed = true } } finally { if (sequence === this.sequence) this.loading = false }
    },
    open() { this.selected = ''; this.options = []; this.dialog = true; this.search('') },
    closeDialog(done) { if (!this.busy) done() },
    async search(keyword) {
      const sequence = ++this.searchSequence
      this.searching = true
      try {
        const { data } = await fetchResources('station', { keyword, status: 0, limit: 100 })
        if (sequence === this.searchSequence) this.options = data.items.filter(s => !this.items.some(link => link.id === s.id))
      } catch (error) { if (sequence === this.searchSequence) this.options = [] } finally { if (sequence === this.searchSequence) this.searching = false }
    },
    async add() {
      if (this.busy || !this.selected) return
      this.busy = true
      try {
        await addProjectStation(this.project.id, this.selected, this.version)
        this.dialog = false; this.$message.success('工位已关联'); this.$emit('changed'); await this.load()
      } catch (error) { if (error.code === 409) { this.dialog = false; await this.load(); this.$emit('changed') } } finally { this.busy = false }
    },
    async remove(station) {
      if (this.busy || Number(station.task_count) > 0) return
      this.busy = true
      try {
        try { await this.$confirm(`解除与“${station.name}”的关联？此后本项目任务将不能选择该工位。`, '解除关联', { type: 'warning' }) } catch (error) { return }
        await removeProjectStation(this.project.id, station.id, this.version)
        this.$message.success('已解除关联'); this.$emit('changed'); await this.load()
      } catch (error) { if (error.code === 409) { await this.load(); this.$emit('changed') } } finally { this.busy = false }
    }
  }
}
