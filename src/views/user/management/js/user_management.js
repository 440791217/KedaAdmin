import Pagination from '@/components/Pagination/index.vue'
import UserFilter from '../components/UserFilter.vue'
import UserTable from '../components/UserTable.vue'
import UserDialog from '../components/UserDialog.vue'
import {
  fetchUserList, fetchUser, fetchTeamOptions, fetchRoleOptions,
  deleteUser, updateUserStatus, resetUserPassword
} from '@/api/user'

export default {
  name: 'UserManagement',
  components: { Pagination, UserFilter, UserTable, UserDialog },
  data() {
    return {
      list: [], total: 0, listLoading: false, busyId: '',
      teams: [], roles: [], dialogFormVisible: false, currentUser: null,
      listQuery: { page: 1, limit: 10, username: '', real_name: '', card_number: '', team_id: '', status: '' }
    }
  },
  computed: {
    currentUserId() { return this.$store.getters.user_id },
    permissions() { return this.$store.getters.is_superuser ? ['*'] : this.$store.getters.permissions || [] }
  },
  created() {
    if (this.can('user:list')) {
      this.getList()
      this.loadOptions().catch(() => { /* 请求拦截器已显示错误 */ })
    }
  },
  methods: {
    can(permission) { return this.permissions.includes('*') || this.permissions.includes(permission) },
    async loadOptions() {
      const { data } = await fetchTeamOptions()
      this.teams = data
      if (this.can('user:create') || this.can('user:assign-role')) {
        const response = await fetchRoleOptions()
        this.roles = response.data
      }
    },
    async getList() {
      this.listLoading = true
      try {
        const { data } = await fetchUserList(this.listQuery)
        this.list = data.items
        this.total = data.total
      } catch (error) {
        this.list = []
        this.total = 0
      } finally { this.listLoading = false }
    },
    handleFilter() { this.listQuery.page = 1; this.getList() },
    handleCreate() { this.currentUser = null; this.dialogFormVisible = true },
    async handleEdit(row) {
      if (row.is_superuser) return
      try {
        const { data } = await fetchUser(row.id)
        this.currentUser = data
        this.dialogFormVisible = true
      } catch (error) { /* 请求拦截器显示错误 */ }
    },
    async handleSaveSuccess(type) {
      if (type === 'create') this.listQuery.page = 1
      if (this.currentUser && this.currentUser.id === this.currentUserId) await this.$store.dispatch('user/getInfo')
      this.getList()
    },
    async handleStatusChange(row, status) {
      if (this.busyId) return
      const label = { 0: '禁用', 1: '启用', 2: '设为离职' }[status]
      try {
        await this.$confirm(`确定要${label}用户【${row.real_name}】吗？`, '提示', { type: 'warning' })
      } catch (error) { return }
      this.busyId = row.id
      try {
        await updateUserStatus(row.id, status, row.version)
        this.$message.success('状态已更新')
      } catch (error) { /* 包含409冲突时，刷新列表取得最新版本 */ } finally {
        this.busyId = ''
        this.getList()
      }
    },
    async handleDelete(row) {
      if (this.busyId) return
      try {
        await this.$confirm(`确定要删除用户【${row.real_name}】吗？历史记录会保留。`, '提示', { type: 'warning' })
      } catch (error) { return }
      this.busyId = row.id
      try {
        await deleteUser(row.id, row.version)
        if (this.listQuery.page > 1 && this.list.length === 1) this.listQuery.page--
        this.$message.success('删除成功')
      } catch (error) { /* 请求拦截器显示错误 */ } finally {
        this.busyId = ''
        this.getList()
      }
    },
    async handleResetPassword(row) {
      if (this.busyId) return
      let result
      try {
        result = await this.$prompt('设置8至128字符的新密码；该用户下次登录需修改密码。', '重置密码', {
          inputType: 'password',
          inputValidator: value => Boolean(value && value.trim() && value.length >= 8 && value.length <= 128) || '密码长度为8至128个字符'
        })
      } catch (error) { return }
      this.busyId = row.id
      try {
        await resetUserPassword(row.id, result.value, row.version)
        this.$message.success('密码已重置，原登录会话已失效')
      } catch (error) { /* 请求拦截器显示错误 */ } finally {
        this.busyId = ''
        this.getList()
      }
    }
  }
}
