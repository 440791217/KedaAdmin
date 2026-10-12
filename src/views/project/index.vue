<template>
  <div class="app-container">

    <div class="filter-container" style="margin-bottom: 20px;">
      <el-input
        v-model="listQuery.project_id"
        placeholder="项目ID"
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
        v-model="listQuery.manager"
        placeholder="管理者姓名"
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

      <el-table-column align="center" label="项目ID" width="140">
        <template slot-scope="scope">
          <span style="font-family: monospace; font-weight: bold; color: #1890ff;">{{ scope.row.project_id }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="180px" label="项目名">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.project_name }}</span>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="工号">
        <template slot-scope="scope">
          <el-tag size="medium" type="warning" effect="light">{{ scope.row.job_num }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="管理者">
        <template slot-scope="scope">
          <span>{{ scope.row.manager }}</span>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="分总成数量">
        <template slot-scope="scope">
          <el-tag type="info" effect="plain">{{ scope.row.sub_assembly_count }} 个</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="160px" align="center" label="创建时间" prop="created_at" sortable="custom">
        <template slot-scope="scope">
          <!-- 时间一行显示，原为两行，后续可改回 -->
          <span>{{ scope.row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>

      <el-table-column width="160px" align="center" label="最近修改时间" prop="updated_at" sortable="custom">
        <template slot-scope="scope">
          <!-- 时间一行显示，原为两行，后续可改回 -->
          <span>{{ scope.row.updated_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="130" fixed="right">
        <template slot-scope="scope">
          <div class="operation-wrapper">
            <el-button type="primary" size="mini" icon="el-icon-edit-outline" class="op-btn" @click="handleEdit(scope.row)">
              查看/编辑
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" class="op-btn" @click="handleDelete(scope.row, scope.$index)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog title="新建项目" :visible.sync="dialogFormVisible" width="500px">
      <el-form ref="dataForm" :model="tempForm" :rules="rules" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="项目ID">
          <el-input v-model="tempForm.project_id" disabled placeholder="系统自动生成" />
        </el-form-item>
        <el-form-item label="项目名称" prop="project_name">
          <el-input v-model="tempForm.project_name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="管理者姓名">
          <el-input v-model="tempForm.manager" disabled placeholder="系统自动获取" />
        </el-form-item>
        <el-form-item label="管理者工号">
          <el-input v-model="tempForm.job_num" disabled placeholder="系统自动获取" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="createData">确认创建</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { fetchProjectList, createProject, deleteProject } from '@/api/project'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'ProjectManagement',
  components: { Pagination },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        project_id: undefined,
        project_name: undefined,
        manager: undefined,
        job_num: undefined,
        sort: '-created_at'
      },
      dialogFormVisible: false,
      tempForm: {
        project_id: '',
        project_name: '',
        manager: '',
        job_num: ''
      },
      rules: {
        project_name: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }]
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
        manager: '',
        job_num: ''
      }
    },
    handleCreate() {
      this.resetTempForm()
      this.tempForm.manager = '张兵'
      this.tempForm.job_num = 'KD-0842'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const payload = {
            project_name: this.tempForm.project_name
          }
          createProject(payload).then(response => {
            this.dialogFormVisible = false
            this.$message({
              type: 'success',
              message: '项目创建成功',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    handleEdit(row) {
      console.log('点击的行数据:', row)
      console.log('project_id:', row.project_id)
      this.$router.push(`/production_management/project/edit/${row.project_id}`)
    },
    handleDelete(row, index) {
      this.$confirm(`确定要删除项目【${row.project_name}】吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteProject(row.project_id).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
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
