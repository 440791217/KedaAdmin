import AnnotatedImage from '@/shared/sop/components/AnnotatedImage.vue'
import { fetchSopVersion, previewBoundSop } from '@/api/sop'
export default {
  name: 'SopPreview',
  components: { AnnotatedImage },
  data() {
    return { revision: null, loading: false, failed: false, sequence: 0 }
  },
  computed: {
    bound() {
      return this.$route.name === 'BoundSopPreview'
    },
    imageContext() {
      const q = this.$route.query
      return this.bound
        ? { projectId: q.project_id, subprojectId: q.subproject_id || '', bindingId: q.binding_id }
        : { sopId: this.$route.params.sopId, revisionId: this.$route.params.revisionId }
    }
  },
  watch: {
    '$route.fullPath'() {
      this.load()
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
  },
  methods: {
    back() {
      const q = this.$route.query
      if (!this.bound && q.task_id) return this.$router.push({ path: `/sop/${this.$route.params.sopId}/version/${this.$route.params.revisionId}/edit`, query: q })
      this.$router.push(
        this.bound
          ? `/project/${q.project_id}${q.subproject_id ? `/subproject/${q.subproject_id}` : ''}`
          : `/sop/${this.$route.params.sopId}`
      )
    },
    async load() {
      const seq = ++this.sequence
      this.loading = true
      this.failed = false
      this.revision = null
      try {
        const q = this.$route.query
        if (
          this.bound &&
          ![q.project_id, q.binding_id, q.subproject_id || '1'].every(
            (x) => typeof x === 'string' && /^[1-9][0-9]*$/.test(x)
          )
        ) { throw new Error('Invalid context') }
        const response = this.bound
          ? await previewBoundSop(q.project_id, q.subproject_id || '', q.binding_id)
          : await fetchSopVersion(this.$route.params.sopId, this.$route.params.revisionId)
        if (seq === this.sequence) this.revision = response.data
      } catch (error) {
        if (seq === this.sequence) this.failed = true
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    }
  }
}
