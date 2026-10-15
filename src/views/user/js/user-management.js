import Pagination from '@/components/Pagination/index.vue'

import UserFilter from '../components/UserFilter.vue'
import UserTable from '../components/UserTable.vue'
import UserDialog from '../components/UserDialog.vue'

import {
  fetchUserList,
  deleteUser as deleteUserApi,
  updateUserStatus as updateUserStatusApi
} from '@/api/user'

export default {
  name: 'UserManagement',

  components: {
    Pagination,
    UserFilter,
    UserTable,
    UserDialog
  },

  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,

      dialogFormVisible: false,
      currentUser: null,

      listQuery: {
        page: 1,
        limit: 10,
        username: '',
        real_name: '',
        card_number: '',
        shift_group: '',
        status: ''
      }
    }
  },

  created() {
    this.getList()
  },

  methods: {
    async getList() {
      this.listLoading = true

      try {
        const response = await fetchUserList({
          ...this.listQuery
        })

        const data = response.data

        this.list = data.items || []
        this.total = data.total || 0
      } catch (error) {
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    handleCreate() {
      this.currentUser = null
      this.dialogFormVisible = true
    },

    handleEdit(row) {
      this.currentUser = { ...row }
      this.dialogFormVisible = true
    },

    handleSaveSuccess(type) {
      if (type === 'create') {
        this.listQuery.page = 1
      }

      this.getList()
    },

    async handleStatusChange(row, targetStatus) {
      const action = targetStatus === 1 ? '启用' : '禁用'

      try {
        await this.$confirm(
          `确定要${action}用户【${row.real_name}】吗？`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (error) {
        return
      }

      try {
        await updateUserStatusApi(row.id, targetStatus)

        this.$message.success(`用户已${action}`)
        this.getList()
      } catch (error) {
        // 请求错误交由项目原有的 request.js 处理
      }
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除用户【${row.real_name}】吗？`,
          '提示',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (error) {
        return
      }

      try {
        await deleteUserApi(row.id)

        if (this.listQuery.page > 1 && this.list.length === 1) {
          this.listQuery.page--
        }

        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        // 请求错误交由项目原有的 request.js 处理
      }
    }
  }
}
