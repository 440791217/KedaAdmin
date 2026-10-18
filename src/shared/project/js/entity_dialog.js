import { fetchOwnerOptions, fetchSubOwnerOptions, createProject, updateProject, createSubproject, updateSubproject } from '@/api/project'
import { createBusinessCode } from '@/utils/business_code'
import { entityPayload } from '@/shared/project/js/project_helpers'
export default {
  name: 'EntityDialog',
  props: { visible: Boolean, entity: { type: Object, default: null }, projectId: { type: String, default: '' }},
  data() {
    return { form: {}, owners: [], ownersLoading: false, saving: false, searchSequence: 0,
      rules: {
        code: [{ required: true, message: '编号生成失败，请重新打开新建窗口' }],
        name: [{ required: true, whitespace: true, message: '请填写名称', trigger: 'blur' }],
        owner_user_id: [{ required: true, message: '请选择负责人', trigger: 'change' }]
      }}
  },
  computed: { canEditProfile() { return !this.entity || this.entity.can_edit !== false } },
  watch: {
    visible(value) { if (!value) { ++this.searchSequence; this.ownersLoading = false } }
  },
  beforeDestroy() { ++this.searchSequence },
  methods: {
    initForm() {
      ++this.searchSequence
      this.form = { code: this.entity ? this.entity.code : createBusinessCode(this.projectId ? 'SUB' : 'PRJ'), name: '', customer_name: '', description: '', owner_user_id: '', ...this.entity }
      this.owners = this.entity ? [{ id: this.entity.owner_user_id, real_name: this.entity.owner_name, username: this.entity.owner_username }] : []
      this.$nextTick(() => this.$refs.form.clearValidate())
      if (!this.entity) this.searchOwners('')
    },
    close(value) { if (!this.saving) this.$emit('update:visible', value) },
    async searchOwners(keyword) {
      const sequence = ++this.searchSequence
      this.ownersLoading = true
      try {
        const response = this.projectId ? await fetchSubOwnerOptions(this.projectId, keyword) : await fetchOwnerOptions(keyword)
        if (sequence !== this.searchSequence) return
        const selected = this.owners.find(item => item.id === this.form.owner_user_id)
        this.owners = response.data || []
        if (selected && !this.owners.some(item => item.id === selected.id)) this.owners.unshift(selected)
      } catch (error) { /* request interceptor reports errors */ } finally { if (sequence === this.searchSequence) this.ownersLoading = false }
    },
    async changeOwner() {
      if (this.saving || !this.entity || !this.entity.can_transfer_owner) return
      const dirty = ['name', 'description', 'customer_name'].some(key => (this.form[key] || '') !== (this.entity[key] || ''))
      if (dirty) { try { await this.$confirm('当前资料尚未保存，离开编辑并调整负责人？未保存的资料修改将放弃。', '调整负责人', { type: 'warning' }) } catch (e) { return } }
      this.$emit('update:visible', false); this.$emit('transfer-owner', this.entity)
    },
    async save() {
      if (this.saving || !this.canEditProfile) return
      this.saving = true
      try {
        this.form.name = (this.form.name || '').trim()
        if (!await this.$refs.form.validate().catch(() => false)) return
        const data = entityPayload(this.form, !this.entity, !!this.projectId)
        if (this.projectId) {
          if (this.entity) await updateSubproject(this.projectId, this.entity.id, data)
          else await createSubproject(this.projectId, data)
        } else if (this.entity) await updateProject(this.entity.id, data)
        else await createProject(data)
        this.$message.success('保存成功')
        this.$emit('update:visible', false)
        this.$emit('saved', { created: !this.entity })
      } catch (error) {
        if (error.code === 409 && this.entity) { this.$emit('update:visible', false); this.$emit('stale') }
      } finally { this.saving = false }
    }
  }
}
