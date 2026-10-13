<template>
  <div class="app-container">
    <div class="filter-container" style="margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-input
          v-model="listQuery.tool_name"
          placeholder="工具名称 / 编码"
          style="width: 200px;"
          size="small"
          clearable
          prefix-icon="el-icon-setting"
          @keyup.enter.native="handleFilter"
        />
        <el-select v-model="listQuery.bound_station_code" placeholder="绑定工位" clearable size="small" style="width: 180px;">
          <el-option
            v-for="station in stationOptions"
            :key="station.station_code"
            :label="station.station_name"
            :value="station.station_code"
          />
        </el-select>
        <el-select v-model="listQuery.status" placeholder="工具状态" clearable size="small" style="width: 120px;">
          <el-option label="正常启用" :value="1" />
          <el-option label="检测待校准" :value="2" />
          <el-option label="故障停用" :value="0" />
        </el-select>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleFilter">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </div>
      <div>
        <el-button type="success" icon="el-icon-plus" size="small" @click="handleCreate">
          新建工具
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="listLoading"
      :data="toolList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      size="medium"
    >
      <el-table-column label="序号" type="index" align="center" width="60" />

      <el-table-column label="工具编码" align="center" width="120">
        <template slot-scope="{row}">
          <span class="code-text">{{ row.tool_code }}</span>
        </template>
      </el-table-column>

      <el-table-column label="工具名称" align="left" min-width="180">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.tool_name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="绑定工位" align="left" min-width="160">
        <template slot-scope="{row}">
          <span v-if="row.bound_station_name" style="color: #409EFF; font-size: 13px;">
            <i class="el-icon-connection" /> {{ row.bound_station_name }}
          </span>
          <span v-else style="color: #909399; font-style: italic;">未绑定工位</span>
        </template>
      </el-table-column>

      <el-table-column label="IP 地址" align="center" width="140">
        <template slot-scope="{row}">
          <el-tag size="small" type="info" effect="plain"><i class="el-icon-share" /> {{ row.ip_address }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="负责人工号" align="center" width="120">
        <template slot-scope="{row}">
          <span style="font-family: monospace; color: #606266;">{{ row.manager_id }}</span>
        </template>
      </el-table-column>

      <el-table-column label="负责人姓名" align="center" width="100" prop="manager_name" />

      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter" size="small" effect="dark">
            {{ row.status | statusText }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="工具说明" align="left" min-width="160" show-overflow-tooltip>
        <template slot-scope="{row}">
          {{ row.description || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="录入时间" align="center" width="160">
        <template slot-scope="{row}">
          <span>{{ row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>

      <el-table-column label="最近更新时间" align="center" width="160">
        <template slot-scope="{row}">
          <span>{{ row.updated_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</span>
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

    <el-dialog :title="dialogStatus === 'create' ? '新增工具' : '查看/修改工具'" :visible.sync="dialogFormVisible" width="600px">
      <el-form ref="dataForm" :model="tempFormData" :rules="rules" label-position="right" label-width="110px">
        <el-form-item label="工具编码" prop="tool_code">
          <el-input v-model="tempFormData.tool_code" placeholder="如: TL-801" />
        </el-form-item>

        <el-form-item label="工具名称" prop="tool_name">
          <el-input v-model="tempFormData.tool_name" placeholder="如: 高级数字高精度定扭螺枪" />
        </el-form-item>

        <el-form-item label="绑定工位" prop="bound_station_code">
          <el-select v-model="tempFormData.bound_station_code" placeholder="请选择绑定的工位" style="width: 100%;" clearable>
            <el-option
              v-for="station in stationOptions"
              :key="station.station_code"
              :label="station.station_name"
              :value="station.station_code"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="负责人工号" prop="manager_id">
              <el-input v-model="tempFormData.manager_id" placeholder="工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人姓名" prop="manager_name">
              <el-input v-model="tempFormData.manager_name" placeholder="姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="IP 地址" prop="ip_address">
          <el-input v-model="tempFormData.ip_address" placeholder="如: 192.168.1.201" />
        </el-form-item>

        <el-form-item label="工具说明" prop="description">
          <el-input
            v-model="tempFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工具说明"
          />
        </el-form-item>

        <el-form-item label="工具状态">
          <el-radio-group v-model="tempFormData.status">
            <el-radio-button :label="1">正常启用</el-radio-button>
            <el-radio-button :label="2">检测待校准</el-radio-button>
            <el-radio-button :label="0">故障停用</el-radio-button>
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
import { fetchToolList, createTool, updateTool, deleteTool } from '@/api/tool'

export default {
  name: 'ToolManagement',

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
        1: '正常启用',
        2: '检测待校准',
        0: '故障停用'
      }
      return map[status] || '未知'
    }
  },

  data() {
    return {
      listLoading: false,
      total: 0,
      listQuery: {
        page: 1,
        limit: 10,
        tool_name: '',
        bound_station_code: '',
        status: ''
      },
      stationOptions: [
        { station_code: 'ST-001', station_name: '前桥装配工位' },
        { station_code: 'ST-002', station_name: '减速器装配工位' },
        { station_code: 'ST-003', station_name: '底盘检测工位' },
        { station_code: 'ST-004', station_name: '缸盖气密检测' }
      ],
      toolList: [],
      dialogFormVisible: false,
      dialogStatus: '',
      editId: null,
      tempFormData: {
        tool_code: '',
        tool_name: '',
        bound_station_code: '',
        bound_station_name: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
        description: '',
        status: 1
      },
      rules: {
        tool_code: [{ required: true, message: '工具编码为必填项', trigger: 'blur' }],
        tool_name: [{ required: true, message: '工具名称为必填项', trigger: 'blur' }],
        bound_station_code: [{ required: true, message: '请选择绑定的工位', trigger: 'change' }],
        manager_id: [{ required: true, message: '负责人工号为必填项', trigger: 'blur' }],
        manager_name: [{ required: true, message: '负责人姓名为必填项', trigger: 'blur' }],
        ip_address: [
          { required: true, message: '工具IP地址为必填项', trigger: 'blur' },
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
      fetchToolList(this.listQuery).then(response => {
        const data = response.data
        this.total = data.total
        this.toolList = data.items
        this.listLoading = false
      }).catch(() => {
        this.listLoading = false
      })
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    resetQuery() {
      this.listQuery = { page: 1, limit: 10, tool_name: '', bound_station_code: '', status: '' }
      this.getList()
    },

    resetTempFormData() {
      this.tempFormData = {
        tool_code: '',
        tool_name: '',
        bound_station_code: '',
        bound_station_name: '',
        ip_address: '',
        manager_id: '',
        manager_name: '',
        description: '',
        status: 1
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
          const stationTarget = this.stationOptions.find(o => o.station_code === this.tempFormData.bound_station_code)
          const payload = {
            tool_code: this.tempFormData.tool_code,
            tool_name: this.tempFormData.tool_name,
            bound_station_code: this.tempFormData.bound_station_code,
            bound_station_name: stationTarget ? stationTarget.station_name : '',
            ip_address: this.tempFormData.ip_address,
            manager_id: this.tempFormData.manager_id,
            manager_name: this.tempFormData.manager_name,
            description: this.tempFormData.description,
            status: this.tempFormData.status
          }
          createTool(payload).then(() => {
            this.dialogFormVisible = false
            this.$message.success('工具创建成功')
            this.listQuery.page = 1
            this.getList()
          })
        }
      })
    },

    handleUpdate(row) {
      this.editId = row.id
      this.tempFormData = {
        tool_code: row.tool_code,
        tool_name: row.tool_name,
        bound_station_code: row.bound_station_code,
        bound_station_name: row.bound_station_name,
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
          const stationTarget = this.stationOptions.find(o => o.station_code === this.tempFormData.bound_station_code)
          const payload = {
            tool_code: this.tempFormData.tool_code,
            tool_name: this.tempFormData.tool_name,
            bound_station_code: this.tempFormData.bound_station_code,
            bound_station_name: stationTarget ? stationTarget.station_name : '',
            ip_address: this.tempFormData.ip_address,
            manager_id: this.tempFormData.manager_id,
            manager_name: this.tempFormData.manager_name,
            description: this.tempFormData.description,
            status: this.tempFormData.status
          }
          updateTool(this.editId, payload).then(() => {
            this.dialogFormVisible = false
            this.$message.success('工具修改成功')
            this.getList()
          })
        }
      })
    },

    handleDelete(row) {
      this.$confirm(`确要删除工具【${row.tool_name}】吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteTool(row.id).then(() => {
          this.$message.success('工具删除成功')
          if (this.listQuery.page > 1 && this.toolList.length === 1) {
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
  color: #67c23a;
  background-color: #f0f9eb;
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
