import { changePassword } from '@/api/user'

export default {
  name: 'ChangePassword',
  data() {
    return {
      saving: false,
      form: { old_password: '', new_password: '', confirm: '' },
      rules: {
        old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        new_password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 8, max: 128, message: '新密码长度为8至128个字符', trigger: 'blur' }
        ],
        confirm: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: (rule, value, callback) => {
            callback(value === this.form.new_password ? undefined : new Error('两次输入的新密码不一致'))
          }, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    mustChange() {
      return this.$store.getters.must_change_password
    }
  },
  methods: {
    submit() {
      if (this.saving) return
      this.$refs.passwordForm.validate(async valid => {
        if (!valid) return
        this.saving = true
        try {
          await changePassword({ old_password: this.form.old_password, new_password: this.form.new_password })
          await this.$store.dispatch('user/resetToken')
          this.$message.success('密码已修改，请使用新密码登录')
          await this.$router.replace('/login')
        } catch (error) {
          if (!error.reported && error.name !== 'NavigationDuplicated') this.$message.error(error.message || '修改失败')
        } finally {
          this.saving = false
        }
      })
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      await this.$router.replace('/login')
    }
  }
}
