import { fetchExecutionImage } from '@/api/execution'
import { fetchTaskImage } from '@/api/resource'
import { fetchSopImage, fetchBoundSopImage } from '@/api/sop'
export default {
  name: 'ProtectedImage',
  props: {
    sopId: { type: String, default: '' },
    revisionId: { type: String, default: '' },
    fileId: { type: String, required: true },
    projectId: { type: String, default: '' },
    subprojectId: { type: String, default: '' },
    bindingId: { type: String, default: '' },
    taskId: { type: String, default: '' },
    executionId: { type: String, default: '' }
  },
  data() {
    return { url: '', loading: false, failed: false, sequence: 0 }
  },
  computed: {
    identity() {
      return [
        this.sopId,
        this.revisionId,
        this.fileId,
        this.projectId,
        this.subprojectId,
        this.bindingId, this.taskId, this.executionId
      ].join(':')
    }
  },
  watch: {
    identity() {
      this.load()
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
    this.release()
  },
  methods: {
    release() {
      if (this.url) URL.revokeObjectURL(this.url)
      this.url = ''
    },
    async load() {
      const seq = ++this.sequence
      this.release()
      this.loading = true
      this.failed = false
      try {
        const blob = this.executionId ? await fetchExecutionImage(this.executionId, this.fileId) : this.taskId ? await fetchTaskImage(this.projectId, this.subprojectId, this.taskId, this.fileId) : this.bindingId
          ? await fetchBoundSopImage(this.projectId, this.subprojectId, this.bindingId, this.fileId)
          : await fetchSopImage(this.sopId, this.revisionId, this.fileId)
        if (seq === this.sequence) this.url = URL.createObjectURL(blob)
      } catch (error) {
        if (seq === this.sequence) this.failed = true
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    }
  }
}
