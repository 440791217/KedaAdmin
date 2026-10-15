
<template>
  <div class="app-container">
    <!-- 查询区域 -->
    <project-filter
      :query="listQuery"
      @search="handleFilter"
      @create="handleCreate"
    />

    <!-- 项目列表 -->
    <project-table
      :list="list"
      :loading="listLoading"
      :page="listQuery.page"
      :limit="listQuery.limit"
      @edit="handleEdit"
      @delete="handleDelete"
      @sort-change="sortChange"
    />

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 新建/编辑项目 -->
    <project-dialog
      :visible.sync="dialogFormVisible"
      :project="currentProject"
      @success="handleSaveSuccess"
    />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination/index.vue'

import ProjectFilter from './components/ProjectFilter.vue'
import ProjectTable from './components/ProjectTable.vue'
import ProjectDialog from './components/ProjectDialog.vue'

import {
  fetchProjectList,
  deleteProject as deleteProjectApi
} from '@/api/project'

export default {
  name: 'ProjectManagement',

  components: {
    Pagination,
    ProjectFilter,
    ProjectTable,
    ProjectDialog
  },

  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,

      dialogFormVisible: false,
      currentProject: null,

      listQuery: {
        page: 1,
        limit: 20,
        project_id: '',
        project_name: '',
        manager_name: '',
        job_num: '',
        status: '',
        sort: '-created_at'
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
        const response = await fetchProjectList({
          ...this.listQuery
        })

        const data = response.data

        this.list = data.items || []
        this.total = data.total || 0
      } catch (error) {
        console.error('获取项目列表失败:', error)

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
      this.currentProject = null
      this.dialogFormVisible = true
    },

    handleEdit(row) {
      this.currentProject = { ...row }
      this.dialogFormVisible = true
    },

    handleSaveSuccess(operation) {
      if (operation === 'create') {
        this.listQuery.page = 1
      }

      this.getList()
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除项目【${row.project_name}】吗？`,
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
        await deleteProjectApi(row.id)

        this.$message.success('删除成功')

        if (this.listQuery.page > 1 && this.list.length === 1) {
          this.listQuery.page--
        }

        this.getList()
      } catch (error) {
        console.error('删除项目失败:', error)
      }
    },

    sortChange(data) {
      const { prop, order } = data

      if (!order) {
        this.listQuery.sort = undefined
      } else if (prop === 'created_at') {
        this.listQuery.sort = order === 'ascending'
          ? 'created_at'
          : '-created_at'
      } else if (prop === 'updated_at') {
        this.listQuery.sort = order === 'ascending'
          ? 'updated_at'
          : '-updated_at'
      }

      this.handleFilter()
    }
  }
}
</script>
