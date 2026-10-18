import {
  fetchSopBindings,
  fetchBindableSops,
  fetchSopVersions,
  saveSopBinding,
  unbindSop,
  sortSopBindings
} from '@/api/sop'
export default {
  name: 'SopBindings',
  props: { projectId: { type: String, required: true }, subprojectId: { type: String, default: '' }},
  data() {
    return {
      items: [],
      targetVersion: 0,
      canManage: false,
      loading: false,
      failed: false,
      busy: false,
      sequence: 0,
      searchSequence: 0,
      versionSequence: 0,
      dialog: false,
      selected: null,
      form: { sop_id: '', revision_id: '' },
      options: [],
      versions: [],
      searching: false,
      versionsLoading: false
    }
  },
  computed: {
    active() {
      return this.items.filter((row) => row.status === 1)
    },
    identity() {
      return `${this.projectId}:${this.subprojectId}`
    }
  },
  watch: {
    identity() {
      this.dialog = false
      ++this.searchSequence
      ++this.versionSequence
      this.load()
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
    ++this.searchSequence
    ++this.versionSequence
  },
  methods: {
    accept(data) {
      this.items = data.items
      this.targetVersion = data.target_version
      this.canManage = data.can_manage
    },
    async load() {
      const seq = ++this.sequence
      this.loading = true
      this.failed = false
      try {
        const { data } = await fetchSopBindings(this.projectId, this.subprojectId)
        if (seq === this.sequence) this.accept(data)
      } catch (error) {
        if (seq === this.sequence) {
          this.items = []
          this.canManage = false
          this.failed = true
        }
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    close(done) {
      if (!this.busy) done()
    },
    async open(row) {
      ++this.searchSequence
      ++this.versionSequence
      this.searching = false
      this.versionsLoading = false
      this.selected = row
      this.form = { sop_id: row ? row.sop_id : '', revision_id: '' }
      this.options = row ? [{ id: row.sop_id, code: row.code, name: row.title }] : []
      this.versions = []
      this.dialog = true
      if (row) await this.choose(row.sop_id)
      else await this.search('')
    },
    async search(keyword) {
      const seq = ++this.searchSequence
      this.searching = true
      try {
        const { data } = await fetchBindableSops(this.projectId, this.subprojectId, keyword)
        if (seq === this.searchSequence) this.options = data
      } catch (error) {
        if (seq === this.searchSequence) this.options = []
      } finally {
        if (seq === this.searchSequence) this.searching = false
      }
    },
    async choose(id) {
      const seq = ++this.versionSequence
      this.form.revision_id = ''
      this.versions = []
      this.versionsLoading = true
      try {
        const { data } = await fetchSopVersions(id)
        if (seq === this.versionSequence) {
          this.versions = data.filter((v) => v.status === 1)
          if (this.selected && this.versions.some((v) => v.id === this.selected.revision_id)) { this.form.revision_id = this.selected.revision_id }
        }
      } catch (error) {
        /* reported */
      } finally {
        if (seq === this.versionSequence) this.versionsLoading = false
      }
    },
    async save() {
      if (this.busy || !this.form.revision_id || this.versionsLoading) return
      const existing = this.selected || this.items.find((row) => row.sop_id === this.form.sop_id)
      await this.mutate(
        () =>
          saveSopBinding(this.projectId, this.subprojectId, existing && existing.id, {
            ...this.form,
            target_version: this.targetVersion,
            ...(existing ? { version: existing.version } : {})
          }),
        '关联已保存'
      )
    },
    async mutate(operation, message) {
      if (this.busy) return
      this.busy = true
      const identity = this.identity
      try {
        const { data } = await operation()
        if (identity !== this.identity) return
        this.accept(data)
        this.dialog = false
        this.$message.success(message)
        this.$emit('changed')
      } catch (error) {
        if (identity === this.identity && error.code === 409) {
          this.dialog = false
          await this.load()
          this.$emit('changed')
        }
      } finally {
        this.busy = false
      }
    },
    async command(action, row) {
      if (this.busy) return
      if (action === 'preview') {
        return this.$router.push({
          name: 'BoundSopPreview',
          query: {
            project_id: this.projectId,
            ...(this.subprojectId ? { subproject_id: this.subprojectId } : {}),
            binding_id: row.id
          }
        })
      }
      if (action === 'change') return this.open(row)
      const identity = this.identity
      try {
        await this.$confirm(`解绑“${row.title}”？解绑后项目不再通过此关联查看标准。`, '解绑确认', {
          type: 'warning'
        })
      } catch (error) {
        return
      }
      if (identity === this.identity) {
        await this.mutate(
          () => unbindSop(this.projectId, this.subprojectId, row.id, row.version, this.targetVersion),
          '已解绑'
        )
      }
    },
    async move(row, direction) {
      const rows = this.active.slice()
      const i = rows.indexOf(row)
      const j = i + direction
      if (i < 0 || j < 0 || j >= rows.length) return
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
      await this.mutate(
        () =>
          sortSopBindings(
            this.projectId,
            this.subprojectId,
            rows.map((x) => x.id),
            this.targetVersion
          ),
        '顺序已保存'
      )
    }
  }
}
