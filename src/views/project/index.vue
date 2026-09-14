<template>
  <div class="app-container">

    <div class="filter-container" style="margin-bottom: 20px;">
      <el-input
        v-model="listQuery.projectId"
        placeholder="项目ID"
        style="width: 140px; margin-right: 10px;"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
      />

      <el-input
        v-model="listQuery.projectName"
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
        v-model="listQuery.jobNum"
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
          <span style="font-family: monospace; font-weight: bold; color: #1890ff;">{{ scope.row.projectId }}</span>
        </template>
      </el-table-column>

      <el-table-column min-width="180px" label="项目名">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.projectName }}</span>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="工号">
        <template slot-scope="scope">
          <el-tag size="medium" type="warning" effect="light">{{ scope.row.jobNum }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="管理者">
        <template slot-scope="scope">
          <span>{{ scope.row.manager }}</span>
        </template>
      </el-table-column>

      <el-table-column width="110px" align="center" label="分总成数量">
        <template slot-scope="scope">
          <el-tag type="info" effect="plain">{{ scope.row.subAssemblyCount }} 个</el-tag>
        </template>
      </el-table-column>

      <el-table-column width="120px" align="center" label="创建时间" prop="gmt_create" sortable="custom">
        <template slot-scope="scope">
          <div class="time-column-wrap">
            <span class="time-date">{{ scope.row.createTime | parseTime('{y}-{m}-{d}') }}</span>
            <br>
            <span class="time-clock">{{ scope.row.createTime | parseTime('{h}:{i}:{s}') }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column width="120px" align="center" label="最近修改时间" prop="gmt_modified" sortable="custom">
        <template slot-scope="scope">
          <div class="time-column-wrap">
            <span class="time-date">{{ scope.row.updateTime | parseTime('{y}-{m}-{d}') }}</span>
            <br>
            <span class="time-clock">{{ scope.row.updateTime | parseTime('{h}:{i}:{s}') }}</span>
          </div>
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
          <el-input v-model="tempForm.projectId" disabled placeholder="系统自动生成" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="tempForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="管理者姓名">
          <el-input v-model="tempForm.manager" disabled placeholder="系统自动获取" />
        </el-form-item>
        <el-form-item label="管理者工号">
          <el-input v-model="tempForm.jobNum" disabled placeholder="系统自动获取" />
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
import { fetchProjectList } from '@/api/project'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'ProjectManagement',
  components: { Pagination },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        projectId: undefined,
        projectName: undefined,
        manager: undefined,
        jobNum: undefined,
        sort: '-gmt_create'
      },
      dialogFormVisible: false,
      tempForm: {
        projectId: '',
        projectName: '',
        manager: '',
        jobNum: ''
      },
      rules: {
        projectName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }]
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
    handleCreate() {
      this.resetTempForm()
      const localManagerName = '刘智'
      const localJobNum = 'KD1024'

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let randomProjectId = ''
      for (let i = 0; i < 10; i++) {
        randomProjectId += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      this.tempForm.projectId = randomProjectId
      this.tempForm.manager = localManagerName
      this.tempForm.jobNum = localJobNum

      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    resetTempForm() {
      this.tempForm = {
        projectId: '',
        projectName: '',
        manager: '',
        jobNum: ''
      }
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const newProject = {
            id: Math.floor(Math.random() * 1000) + 100,
            projectId: this.tempForm.projectId,
            projectName: this.tempForm.projectName,
            manager: this.tempForm.manager,
            jobNum: this.tempForm.jobNum,
            subAssemblyCount: 0,
            createTime: new Date().getTime(),
            updateTime: new Date().getTime()
          }

          if (this.list) {
            this.list.unshift(newProject)
            this.total++
          }

          this.dialogFormVisible = false
          this.$notify({
            title: '成功',
            message: '项目创建成功',
            type: 'success',
            duration: 2000
          })
        }
      })
    },
    handleEdit(row) {
      this.$router.push(`/production_management/project/edit/${row.id}`)
    },
    handleDelete(row, index) {
      this.$confirm(`确定要删除项目【${row.projectName}】吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.list.splice(index, 1)
        this.total--
        this.$message({
          type: 'success',
          message: '删除成功!'
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
      } else if (prop === 'gmt_create') {
        this.listQuery.sort = order === 'ascending' ? '+gmt_create' : '-gmt_create'
      } else if (prop === 'gmt_modified') {
        this.listQuery.sort = order === 'ascending' ? '+gmt_modified' : '-gmt_modified'
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

/* 时间列强制垂直换行样式 */
.time-column-wrap {
  display: block !important;
  white-space: normal !important;
  line-height: 1.4;
  word-break: break-all;
}
.time-date {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  display: inline-block;
}
.time-clock {
  font-size: 11px;
  color: #909399;
  font-family: monospace;
  display: inline-block;
}
</style>
