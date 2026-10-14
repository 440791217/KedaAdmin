<template>
  <div class="app-container">
    <div class="filter-container" style="margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-input
          v-model="listQuery.station_name"
          placeholder="工位名称 / 编码"
          style="width: 200px;"
          size="small"
          clearable
          prefix-icon="el-icon-search"
          @keyup.enter.native="handleFilter"
        />
        <el-input
          v-model="listQuery.ip_address"
          placeholder="IP 地址 (如: 192.168.)"
          style="width: 200px;"
          size="small"
          clearable
          prefix-icon="el-position"
          @keyup.enter.native="handleFilter"
        />
        <el-select v-model="listQuery.status" placeholder="工位状态" clearable size="small" style="width: 120px;">
<<<<<<< HEAD
          <el-option label="运行中" :value="0" />
          <el-option label="维护中" :value="1" />
          <el-option label="已停用" :value="2" />
=======
          <el-option label="运行中" :value="1" />
          <el-option label="维护中" :value="2" />
          <el-option label="已停用" :value="0" />
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        </el-select>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleFilter">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </div>
      <div>
        <el-button type="success" icon="el-icon-plus" size="small" @click="handleCreate">
          新建工位
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="stationList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      size="medium"
    >
      <el-table-column label="序号" type="index" align="center" width="60" />

<<<<<<< HEAD
      <el-table-column label="工位编码" align="center" width="110">
