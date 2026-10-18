import { fetchProjectList, fetchSubprojects } from '@/api/project'
import { fetchSopBindings, saveSopBinding } from '@/api/sop'
export default {
  name: 'ProjectAssociation',
  props: {
    visible: Boolean,
    document: { type: Object, required: true },
    revision: { type: Object, required: true }
  },
  data() {
    return {
      projectId: '',
      subId: '',
      projects: [],
      children: [],
      target: null,
      busy: false,
      loading: false,
      sequence: 0,
      searchSequence: 0
    }
  },
  watch: {
    visible(value) {
      if (!value) {
        ++this.sequence
        ++this.searchSequence
      }
    }
  },
  beforeDestroy() {
    ++this.sequence
    ++this.searchSequence
  },
  methods: {
    init() {
      this.projectId = ''
      this.subId = ''
      this.target = null
      this.children = []
      this.search('')
    },
    close(v) {
      if (!this.busy) this.$emit('update:visible', v)
    },
    async search(keyword) {
      const seq = ++this.searchSequence
      try {
        const { data } = await fetchProjectList({ page: 1, limit: 50, keyword })
        if (seq === this.searchSequence) this.projects = data.items
      } catch (error) {
        /* reported */
      }
    },
    async projectChanged() {
      this.subId = ''
      this.children = []
      const id = this.projectId
      this.loadTarget()
      try {
        const { data } = await fetchSubprojects(id)
        if (this.projectId === id) this.children = data
      } catch (error) {
        /* reported */
      }
    },
    async loadTarget() {
      const seq = ++this.sequence
      this.target = null
      this.loading = true
      try {
        const { data } = await fetchSopBindings(this.projectId, this.subId)
        if (seq === this.sequence) this.target = data
      } catch (error) {
        /* reported */
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    async save() {
      if (this.busy || this.loading || !this.target || !this.target.can_manage) return
      this.busy = true
      try {
        const old = this.target.items.find((row) => row.sop_id === this.document.id)
        if (old) {
          try {
            await this.$confirm('已有该SOP关联，确认切换或恢复为当前版本？', '更新关联', { type: 'warning' })
          } catch (error) {
            return
          }
        }
        await saveSopBinding(this.projectId, this.subId, old && old.id, {
          sop_id: this.document.id,
          revision_id: this.revision.id,
          target_version: this.target.target_version,
          ...(old ? { version: old.version } : {})
        })
        this.$message.success('已关联当前发布版本')
        this.$emit('update:visible', false)
      } catch (error) {
        if (error.code === 409) await this.loadTarget()
      } finally {
        this.busy = false
      }
    }
  }
}
