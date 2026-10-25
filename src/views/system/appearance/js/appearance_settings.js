import ThemePicker from '@/components/ThemePicker'

export default {
  name: 'AppearanceSettings',
  components: { ThemePicker },
  data() {
    return { saving: false, failed: false }
  },
  created() {
    this.reload()
  },
  computed: {
    fixedHeader: {
      get() {
        return this.$store.state.settings.fixedHeader
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'fixedHeader',
          value: val
        })
      }
    },
    tagsView: {
      get() {
        return this.$store.state.settings.tagsView
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'tagsView',
          value: val
        })
      }
    },
    sidebarLogo: {
      get() {
        return this.$store.state.settings.sidebarLogo
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'sidebarLogo',
          value: val
        })
      }
    }
  },
  methods: {
    async reload() {
      this.failed = false
      try {
        await this.$store.dispatch('settings/loadSystemDefaults')
      } catch (error) {
        this.failed = true
      }
    },
    async save() {
      if (this.saving) return
      this.saving = true
      try {
        await this.$store.dispatch('settings/saveSystemDefaults')
        this.$message.success('系统页面参数已保存')
      } catch (error) {
        // Request interceptor reports validation and version errors.
      } finally {
        this.saving = false
      }
    },
    themeChange(val) {
      this.$store.dispatch('settings/changeSetting', {
        key: 'theme',
        value: val
      })
    }
  }
}
