import { fetchResources, fetchResource } from '@/api/resource'
export default {
  name: 'ResourceRequirements',
  props: { value: { type: Object, required: true }, disabled: Boolean, stationId: { type: String, default: '' }},
  data() {
    return { options: [], selected: null, loading: false, sequence: 0 }
  },
  watch: { stationId() { ++this.sequence; this.options = []; this.selected = null; this.loading = false } },
  beforeDestroy() {
    ++this.sequence
  },
  methods: {
    opened(v) {
      if (v) this.search('')
    },
    async search(keyword) {
      const seq = ++this.sequence
      this.loading = true
      try {
        if (this.stationId) {
          const { data } = await fetchResource('station', this.stationId)
          const models = new Map()
          const term = (keyword || '').trim().toLowerCase()
          ;(data.devices || []).filter(d => d.status === 0 && d.model_status === 0).forEach(d => {
            if (!term || [d.model_name, d.specification, d.name].join(' ').toLowerCase().includes(term)) models.set(d.model_id, { id: d.model_id, name: d.model_name, specification: d.specification, unit: d.unit })
          })
          if (seq === this.sequence) this.options = [...models.values()]
          return
        }
        const { data } = await fetchResources('model', {
          keyword,
          status: 0,
          limit: 100
        })
        if (seq === this.sequence) this.options = data.items
      } catch (e) {
        if (seq === this.sequence) this.options = []
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    environment(text) {
      this.$emit('input', { ...this.value, workplace_requirements: text })
    },
    change(index, field, value) {
      const items = this.value.items.map((i, n) =>
        n === index ? { ...i, [field]: value } : i
      )
      this.$emit('input', { ...this.value, items })
    },
    remove(index) {
      this.$emit('input', {
        ...this.value,
        items: this.value.items.filter((i, n) => n !== index)
      })
    },
    add(id) {
      const m = this.options.find((m) => m.id === id)
      if (m && !this.value.items.some((i) => i.model_id === id)) {
        this.$emit('input', {
          ...this.value,
          items: [
            ...this.value.items,
            {
              model_id: id,
              name: m.name,
              specification: m.specification,
              unit: m.unit,
              quantity: 1,
              description: ''
            }
          ]
        })
      }
      this.selected = null
    }
  }
}
