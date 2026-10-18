import { fetchExecutions } from '@/api/execution'
import ExecutionPanel from '@/shared/execution/components/ExecutionPanel.vue'
export default {
  name: 'ExecutionRecords',
  components: { ExecutionPanel },
  data() { return { handling: false, product: '', station: '', project: '', operator: '', dates: [], status: null, page: 1, limit: 20, items: [], total: 0, loading: false, failed: false, selected: '', sequence: 0, states: ['进行中', '已暂停', '已完成', '已中止'] } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence },
  methods: {
    async load(reset = false) {
      if (reset === true) this.page = 1
      const seq = ++this.sequence; this.loading = true; this.failed = false; this.items = []
      try {
        const { data } = await fetchExecutions({ page: this.page, limit: this.limit, product_code: this.product || undefined, station_name: this.station || undefined, project_name: this.project || undefined, operator_name: this.operator || undefined, status: this.status === null || this.status === '' ? undefined : this.status, from: this.dates && this.dates[0], to: this.dates && this.dates[1] })
        if (seq === this.sequence) { this.items = data.items; this.total = data.total }
      } catch (e) { if (seq === this.sequence) this.failed = true } finally { if (seq === this.sequence) this.loading = false }
    },
    time(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' }
  }
}
