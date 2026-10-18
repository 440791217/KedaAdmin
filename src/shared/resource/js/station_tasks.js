import { fetchStationTasks } from '@/api/resource'
export default {
  name: 'StationTasks',
  props: { station: { type: Object, required: true }},
  data() { return { items: [], loading: false, failed: false, sequence: 0 } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence },
  methods: {
    async load() {
      const seq = ++this.sequence
      this.loading = true; this.failed = false; this.items = []
      try { const { data } = await fetchStationTasks(this.station.id); if (seq === this.sequence) this.items = data.items } catch (e) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    visit(row) { this.$router.push(`/project/${row.project_id}/subproject/${row.subproject_id}/task/${row.id}`) }
  }
}
