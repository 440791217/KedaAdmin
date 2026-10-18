export default {
  name: 'UserTable',
  props: {
    list: { type: Array, required: true }, loading: Boolean,
    page: { type: Number, default: 1 }, limit: { type: Number, default: 10 },
    permissions: { type: Array, default: () => [] },
    currentUserId: { type: String, default: '' }, busyId: { type: String, default: '' }
  },
  methods: {
    can(permission) { return this.permissions.includes('*') || this.permissions.includes(permission) },
    other(row) { return !row.is_superuser && row.id !== this.currentUserId },
    actions(row) {
      if (row.is_superuser) return []
      const actions = []
      if (this.can('user:update')) actions.push({ command: 'edit', label: '编辑资料', icon: 'el-icon-edit-outline' })
      if (!this.other(row)) return actions
      if (this.can('user:status')) {
        actions.push(row.status === 1
          ? { command: 'disable', label: '禁用账号', icon: 'el-icon-lock', status: 0 }
          : { command: 'enable', label: '启用账号', icon: 'el-icon-unlock', status: 1 })
        if (row.status !== 2) actions.push({ command: 'depart', label: '设为离职', icon: 'el-icon-user', status: 2 })
      }
      if (this.can('user:reset-password')) actions.push({ command: 'reset', label: '重置密码', icon: 'el-icon-key' })
      if (this.can('user:delete')) actions.push({ command: 'delete', label: '删除用户', icon: 'el-icon-delete', danger: true })
      return actions
    },
    handleCommand(command, row) {
      if (this.busyId) return
      const action = this.actions(row).find(item => item.command === command)
      if (!action) return
      if (action.command === 'edit') this.$emit('edit', row)
      else if (action.status !== undefined) this.$emit('status-change', row, action.status)
      else this.$emit(action.command === 'reset' ? 'reset-password' : 'delete', row)
    },
    statusType(status) { return { 0: 'danger', 1: 'success', 2: 'info' }[status] || 'info' },
    statusText(status) { return { 0: '禁用', 1: '正常', 2: '离职' }[status] || '未知' }
  }
}
