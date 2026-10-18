import { createBusinessCode } from '@/utils/business_code'
import { fetchSopProjects, fetchSopOwners, createSop } from '@/api/sop'
export default {
  name: 'CreateSopDialog',
  props: { visible: Boolean, defaultProjectId: { type: String, default: '' }},
  data() {
    return {
      form: {},
      projects: [],
      owners: [],
      busy: false,
      projectLoading: false,
      ownerLoading: false,
      projectSeq: 0,
      ownerSeq: 0,
      rules: {
        code: [{ required: true, message: '编号生成失败，请重新打开新建窗口' }],
        name: [{ required: true, whitespace: true, message: '请输入名称' }],
        managing_project_id: [{ required: true, message: '请选择管理项目' }],
        owner_user_id: [{ required: true, message: '请选择负责人' }]
      }
    }
  },
  watch: {
    visible(value) {
      if (!value) {
        ++this.projectSeq
        ++this.ownerSeq
      }
    }
  },
  beforeDestroy() {
    ++this.projectSeq
    ++this.ownerSeq
  },
  methods: {
    init() {
      this.form = { code: createBusinessCode('SOP'), name: '', managing_project_id: '', owner_user_id: '' }
      this.owners = []
      this.$nextTick(() => this.$refs.form.clearValidate())
      this.searchProjects('')
      if (this.defaultProjectId) { this.form.managing_project_id = this.defaultProjectId; this.searchOwners('') }
    },
    close(v) {
      if (!this.busy) this.$emit('update:visible', v)
    },
    async searchProjects(keyword) {
      const seq = ++this.projectSeq
      this.projectLoading = true
      try {
        const { data } = await fetchSopProjects(keyword)
        if (seq === this.projectSeq) { this.projects = data; if (this.defaultProjectId && !data.some(p => p.id === this.defaultProjectId)) this.projects.push({ id: this.defaultProjectId, name: '当前项目', code: this.defaultProjectId }) }
      } catch (error) {
        /* reported */
      } finally {
        if (seq === this.projectSeq) this.projectLoading = false
      }
    },
    projectChanged() {
      ++this.ownerSeq
      this.form.owner_user_id = ''
      this.owners = []
      this.searchOwners('')
    },
    async searchOwners(keyword) {
      const seq = ++this.ownerSeq
      this.ownerLoading = true
      try {
        const { data } = await fetchSopOwners(this.form.managing_project_id, keyword)
        if (seq === this.ownerSeq) this.owners = data
      } catch (error) {
        /* reported */
      } finally {
        if (seq === this.ownerSeq) this.ownerLoading = false
      }
    },
    async save() {
      if (this.busy) return
      this.busy = true
      try {
        this.form.name = this.form.name.trim()
        if (!(await this.$refs.form.validate().catch(() => false))) return
        const { data } = await createSop({ code: this.form.code, name: this.form.name, managing_project_id: this.form.managing_project_id, owner_user_id: this.form.owner_user_id })
        this.$message.success('SOP已创建')
        this.$emit('update:visible', false)
        this.$emit('created', data)
      } catch (error) {
        /* reported */
      } finally {
        this.busy = false
      }
    }
  }
}
