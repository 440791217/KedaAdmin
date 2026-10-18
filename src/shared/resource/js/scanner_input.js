export default {
  name: 'ScannerInput',
  props: { stationId: { type: String, required: true }},
  data() {
    return { value: '', last: '', lastTime: 0 }
  },
  watch: {
    stationId() {
      this.value = ''
      this.last = ''
      this.lastTime = 0
    }
  },
  methods: {
    receive() {
      const code = this.value.trim()
      this.value = ''
      if (!code) return
      const now = Date.now()
      if (code === this.last && now - this.lastTime < 1000) return
      this.last = code
      this.lastTime = now
      this.$emit('scan', {
        value: code,
        station_id: this.stationId,
        timestamp: now
      })
    }
  }
}