=======
      <el-table-column label="工位编码" align="center" width="130">
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        <template slot-scope="{row}">
          <span class="code-text">{{ row.station_code }}</span>
        </template>
      </el-table-column>

      <el-table-column label="工位名称" align="left" min-width="160">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.station_name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="物理地点" align="center" width="120" prop="location" />

      <el-table-column label="IP 地址" align="center" width="140">
        <template slot-scope="{row}">
          <el-tag size="small" type="info" effect="plain"><i class="el-icon-share" /> {{ row.ip_address }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="管理者工号" align="center" width="120">
        <template slot-scope="{row}">
          <span style="font-family: monospace; color: #606266;">{{ row.manager_id }}</span>
        </template>
      </el-table-column>

<<<<<<< HEAD
      <el-table-column label="管理者" align="center" width="100" prop="manager_name" />

      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="{row}">
          <el-tag :type="statusFilter(row.status)" size="small" effect="dark">
            {{ statusText(row.status) }}
=======
      <el-table-column label="管理者姓名" align="center" width="100" prop="manager_name" />

      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter" size="small" effect="dark">
            {{ row.status | statusText }}
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="工位说明" align="left" min-width="160" show-overflow-tooltip>
        <template slot-scope="{row}">
          {{ row.description || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="{row}">
<<<<<<< HEAD
          <span>{{ row.created_at }}</span>
=======
          <span>{{ row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        </template>
      </el-table-column>

      <el-table-column label="最近修改时间" align="center" width="160">
        <template slot-scope="{row}">
<<<<<<< HEAD
          <span>{{ row.updated_at }}</span>
=======
          <span>{{ row.updated_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template slot-scope="scope">
          <div class="operation-wrapper">
            <el-button type="primary" size="mini" icon="el-icon-edit-outline" class="op-btn" @click="handleUpdate(scope.row)">
              查看/编辑
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" class="op-btn" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <el-dialog :title="dialogStatus === 'create' ? '新增工位' : '查看/修改工位'" :visible.sync="dialogFormVisible" width="600px">
      <el-form ref="dataForm" :model="tempFormData" :rules="rules" label-position="right" label-width="100px">
        <el-form-item label="工位编码" prop="station_code">
          <el-input v-model="tempFormData.station_code" placeholder="如: ST-001" />
        </el-form-item>

        <el-form-item label="工位名称" prop="station_name">
          <el-input v-model="tempFormData.station_name" placeholder="如: 前桥装配工位" />
        </el-form-item>

        <el-form-item label="物理地点" prop="location">
          <el-input v-model="tempFormData.location" placeholder="如: A区-1号线" />
        </el-form-item>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="管理者工号" prop="manager_id">
              <el-input v-model="tempFormData.manager_id" placeholder="工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
<<<<<<< HEAD
            <el-form-item label="管理者" prop="manager_name" label-width="70px">
=======
            <el-form-item label="管理者姓名" prop="manager_name">
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
              <el-input v-model="tempFormData.manager_name" placeholder="姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="IP 地址" prop="ip_address">
          <el-input v-model="tempFormData.ip_address" placeholder="如: 192.168.1.105" />
        </el-form-item>

        <el-form-item label="工位说明" prop="description">
          <el-input
            v-model="tempFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工位说明"
          />
        </el-form-item>

        <el-form-item label="工位状态">
          <el-radio-group v-model="tempFormData.status">
<<<<<<< HEAD
            <el-radio-button :label="0">运行中</el-radio-button>
            <el-radio-button :label="1">维护中</el-radio-button>
            <el-radio-button :label="2">已停用</el-radio-button>
=======
            <el-radio-button :label="1">运行中</el-radio-button>
            <el-radio-button :label="2">维护中</el-radio-button>
            <el-radio-button :label="0">已停用</el-radio-button>
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确认提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination/index.vue'
import { fetchStationList, createStation, updateStation, deleteStation } from '@/api/station'

export default {
  name: 'StationManagement',
<<<<<<< HEAD
=======

  components: {
    Pagination
  },

  filters: {
    statusFilter(status) {
      const statusMap = {
        1: 'success',
        2: 'warning',
        0: 'danger'
      }
      return statusMap[status] || 'info'
    },
    statusText(status) {
      const map = {
        1: '运行中',
        2: '维护中',
        0: '已停用'
      }
      return map[status] || '未知'
    }
  },

>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
  data() {
    return {
      listLoading: true,
      total: 0,
      listQuery: {
        page: 1,
        limit: 10,
        station_name: '',
        ip_address: '',
        status: ''
      },
      stationList: [],
      dialogFormVisible: false,
      dialogStatus: '',
      editId: null,
      tempFormData: {
<<<<<<< HEAD
        id: '',
=======
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        station_code: '',
        station_name: '',
        location: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
<<<<<<< HEAD
        status: 0
=======
        description: '',
        status: 1
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
      },
      rules: {
        station_code: [{ required: true, message: '工位编码为必填项', trigger: 'blur' }],
        station_name: [{ required: true, message: '工位名称为必填项', trigger: 'blur' }],
        location: [{ required: true, message: '物理地点为必填项', trigger: 'blur' }],
<<<<<<< HEAD
        manager_id: [{ required: true, message: '管理者ID为必填项', trigger: 'blur' }],
        manager_name: [{ required: true, message: '负责人为必填项', trigger: 'blur' }],
=======
        manager_id: [{ required: true, message: '管理者工号为必填项', trigger: 'blur' }],
        manager_name: [{ required: true, message: '管理者姓名为必填项', trigger: 'blur' }],
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        ip_address: [
          { required: true, message: 'IP地址为必填项', trigger: 'blur' },
          { pattern: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/, message: '请输入合法的 IPv4 地址', trigger: 'blur' }
        ]
      }
    }
  },

  created() {
    this.getList()
  },

  methods: {
    getList() {
      this.listLoading = true
      fetchStationList(this.listQuery).then(response => {
<<<<<<< HEAD
        this.stationList = response.data.items
        this.listLoading = false
      })
    },
    statusFilter(status) {
      const statusMap = {
        0: 'success',
        1: 'warning',
        2: 'danger'
      }
      return statusMap[status] || 'info'
    },
    statusText(status) {
      const textMap = {
        0: '运行中',
        1: '维护中',
        2: '已停用'
      }
      return textMap[status] || '未知'
    },
=======
        const data = response.data
        this.total = data.total
        this.stationList = data.items
        this.listLoading = false
      }).catch(() => {
        this.listLoading = false
      })
    },

>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    resetQuery() {
      this.listQuery = { page: 1, limit: 10, station_name: '', ip_address: '', status: '' }
      this.getList()
    },

    resetTempFormData() {
      this.tempFormData = {
<<<<<<< HEAD
        id: '',
=======
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
        station_code: '',
        station_name: '',
        location: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
<<<<<<< HEAD
        status: 0
=======
        description: '',
        status: 1
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
      }
    },

    handleCreate() {
      this.resetTempFormData()
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
          createStation(this.tempFormData).then(() => {
            this.dialogFormVisible = false
            this.$message.success('工位创建成功')
            this.listQuery.page = 1
            this.getList()
          })
        }
      })
    },

    handleUpdate(row) {
      this.editId = row.id
      this.tempFormData = {
        station_code: row.station_code,
        station_name: row.station_name,
        location: row.location,
        ip_address: row.ip_address,
        manager_id: row.manager_id,
        manager_name: row.manager_name,
        description: row.description,
        status: row.status
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
<<<<<<< HEAD
          updateStation(this.tempFormData.id, this.tempFormData).then(() => {
=======
          updateStation(this.editId, this.tempFormData).then(() => {
>>>>>>> aa745ea7b370d320859df5a435ae272da2ddf599
            this.dialogFormVisible = false
            this.$message.success('工位修改成功')
            this.getList()
          })
        }
      })
    },

    handleDelete(row) {
      this.$confirm(`确要删除工位【${row.station_name}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteStation(row.id).then(() => {
          this.$message.success('工位删除成功')
          if (this.listQuery.page > 1 && this.stationList.length === 1) {
            this.listQuery.page--
          }
          this.getList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.code-text {
  font-family: monospace;
  font-weight: bold;
  color: #1890ff;
  background-color: #f0f7ff;
  padding: 2px 6px;
  border-radius: 4px;
}

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
