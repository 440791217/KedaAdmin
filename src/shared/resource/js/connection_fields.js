import {
  connectionModes,
  transportLabels,
  newConnection,
  connectionPayload,
  connectionError
} from '@/shared/resource/js/connection_helpers'
import { testCameraConnection } from '@/api/resource'
export default {
  name: 'ConnectionFields',
  props: { value: { type: Object, required: true }, disabled: Boolean },
  data() {
    return { labels: transportLabels, testing: false, previewUrl: '', testSequence: 0 }
  },
  watch: { value: { deep: true, handler() { ++this.testSequence; this.testing = false; this.releasePreview() } }},
  beforeDestroy() { ++this.testSequence; this.releasePreview() },
  computed: {
    protocols() {
      return connectionModes[this.value.transport] || []
    }
  },
  methods: {
    releasePreview() {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl)
      this.previewUrl = ''
    },
    async test() {
      if (this.disabled || this.testing) return
      const error = connectionError(this.value)
      if (error) return this.$message.warning(error)
      const seq = ++this.testSequence
      this.testing = true
      this.releasePreview()
      try {
        const blob = await testCameraConnection(connectionPayload(this.value))
        if (seq === this.testSequence) {
          this.previewUrl = URL.createObjectURL(blob)
          this.$message.success('连接成功，已获取摄像头画面')
        }
      } catch (e) { /* request reports; keep entered address */ } finally {
        if (seq === this.testSequence) this.testing = false
      }
    },
    field(key, value) {
      this.$emit('input', { ...this.value, [key]: value })
    },
    changeTransport(transport) {
      this.$emit('input', newConnection(transport))
    }
  }
}
