<template>
  <div class="app-container">

    <div class="filter-container" style="margin-bottom: 20px;">
      <el-input
        v-model="listQuery.project_id"
        placeholder="项目编号"
        style="width: 140px; margin-right: 10px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />

      <el-input
        v-model="listQuery.project_name"
        placeholder="项目名"
        style="width: 180px; margin-right: 10px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />

      <el-input
        v-model="listQuery.manager_name"
        placeholder="负责人姓名"
        style="width: 130px; margin-right: 10px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />

      <el-input
        v-model="listQuery.job_num"
        placeholder="工号"
        style="width: 120px; margin-right: 10px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />

      <el-select
        v-model="listQuery.status"
        placeholder="项目状态"
        clearable
        style="width: 120px; margin-right: 10px;"
        class="filter-item"
      >
        <el-option label="进行中" :value="1" />
        <el-option label="已暂停" :value="0" />
        <el-option label="已归档" :value="2" />
      </el-select>

      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        查询
      </el-button>

      <el-button class="filter-item" style="margin-left: 10px;" type="success" icon="el-icon-plus" @click="handleCreate">
        新建项目
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      @sort-change="sortChange"
    >
      <el-table-column align="center" label="序号" width="70">
        <template slot-scope="scope">
          <span>{{ (listQuery.page - 1) * listQuery.limit + scope.$index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="项目编号" width="150">
        <template slot-scope="scope">
          <span style="font-family: monospace; font-weight: bold; color: #1890ff;">{{ scope.row.project_id }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="200" label="项目名称">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.project_name }}</span>
        </template>
      </el-table-column>

      <el-table-column width="110" align="center" label="负责人工号">
        <template slot-scope="scope">
          <el-tag size="medium" type="warning" effect="light">{{ scope.row.job_num }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="110" align="center" label="负责人姓名" prop="manager_name" />

      <el-table-column width="110" align="center" label="分总成数量">
        <template slot-scope="scope">
          <el-tag type="info" effect="plain">{{ scope.row.sub_assembly_count }} 个</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="90" align="center" label="状态">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter" size="small" effect="dark">
            {{ scope.row.status | statusText }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column min-width="180" label="项目描述" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.description || '-' }}
        </template>
      </el-table-column>

      <el-table-column width="160" align="center" label="创建时间" prop="created_at" sortable="custom">
        <template slot-scope="scope">
          <span>{{ scope.row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>

      <el-table-column width="160" align="center" label="最近修改时间" prop="updated_at" sortable="custom">
        <template slot-scope="scope">
          <span>{{ scope.row.updated_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="130" fixed="right">
        <template slot-scope="scope">
          <div class="operation-wrapper">
            <el-button type="primary" size="mini" icon="el-icon-edit-outline" class="op-btn" @click="handleEdit(scope.row)">
              查看/编辑
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" class="op-btn" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="dialogStatus === 'create' ? '新建项目' : '编辑项目'" :visible.sync="dialogFormVisible" width="550px">
      <el-form ref="dataForm" :model="tempForm" :rules="rules" label-position="left" label-width="100px">
        <el-form-item label="项目编号" prop="project_id">
          <el-input v-model="tempForm.project_id" placeholder="如: PRJ-2026-A101" />
        </el-form-item>
        <el-form-item label="项目名称" prop="project_name">
          <el-input v-model="tempForm.project_name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="负责人工号" prop="job_num">
              <el-input v-model="tempForm.job_num" placeholder="工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人姓名" prop="manager_name">
              <el-input v-model="tempForm.manager_name" placeholder="姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="分总成数量" prop="sub_assembly_count">
          <el-input-number v-model="tempForm.sub_assembly_count" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-radio-group v-model="tempForm.status">
            <el-radio-button :label="1">进行中</el-radio-button>
            <el-radio-button :label="0">已暂停</el-radio-button>
            <el-radio-button :label="2">已归档</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="tempForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          {{ dialogStatus === 'create' ? '确认创建' : '保存修改' }}
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchProjectList, createProject, updateProject, deleteProject } from '@/api/project'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'ProjectManagement',
  components: { Pagination },

  filters: {
    statusFilter(status) {
      const statusMap = {
        1: 'success',
        0: 'warning',
        2: 'info'
      }
      return statusMap[status] || 'info'
    },
    statusText(status) {
      const map = {
        1: '进行中',
        0: '已暂停',
        2: '已归档'
      }
      return map[status] || '未知'
    }
  },

  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      dialogStatus: 'create',
      editId: null,
      listQuery: {
        page: 1,
        limit: 20,
        project_id: '',
        project_name: '',
        manager_name: '',
        job_num: '',
        status: '',
        sort: '-created_at'
      },
      dialogFormVisible: false,
      tempForm: {
        project_id: '',
        project_name: '',
        job_num: '',
        manager_name: '',
        sub_assembly_count: 0,
        status: 1,
        description: ''
      },
      rules: {
        project_id: [{ required: true, message: '项目编号不能为空', trigger: 'blur' }],
        project_name: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
        job_num: [{ required: true, message: '负责人工号不能为空', trigger: 'blur' }],
        manager_name: [{ required: true, message: '负责人姓名不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      fetchProjectList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      }).catch(err => {
        this.listLoading = false
        console.error(err)
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetTempForm() {
      this.tempForm = {
        project_id: '',
        project_name: '',
        job_num: '',
        manager_name: '',
        sub_assembly_count: 0,
        status: 1,
        description: ''
      }
    },
    handleCreate() {
      this.resetTempForm()
      this.editId = null
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createProject(this.tempForm).then(() => {
            this.dialogFormVisible = false
            this.$message({
              type: 'success',
              message: '项目创建成功',
              duration: 2000
            })
            this.listQuery.page = 1
            this.getList()
          })
        }
      })
    },
    handleEdit(row) {
      this.editId = row.id
      this.tempForm = {
        project_id: row.project_id,
        project_name: row.project_name,
        job_num: row.job_num,
        manager_name: row.manager_name,
        sub_assembly_count: row.sub_assembly_count,
        status: row.status,
        description: row.description
      }
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          updateProject(this.editId, this.tempForm).then(() => {
            this.dialogFormVisible = false
            this.$message({
              type: 'success',
              message: '项目修改成功',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除项目【${row.project_name}】吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteProject(row.id).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
          if (this.listQuery.page > 1 && this.list.length === 1) {
            this.listQuery.page--
          }
          this.getList()
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    sortChange(data) {
      const { prop, order } = data
      if (!order) {
        this.listQuery.sort = undefined
      } else if (prop === 'created_at') {
        this.listQuery.sort = order === 'ascending' ? 'created_at' : '-created_at'
      } else if (prop === 'updated_at') {
        this.listQuery.sort = order === 'ascending' ? 'updated_at' : '-updated_at'
      }
      this.handleFilter()
    }
  }
}
</script>

<style scoped>
.operation-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}
.op-btn {
  width: 100px;
  margin-left: 0 !important;
}
</style>
