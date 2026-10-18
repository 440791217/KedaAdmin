export default {
  name: 'LoginForm',
  data() {
    return {
      loginForm: { account: '', password: '' },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      loginRules: {
        account: [
          { required: true, whitespace: true, message: '请输入账号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, max: 128, message: '密码长度为8至128个字符', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    this.$refs.account.focus()
  },
  methods: {
    checkCapslock(event) {
      this.capsTooltip = event.getModifierState
        ? event.getModifierState('CapsLock')
        : Boolean(event.key && event.key.length === 1 && event.key >= 'A' && event.key <= 'Z')
    },
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password'
      this.$nextTick(() => this.$refs.password.focus())
    },
    handleLogin() {
      if (this.loading) return
      this.$refs.loginForm.validate(async valid => {
        if (!valid) return
        this.loading = true
        try {
          const data = await this.$store.dispatch('user/login', this.loginForm)
          const redirect = this.$route.query.redirect
          const safeRedirect = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
          await this.$router.replace(data.must_change_password ? '/change-password' : (safeRedirect ? redirect : '/'))
        } catch (error) {
          if (!error.reported && error.name !== 'NavigationDuplicated') {
            this.$message.error(error.message || '登录失败')
          }
        } finally {
          this.loading = false
        }
      })
    }
  }
}
