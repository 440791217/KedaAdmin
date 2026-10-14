<template>
  <div class="app-container">
    <div class="filter-container" style="margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-input
          v-model="listQuery.station_name"
          placeholder="工位名称 / ID"
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
          <el-option label="运行中" :value="0" />
          <el-option label="维护中" :value="1" />
          <el-option label="已停用" :value="2" />
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

      <el-table-column label="工位编码" align="center" width="110">
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

      <el-table-column label="管理者ID" align="center" width="110">
        <template slot-scope="{row}">
          <span style="font-family: monospace; color: #606266;">{{ row.manager_id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="管理者" align="center" width="100" prop="manager_name" />

      <el-table-column label="状态" align="center" width="90">
        <template slot-scope="{row}">
          <el-tag :type="statusFilter(row.status)" size="small" effect="dark">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="{row}">
          <span>{{ row.created_at }}</span>
        </template>
      </el-table-column>

      <el-table-column label="最近修改时间" align="center" width="160">
        <template slot-scope="{row}">
          <span>{{ row.updated_at }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template slot-scope="scope">
          <div class="operation-wrapper">
            <el-button type="primary" size="mini" icon="el-icon-edit-outline" class="op-btn" @click="handleUpdate(scope.row)">
              查看/编辑
            </el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" class="op-btn" @click="handleDelete(scope.$index, scope.row)">
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="dialogStatus === 'create' ? '✨ 新增现场工位配置' : '🛠️ 查看/修改工位参数'" :visible.sync="dialogFormVisible" width="550px">
      <el-form ref="dataForm" :model="tempFormData" :rules="rules" label-position="right" label-width="100px" style="width: 440px; margin-left:20px;">
        <el-form-item label="工位名称" prop="station_name">
          <el-input v-model="tempFormData.station_name" placeholder="如: 总装线-01拧紧工位" />
        </el-form-item>

        <el-form-item label="物理地点" prop="location">
          <el-input v-model="tempFormData.location" placeholder="如: 南厂区 A 栋" />
        </el-form-item>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="管理者ID" prop="manager_id">
              <el-input v-model="tempFormData.manager_id" placeholder="工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理者" prop="manager_name" label-width="70px">
              <el-input v-model="tempFormData.manager_name" placeholder="姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="IP 地址" prop="ip_address">
          <el-input v-model="tempFormData.ip_address" placeholder="如: 192.168.1.105" />
        </el-form-item>

        <el-form-item label="工位状态">
          <el-radio-group v-model="tempFormData.status">
            <el-radio-button :label="0">运行中</el-radio-button>
            <el-radio-button :label="1">维护中</el-radio-button>
            <el-radio-button :label="2">已停用</el-radio-button>
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
import { fetchStationList, createStation, updateStation, deleteStation } from '@/api/station'

export default {
  name: 'StationManagement',
  data() {
    return {
      listLoading: true,
      listQuery: {
        station_name: '',
        ip_address: '',
        status: ''
      },
      stationList: [],
      dialogFormVisible: false,
      dialogStatus: '',
      tempFormData: {
        id: '',
        station_code: '',
        station_name: '',
        location: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
        status: 0
      },
      rules: {
        station_name: [{ required: true, message: '工位名称为必填项', trigger: 'blur' }],
        location: [{ required: true, message: '物理地点为必填项', trigger: 'blur' }],
        manager_id: [{ required: true, message: '管理者ID为必填项', trigger: 'blur' }],
        manager_name: [{ required: true, message: '负责人为必填项', trigger: 'blur' }],
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
    handleFilter() {
      this.getList()
    },
    resetQuery() {
      this.listQuery = { station_name: '', ip_address: '', status: '' }
      this.getList()
    },
    resetTempFormData() {
      this.tempFormData = {
        id: '',
        station_code: '',
        station_name: '',
        location: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
        status: 0
      }
    },
    handleCreate() {
      this.resetTempFormData()
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
            this.$message.success('成功创建现场新工位！')
            this.getList()
          })
        }
      })
    },
    handleUpdate(row) {
      this.tempFormData = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          updateStation(this.tempFormData.id, this.tempFormData).then(() => {
            this.dialogFormVisible = false
            this.$message.success('工位参数修改成功')
            this.getList()
          })
        }
      })
    },
    handleDelete(index, row) {
      this.$confirm(`确要彻底移除工位【${row.station_name}】的配置信息吗？`, '安全警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteStation(row.id).then(() => {
          this.$message.success('工位删除成功')
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
