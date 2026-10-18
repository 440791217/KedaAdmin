import {
  fetchSop,
  fetchSopVersions,
  fetchSopOwners,
  editSop,
  transferSopOwner,
  copySopDraft,
  discardSopDraft,
  publishSopVersion,
  retireSopVersion
} from '@/api/sop'
export default {
  name: 'SopDetail',
  data() {
    return {
      document: null,
      versions: [],
      loading: false,
      failed: false,
      busy: false,
      sequence: 0,
      labels: ['草稿', '已发布', '已停用'],
      ownerDialog: false,
      owners: [],
      nextOwner: '',
      ownerSeq: 0
    }
  },
  computed: {
    sopId() {
      return this.$route.params.sopId
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
    ++this.ownerSeq
  },
  methods: {
    async load() {
      const seq = ++this.sequence
      const id = this.sopId
      this.loading = true
      this.failed = false
      try {
        const [d, v] = await Promise.all([fetchSop(id), fetchSopVersions(id)])
        if (seq === this.sequence) {
          this.document = d.data
          this.versions = v.data
        }
      } catch (error) {
        if (seq === this.sequence) {
          this.document = null
          this.failed = true
        }
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    async command(action, row) {
      if (this.busy) return
      const base = `/sop/${this.sopId}/version/${row.id}`
      if (action === 'preview' || action === 'edit') { return this.$router.push({ path: base + (action === 'edit' ? '/edit' : '/preview'), query: this.$route.query || {}}) }
      this.busy = true
      try {
        try {
          await this.$confirm(
            {
              copy: '复制为新的独立草稿？',
              publish: '确认发布？发布后内容不可修改。',
              retire: '确认停用？停用后不能建立新关联。',
              discard: '确认放弃草稿？'
            }[action],
            '操作确认',
            { type: 'warning' }
          )
        } catch (error) {
          return
        }
        if (action === 'copy') {
          const { data } = await copySopDraft(this.sopId, row.id, this.document.version)
          await this.$router.push({ path: `/sop/${this.sopId}/version/${data.id}/edit`, query: this.$route.query || {}})
          return
        }
        if (action === 'publish') await publishSopVersion(this.sopId, row.id, row.version)
        else if (action === 'retire') await retireSopVersion(this.sopId, row.id, row.version)
        else await discardSopDraft(this.sopId, row.id, row.version)
        this.$message.success('操作成功')
        await this.load()
      } catch (error) {
        await this.load()
      } finally {
        this.busy = false
      }
    },
    async metadata(action) {
      if (this.busy) return
      if (action === 'owner') {
        this.nextOwner = ''
        this.ownerDialog = true
        return this.searchOwners('')
      }
      try {
        const { value } = await this.$prompt('目录名称不会改变已发布版本标题。', '修改名称', {
          inputValue: this.document.name,
          inputValidator: (value) => !!value && !!value.trim() && value.trim().length <= 128
        })
        await editSop(this.sopId, { name: value.trim(), version: this.document.version })
        await this.load()
      } catch (error) {
        /* cancellation or reported error */
      }
    },
    async searchOwners(keyword) {
      const seq = ++this.ownerSeq
      try {
        const { data } = await fetchSopOwners(this.document.managing_project_id, keyword)
        if (seq === this.ownerSeq) { this.owners = data.filter((user) => user.id !== this.document.owner_user_id) }
      } catch (error) {
        /* reported */
      }
    },
    async transfer() {
      if (this.busy || !this.nextOwner) return
      this.busy = true
      try {
        await transferSopOwner(this.sopId, { owner_user_id: this.nextOwner, version: this.document.version })
        this.ownerDialog = false
        this.$message.success('已交接')
        await this.load()
      } catch (error) {
        if (error.code === 409) {
          this.ownerDialog = false
          await this.load()
        }
      } finally {
        this.busy = false
      }
    }
  }
}
