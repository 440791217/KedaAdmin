<template>
  <div class="app-container">
    <div class="filter-container" style="margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <el-input
          v-model="listQuery.toolName"
          placeholder="工具名称 / ID"
          style="width: 200px;"
          size="small"
          clearable
          prefix-icon="el-icon-setting"
          @keyup.enter.native="handleFilter"
        />
        <el-select v-model="listQuery.boundStationId" placeholder="绑定工位" clearable size="small" style="width: 180px;">
          <el-option
            v-for="station in stationOptions"
            :key="station.stationId"
            :label="station.stationName"
            :value="station.stationId"
          />
        </el-select>
        <el-select v-model="listQuery.status" placeholder="工具状态" clearable size="small" style="width: 120px;">
          <el-option label="正常启用" value="正常启用" />
          <el-option label="检测待校准" value="检测待校准" />
          <el-option label="故障停用" value="故障停用" />
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
      :data="toolList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      size="medium"
    >
      <el-table-column label="序号" type="index" align="center" width="60" />

      <el-table-column label="工具ID" align="center" width="110">
        <template slot-scope="{row}">
          <span class="code-text">{{ row.toolId }}</span>
        </template>
      </el-table-column>

      <el-table-column label="工具名称" align="left" min-width="160">
        <template slot-scope="{row}">
          <span style="font-weight: bold; color: #303133;">{{ row.toolName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="绑定的加工工位" align="left" min-width="180">
        <template slot-scope="{row}">
          <span v-if="row.boundStationName" style="color: #409EFF; font-size: 13px;">
            <i class="el-icon-connection" /> {{ row.boundStationName }}
          </span>
          <span v-else style="color: #909399; font-style: italic;">未绑定工位</span>
        </template>
      </el-table-column>

      <el-table-column label="工具 IP 地址" align="center" width="140">
        <template slot-scope="{row}">
          <el-tag size="small" type="info" effect="plain"><i class="el-icon-share" /> {{ row.ipAddress }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="责任人ID" align="center" width="110">
        <template slot-scope="{row}">
          <span style="font-family: monospace; color: #606266;">{{ row.managerId }}</span>
        </template>
      </el-table-column>

      <el-table-column label="责任人" align="center" width="100" prop="manager" />

      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter" size="small" effect="dark">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="录入时间" align="center" width="120">
        <template slot-scope="{row}">
          <div class="time-column-wrap">
            <span class="time-date">{{ row.createDate }}</span>
            <br>
            <span class="time-clock">{{ row.createClock }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="最近校准时间" align="center" width="120">
        <template slot-scope="{row}">
          <div class="time-column-wrap">
            <span class="time-date">{{ row.updateDate }}</span>
            <br>
            <span class="time-clock">{{ row.updateClock }}</span>
          </div>
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

    <el-dialog :title="dialogStatus === 'create' ? '✨ 新增现场生产工具' : '🛠️ 查看/修改工具参数'" :visible.sync="dialogFormVisible" width="550px">
      <el-form ref="dataForm" :model="tempFormData" :rules="rules" label-position="right" label-width="110px" style="width: 440px; margin-left:10px;">
        <el-form-item label="工具名称" prop="toolName">
          <el-input v-model="tempFormData.toolName" placeholder="如: 马头高级智能数字定扭矩电枪" />
        </el-form-item>

        <el-form-item label="绑定对应工位" prop="boundStationId">
          <el-select v-model="tempFormData.boundStationId" placeholder="请选择该工具所属的加工工位" style="width: 100%;" clearable>
            <el-option
              v-for="station in stationOptions"
              :key="station.stationId"
              :label="station.stationName"
              :value="station.stationId"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="责任人ID" prop="managerId" label-width="110px">
              <el-input v-model="tempFormData.managerId" placeholder="工号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="manager" label-width="70px">
              <el-input v-model="tempFormData.manager" placeholder="姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="工具 IP 地址" prop="ipAddress">
          <el-input v-model="tempFormData.ipAddress" placeholder="如: 192.168.1.201" />
        </el-form-item>

        <el-form-item label="工具状态">
          <el-radio-group v-model="tempFormData.status">
            <el-radio-button label="正常启用">正常启用</el-radio-button>
            <el-radio-button label="检测待校准">检测待校准</el-radio-button>
            <el-radio-button label="故障停用">故障停用</el-radio-button>
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
export default {
  name: 'ToolManagement',
  filters: {
    statusFilter(status) {
      const statusMap = {
        '正常启用': 'success',
        '检测待校准': 'warning',
        '故障停用': 'danger'
      }
      return statusMap[status] || 'info'
    }
  },
  data() {
    return {
      listQuery: {
        toolName: '',
        boundStationId: '',
        status: ''
      },
      // 🟢 模拟外部导入的工位大本营，用来做绑定下拉菜单的选择源
      stationOptions: [
        { stationId: 'ST-001', stationName: '前桥机器人精密压装工位' },
        { stationId: 'ST-002', stationName: '数字智能扭矩螺栓拧紧工位' },
        { stationId: 'ST-003', stationName: '气密性透气量综合测试工位' },
        { stationId: 'ST-004', stationName: '成品形位公差视觉出厂检测' }
      ],
      // 🟢 工具初始化 mock 数据
      toolList: [
        {
          toolId: 'TL-801',
          toolName: '高级数字高精度定扭螺卡枪',
          boundStationId: 'ST-002',
          boundStationName: '数字智能扭矩螺栓拧紧工位',
          ipAddress: '192.168.1.201',
          managerId: 'KD-0842',
          manager: '张兵',
          status: '正常启用',
          createDate: '2026-03-12',
          createClock: '08:45:00',
          updateDate: '2026-06-18',
          updateClock: '10:22:00'
        },
        {
          toolId: 'TL-802',
          toolName: '工业红外激光引导对位仪',
          boundStationId: 'ST-001',
          boundStationName: '前桥机器人精密压装工位',
          ipAddress: '192.168.1.202',
          managerId: 'KD-1105',
          manager: '李四',
          status: '正常启用',
          createDate: '2026-03-15',
          createClock: '11:20:00',
          updateDate: '2026-06-12',
          updateClock: '09:15:30'
        },
        {
          toolId: 'TL-803',
          toolName: '差压式高灵敏度气密气体检漏仪',
          boundStationId: 'ST-003',
          boundStationName: '气密性透气量综合测试工位',
          ipAddress: '192.168.1.215',
          managerId: 'KD-0319',
          manager: '王五',
          status: '检测待校准',
          createDate: '2026-04-05',
          createClock: '14:30:00',
          updateDate: '2026-06-20',
          updateClock: '15:10:00'
        },
        {
          toolId: 'TL-804',
          toolName: '超高速工业双目3D视觉相机',
          boundStationId: 'ST-004',
          boundStationName: '成品形位公差视觉出厂检测',
          ipAddress: '192.168.3.88',
          managerId: 'KD-1560',
          manager: '赵六',
          status: '故障停用',
          createDate: '2026-05-10',
          createClock: '10:00:00',
          updateDate: '2026-06-01',
          updateClock: '16:00:00'
        }
      ],
      dialogFormVisible: false,
      dialogStatus: '',
      tempFormData: {
        toolId: '',
        toolName: '',
        boundStationId: '',
        boundStationName: '',
        ipAddress: '',
        managerId: '',
        manager: '',
        status: '正常启用'
      },
      rules: {
        toolName: [{ required: true, message: '工具名称为必填项', trigger: 'blur' }],
        boundStationId: [{ required: true, message: '请绑定对应的加工工位', trigger: 'change' }],
        managerId: [{ required: true, message: '责任人ID为必填项', trigger: 'blur' }],
        manager: [{ required: true, message: '责任人为必填项', trigger: 'blur' }],
        ipAddress: [
          { required: true, message: '工具IP地址为必填项', trigger: 'blur' },
          { pattern: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/, message: '请输入合法的 IPv4 地址', trigger: 'blur' }
        ]
      },
      allToolDataBackup: []
    }
  },
  created() {
    this.allToolDataBackup = [...this.toolList]
  },
  methods: {
    getNowDateAndClockObjects() {
      const now = new Date()
      const padding = (num) => String(num).padStart(2, '0')
      return {
        date: `${now.getFullYear()}-${padding(now.getMonth() + 1)}-${padding(now.getDate())}`,
        clock: `${padding(now.getHours())}:${padding(now.getMinutes())}:${padding(now.getSeconds())}`
      }
    },
    handleFilter() {
      this.toolList = this.allToolDataBackup.filter(item => {
        const matchName = !this.listQuery.toolName ||
          item.toolName.includes(this.listQuery.toolName) ||
          item.toolId.includes(this.listQuery.toolName)
        const matchStation = !this.listQuery.boundStationId || item.boundStationId === this.listQuery.boundStationId
        const matchStatus = !this.listQuery.status || item.status === this.listQuery.status
        return matchName && matchStation && matchStatus
      })
    },
    resetQuery() {
      this.listQuery = { toolName: '', boundStationId: '', status: '' }
      this.toolList = [...this.allToolDataBackup]
    },
    resetTempFormData() {
      this.tempFormData = {
        toolId: '',
        toolName: '',
        boundStationId: '',
        boundStationName: '',
        ipAddress: '',
        managerId: '',
        manager: '',
        status: '正常启用'
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
          const timeObj = this.getNowDateAndClockObjects()
          const newId = 'TL-8' + paddingLeft(this.allToolDataBackup.length + 1, 2)

          // 根据选中的工位ID，匹配并同步出工位中文名存入列表
          const stationTarget = this.stationOptions.find(o => o.stationId === this.tempFormData.boundStationId)
          if (stationTarget) {
            this.tempFormData.boundStationName = stationTarget.stationName
          }

          const newTool = {
            ...this.tempFormData,
            toolId: newId,
            createDate: timeObj.date,
            createClock: timeObj.clock,
            updateDate: timeObj.date,
            updateClock: timeObj.clock
          }

          this.allToolDataBackup.unshift(newTool)
          this.handleFilter()
          this.dialogFormVisible = false
          this.$message.success('成功录入并绑定新生产工具！')
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
          const index = this.allToolDataBackup.findIndex(v => v.toolId === this.tempFormData.toolId)
          if (index > -1) {
            const timeObj = this.getNowDateAndClockObjects()
            this.tempFormData.updateDate = timeObj.date
            this.tempFormData.updateClock = timeObj.clock

            // 同步工位中文更替
            const stationTarget = this.stationOptions.find(o => o.stationId === this.tempFormData.boundStationId)
            this.tempFormData.boundStationName = stationTarget ? stationTarget.stationName : ''

            this.allToolDataBackup.splice(index, 1, this.tempFormData)
            this.handleFilter()
          }
          this.dialogFormVisible = false
          this.$message.success('工具配置修改成功')
        }
      })
    },
    handleDelete(index, row) {
      this.$confirm(`确要彻底移除工具【${row.toolName}】吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const backupIndex = this.allToolDataBackup.findIndex(v => v.toolId === row.toolId)
        if (backupIndex > -1) {
          this.allToolDataBackup.splice(backupIndex, 1)
        }
        this.handleFilter()
        this.$message.success('工具解绑并移除成功')
      }).catch(() => {})
    }
  }
}

// 辅助工具补零函数
function paddingLeft(num, length) {
  return (Array(length).join('0') + num).slice(-length)
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

/* 时间强制换行样式补丁 */
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
