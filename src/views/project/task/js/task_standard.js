import { fetchSopVersion } from '@/api/sop'
import { previewTask } from '@/api/resource'
import AnnotatedImage from '@/shared/sop/components/AnnotatedImage.vue'
export default {
  name: 'TaskStandard',
  components: { AnnotatedImage },
  props: {
    projectId: { type: String, required: true },
    subprojectId: { type: String, required: true },
    taskId: { type: String, default: '' },
    sopId: { type: String, default: '' },
    revisionId: { type: String, default: '' }
  },
  data() {
    return { loading: false, failed: false, revision: null, sequence: 0 }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
  },
  watch: {
    taskId() {
      this.load()
    }
  },
  methods: {
    async load() {
      const seq = ++this.sequence
      this.loading = true
      this.failed = false
      this.revision = null
      try {
        const { data } = this.sopId && this.revisionId ? await fetchSopVersion(this.sopId, this.revisionId) : await previewTask(
          this.projectId,
          this.subprojectId,
          this.taskId
        )
        if (seq === this.sequence) this.revision = data
      } catch (e) {
        if (seq === this.sequence) this.failed = true
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    }
  }
}
