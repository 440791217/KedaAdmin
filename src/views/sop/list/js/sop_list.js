import Pagination from '@/components/Pagination'
import { fetchSops, deleteSop } from '@/api/sop'
export default {
  name: 'SopList',
  components: { Pagination },
  data() {
    return {
      items: [],
      total: 0,
      query: { page: 1, limit: 20, keyword: '' },
      loading: false,
      failed: false,
      busy: false,
      sequence: 0
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
  },
  methods: {
    async load() {
      const seq = ++this.sequence
      this.loading = true
      this.failed = false
      try {
        const { data } = await fetchSops({ ...this.query })
        if (seq === this.sequence) {
          this.items = data.items
          this.total = data.total
        }
      } catch (error) {
        if (seq === this.sequence) {
          this.failed = true
          this.items = []
          this.total = 0
        }
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    search() {
      this.query.page = 1
      this.load()
    },
    async command(action, row) {
      if (action === 'view') return this.$router.push(`/sop/${row.id}`)
      if (this.busy) return
      this.busy = true
      try {
        try {
          await this.$confirm(`删除未发布SOP“${row.name}”？`, '删除确认', { type: 'warning' })
        } catch (error) {
          return
        }
        await deleteSop(row.id, row.version)
        this.$message.success('已删除')
        if (this.items.length === 1 && this.query.page > 1) this.query.page--
      } catch (error) {
        /* reported */
      } finally {
        await this.load()
        this.busy = false
      }
    }
  }
}
