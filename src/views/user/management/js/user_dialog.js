import { createUser, updateUser } from '@/api/user'
import { createDefaultUserForm, createUserRules, createUserPayload, updateUserPayload } from './user_form'

export default {
  name: 'UserDialog',
  props: {
    visible: Boolean, user: { type: Object, default: null },
    teams: { type: Array, default: () => [] }, roles: { type: Array, default: () => [] },
    permissions: { type: Array, default: () => [] }, currentUserId: { type: String, default: '' }
  },
  data() { return { form: createDefaultUserForm(), submitting: false } },
  computed: {
    isCreate() { return !this.user },
    rules() { return createUserRules(this.isCreate, this.form) },
    canAssign() {
      return (this.permissions.includes('*') || this.permissions.includes('user:assign-role')) &&
        (this.isCreate || this.user.id !== this.currentUserId)
    },
    roleOptions() {
      const options = this.roles.map(role => ({ ...role, disabled: false }))
      for (const role of (this.user && this.user.roles) || []) {
        if (!options.some(option => option.id === role.id)) options.push({ ...role, disabled: true })
      }
      return options
    }
  },
  methods: {
    initForm() {
      this.form = { ...createDefaultUserForm(), ...(this.user || {}), password: '', confirmPassword: '' }
      for (const key of ['card_number', 'team_id', 'phone', 'avatar_url']) this.form[key] = this.form[key] || ''
      this.form.role_ids = [...((this.user && this.user.role_ids) || [])]
      this.$nextTick(() => this.$refs.userForm && this.$refs.userForm.clearValidate())
    },
    handleClose() { this.form = createDefaultUserForm(); this.submitting = false },
    submitForm() {
      if (this.submitting) return
      this.$refs.userForm.validate(async valid => {
        if (!valid) return
        this.submitting = true
        const operation = this.isCreate ? 'create' : 'edit'
        try {
          if (this.isCreate) await createUser(createUserPayload(this.form, this.canAssign))
          else await updateUser(this.user.id, updateUserPayload(this.form, this.canAssign))
          this.$message.success(this.isCreate ? '用户创建成功，首次登录需修改密码' : '用户资料已保存')
          this.$emit('update:visible', false)
          this.$emit('success', operation)
        } catch (error) {
          if (error.code === 409) {
            this.$emit('update:visible', false)
            this.$emit('refresh')
          }
        } finally { this.submitting = false }
      })
    }
  }
}
