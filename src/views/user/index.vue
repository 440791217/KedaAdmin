```vue
<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.username"
        placeholder="登录账号"
        clearable
        style="width: 150px; margin-right: 10px;"
        @keyup.enter.native="handleFilter"
      />
      <el-input
        v-model="listQuery.realName"
        placeholder="真实姓名"
        clearable
        style="width: 130px; margin-right: 10px;"
        @keyup.enter.native="handleFilter"
      />
      <el-input
        v-model="listQuery.cardNumber"
        placeholder="工卡/RFID"
        clearable
        style="width: 160px; margin-right: 10px;"
        @keyup.enter.native="handleFilter"
      />
      <el-select
        v-model="listQuery.shiftGroup"
        placeholder="所属班组"
        clearable
        style="width: 130px; margin-right: 10px;"
      >
        <el-option label="一班组" value="一班组" />
        <el-option label="二班组" value="二班组" />
        <el-option label="三班组" value="三班组" />
        <el-option label="维修班组" value="维修班组" />
      </el-select>
      <el-select
        v-model="listQuery.status"
        placeholder="账号状态"
        clearable
        style="width: 120px; margin-right: 10px;"
      >
        <el-option label="正常" :value="1" />
        <el-option label="禁用" :value="0" />
        <el-option label="离职" :value="2" />
      </el-select>
      <el-button
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        查询
      </el-button>
      <el-button
        type="success"
        icon="el-icon-plus"
        @click="handleCreate"
      >
        新建用户
      </el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column
        label="序号"
        width="70"
        align="center"
      >
        <template slot-scope="scope">
          {{ (listQuery.page - 1) * listQuery.limit + scope.$index + 1 }}
        </template>
      </el-table-column>

      <el-table-column
        label="用户"
        min-width="190"
      >
        <template slot-scope="scope">
          <div class="user-info">
            <el-avatar
              :size="42"
              :src="scope.row.avatarUrl"
              icon="el-icon-user-solid"
            />
            <div class="user-info-text">
              <div class="real-name">
                {{ scope.row.realName }}
              </div>
              <div class="username">
                {{ scope.row.username }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="工卡/RFID"
        width="170"
        align="center"
      >
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.cardNumber"
            type="warning"
            effect="light"
          >
            {{ scope.row.cardNumber }}
          </el-tag>
          <span
            v-else
            class="empty-text"
          >
            未绑定
          </span>
        </template>
      </el-table-column>

      <el-table-column
        label="所属班组"
        width="130"
        align="center"
      >
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.shiftGroup"
            type="info"
            effect="plain"
          >
            {{ scope.row.shiftGroup }}
          </el-tag>
          <span
            v-else
            class="empty-text"
          >
            未设置
          </span>
        </template>
      </el-table-column>

      <el-table-column
        label="联系电话"
        width="140"
        align="center"
      >
        <template slot-scope="scope">
          {{ scope.row.phone || '-' }}
        </template>
      </el-table-column>

      <el-table-column
        label="账号状态"
        width="100"
        align="center"
      >
        <template slot-scope="scope">
          <el-tag
            v-if="scope.row.status === 1"
            type="success"
            size="small"
          >
            正常
          </el-tag>
          <el-tag
            v-else-if="scope.row.status === 0"
            type="danger"
            size="small"
          >
            禁用
          </el-tag>
          <el-tag
            v-else
            type="info"
            size="small"
          >
            离职
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        label="创建时间"
        width="125"
        align="center"
      >
        <template slot-scope="scope">
          <div class="time-column-wrap">
            <span class="time-date">
              {{ scope.row.createdAt | parseTime('{y}-{m}-{d}') }}
            </span>
            <br>
            <span class="time-clock">
              {{ scope.row.createdAt | parseTime('{h}:{i}:{s}') }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="最近修改"
        width="125"
        align="center"
      >
        <template slot-scope="scope">
          <div class="time-column-wrap">
            <span class="time-date">
              {{ scope.row.updatedAt | parseTime('{y}-{m}-{d}') }}
            </span>
            <br>
            <span class="time-clock">
              {{ scope.row.updatedAt | parseTime('{h}:{i}:{s}') }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
        width="150"
        align="center"
        fixed="right"
      >
        <template slot-scope="scope">
          <div class="operation-wrapper">
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-edit-outline"
              class="op-btn"
              @click="handleEdit(scope.row)"
            >
              查看/编辑
            </el-button>

            <el-button
              v-if="scope.row.status === 1"
              type="warning"
              size="mini"
              icon="el-icon-lock"
              class="op-btn"
              @click="handleDisable(scope.row)"
            >
              禁用
            </el-button>

            <el-button
              v-else-if="scope.row.status === 0"
              type="success"
              size="mini"
              icon="el-icon-unlock"
              class="op-btn"
              @click="handleEnable(scope.row)"
            >
              启用
            </el-button>

            <el-button
              type="danger"
              size="mini"
              icon="el-icon-delete"
              class="op-btn"
              @click="handleDelete(scope.row)"
            >
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

    <el-dialog
      :title="dialogType === 'create' ? '新建用户' : '编辑用户'"
      :visible.sync="dialogFormVisible"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userForm"
        :model="tempForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item
          label="登录账号"
          prop="username"
        >
          <el-input
            v-model="tempForm.username"
            placeholder="请输入登录账号"
            maxlength="64"
            :disabled="dialogType === 'edit'"
          />
          <div
            v-if="dialogType === 'edit'"
            class="form-tip"
          >
            登录账号创建后不可修改
          </div>
        </el-form-item>

        <el-form-item
          v-if="dialogType === 'create'"
          label="登录密码"
          prop="password"
        >
          <el-input
            v-model="tempForm.password"
            type="password"
            placeholder="请输入登录密码"
            show-password
          />
        </el-form-item>

        <el-form-item
          v-if="dialogType === 'create'"
          label="确认密码"
          prop="confirmPassword"
        >
          <el-input
            v-model="tempForm.confirmPassword"
            type="password"
            placeholder="请再次输入登录密码"
            show-password
          />
        </el-form-item>

        <el-form-item
          label="真实姓名"
          prop="realName"
        >
          <el-input
            v-model="tempForm.realName"
            placeholder="请输入真实姓名"
            maxlength="64"
          />
        </el-form-item>

        <el-form-item
          label="工卡/RFID"
          prop="cardNumber"
        >
          <div class="card-input">
            <el-input
              v-model="tempForm.cardNumber"
              placeholder="请输入或读取工卡"
              maxlength="64"
            />
            <el-button
              type="primary"
              plain
              @click="handleReadCard"
            >
              读卡
            </el-button>
          </div>
        </el-form-item>

        <el-form-item
          label="所属班组"
          prop="shiftGroup"
        >
          <el-select
            v-model="tempForm.shiftGroup"
            placeholder="请选择所属班组"
            style="width: 100%;"
          >
            <el-option label="一班组" value="一班组" />
            <el-option label="二班组" value="二班组" />
            <el-option label="三班组" value="三班组" />
            <el-option label="维修班组" value="维修班组" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="联系电话"
          prop="phone"
        >
          <el-input
            v-model="tempForm.phone"
            placeholder="请输入联系电话"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item
          label="头像地址"
          prop="avatarUrl"
        >
          <el-input
            v-model="tempForm.avatarUrl"
            placeholder="请输入头像图片地址"
            maxlength="255"
          />
        </el-form-item>

        <el-form-item
          label="账号状态"
          prop="status"
        >
          <el-radio-group v-model="tempForm.status">
            <el-radio :label="1">
              正常
            </el-radio>
            <el-radio :label="0">
              禁用
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="submitForm"
        >
          {{ dialogType === 'create' ? '确定创建' : '保存修改' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'UserManagement',

  components: {
    Pagination
  },

  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (this.dialogType === 'edit') {
        callback()
        return
      }

      if (value !== this.tempForm.password) {
        callback(new Error('两次输入的密码不一致'))
        return
      }

      callback()
    }

    return {
      list: [],
      total: 0,
      listLoading: false,
      dialogFormVisible: false,
      dialogType: 'create',
      editUserId: null,

      listQuery: {
        page: 1,
        limit: 10,
        username: '',
        realName: '',
        cardNumber: '',
        shiftGroup: '',
        status: ''
      },

      tempForm: {
        username: '',
        password: '',
        confirmPassword: '',
        realName: '',
        cardNumber: '',
        shiftGroup: '',
        avatarUrl: '',
        status: 1,
        phone: ''
      },

      rules: {
        username: [
          {
            required: true,
            message: '请输入登录账号',
            trigger: 'blur'
          },
          {
            min: 3,
            max: 64,
            message: '账号长度为3-64个字符',
            trigger: 'blur'
          }
        ],
        password: [
          {
            required: true,
            message: '请输入登录密码',
            trigger: 'blur'
          },
          {
            min: 6,
            message: '密码长度不能少于6位',
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          {
            required: true,
            message: '请确认登录密码',
            trigger: 'blur'
          },
          {
            validator: validateConfirmPassword,
            trigger: 'blur'
          }
        ],
        realName: [
          {
            required: true,
            message: '请输入真实姓名',
            trigger: 'blur'
          }
        ],
        phone: [
          {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号码',
            trigger: 'blur'
          }
        ]
      },

      allUsers: [
        {
          id: 1,
          username: 'zhangsan',
          realName: '张三',
          cardNumber: 'RFID001001',
          shiftGroup: '一班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138001',
          createdAt: new Date('2026-08-01 08:30:00').getTime(),
          updatedAt: new Date('2026-09-10 10:20:00').getTime()
        },
        {
          id: 2,
          username: 'lisi',
          realName: '李四',
          cardNumber: 'RFID001002',
          shiftGroup: '一班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138002',
          createdAt: new Date('2026-08-03 09:10:00').getTime(),
          updatedAt: new Date('2026-09-08 14:30:00').getTime()
        },
        {
          id: 3,
          username: 'wangwu',
          realName: '王五',
          cardNumber: 'RFID001003',
          shiftGroup: '二班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138003',
          createdAt: new Date('2026-08-05 08:20:00').getTime(),
          updatedAt: new Date('2026-09-09 16:10:00').getTime()
        },
        {
          id: 4,
          username: 'zhaoliu',
          realName: '赵六',
          cardNumber: 'RFID001004',
          shiftGroup: '二班组',
          avatarUrl: '',
          status: 0,
          phone: '13800138004',
          createdAt: new Date('2026-08-08 10:00:00').getTime(),
          updatedAt: new Date('2026-09-01 09:30:00').getTime()
        },
        {
          id: 5,
          username: 'qianqi',
          realName: '钱七',
          cardNumber: 'RFID001005',
          shiftGroup: '三班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138005',
          createdAt: new Date('2026-08-10 08:40:00').getTime(),
          updatedAt: new Date('2026-09-11 11:20:00').getTime()
        },
        {
          id: 6,
          username: 'sunba',
          realName: '孙八',
          cardNumber: '',
          shiftGroup: '三班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138006',
          createdAt: new Date('2026-08-12 13:20:00').getTime(),
          updatedAt: new Date('2026-09-05 15:20:00').getTime()
        },
        {
          id: 7,
          username: 'zhoujiu',
          realName: '周九',
          cardNumber: 'RFID001007',
          shiftGroup: '维修班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138007',
          createdAt: new Date('2026-08-15 09:30:00').getTime(),
          updatedAt: new Date('2026-09-12 08:20:00').getTime()
        },
        {
          id: 8,
          username: 'wushi',
          realName: '吴十',
          cardNumber: 'RFID001008',
          shiftGroup: '维修班组',
          avatarUrl: '',
          status: 2,
          phone: '13800138008',
          createdAt: new Date('2026-07-20 10:10:00').getTime(),
          updatedAt: new Date('2026-08-30 17:30:00').getTime()
        },
        {
          id: 9,
          username: 'zhengwei',
          realName: '郑伟',
          cardNumber: 'RFID001009',
          shiftGroup: '一班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138009',
          createdAt: new Date('2026-08-20 08:30:00').getTime(),
          updatedAt: new Date('2026-09-13 10:10:00').getTime()
        },
        {
          id: 10,
          username: 'chenhao',
          realName: '陈浩',
          cardNumber: 'RFID001010',
          shiftGroup: '二班组',
          avatarUrl: '',
          status: 0,
          phone: '13800138010',
          createdAt: new Date('2026-08-22 11:20:00').getTime(),
          updatedAt: new Date('2026-09-02 13:40:00').getTime()
        },
        {
          id: 11,
          username: 'yangjun',
          realName: '杨军',
          cardNumber: 'RFID001011',
          shiftGroup: '三班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138011',
          createdAt: new Date('2026-08-25 08:50:00').getTime(),
          updatedAt: new Date('2026-09-13 14:20:00').getTime()
        },
        {
          id: 12,
          username: 'huangchao',
          realName: '黄超',
          cardNumber: '',
          shiftGroup: '维修班组',
          avatarUrl: '',
          status: 1,
          phone: '13800138012',
          createdAt: new Date('2026-08-28 09:10:00').getTime(),
          updatedAt: new Date('2026-09-12 16:40:00').getTime()
        }
      ]
    }
  },

  created() {
    this.getList()
  },

  methods: {
    getList() {
      this.listLoading = true

      setTimeout(() => {
        let data = [...this.allUsers]

        if (this.listQuery.username) {
          data = data.filter(item =>
            item.username
              .toLowerCase()
              .includes(this.listQuery.username.toLowerCase())
          )
        }

        if (this.listQuery.realName) {
          data = data.filter(item =>
            item.realName.includes(this.listQuery.realName)
          )
        }

        if (this.listQuery.cardNumber) {
          data = data.filter(item =>
            item.cardNumber.includes(this.listQuery.cardNumber)
          )
        }

        if (this.listQuery.shiftGroup) {
          data = data.filter(item =>
            item.shiftGroup === this.listQuery.shiftGroup
          )
        }

        if (this.listQuery.status !== '') {
          data = data.filter(item =>
            item.status === this.listQuery.status
          )
        }

        this.total = data.length

        const start =
          (this.listQuery.page - 1) * this.listQuery.limit
        const end = start + this.listQuery.limit

        this.list = data.slice(start, end)
        this.listLoading = false
      }, 300)
    },

    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    handleCreate() {
      this.dialogType = 'create'
      this.editUserId = null
      this.resetTempForm()
      this.dialogFormVisible = true

      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
    },

    handleEdit(row) {
      this.dialogType = 'edit'
      this.editUserId = row.id

      this.tempForm = {
        username: row.username,
        password: '',
        confirmPassword: '',
        realName: row.realName,
        cardNumber: row.cardNumber,
        shiftGroup: row.shiftGroup,
        avatarUrl: row.avatarUrl,
        status: row.status,
        phone: row.phone
      }

      this.dialogFormVisible = true

      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
    },

    resetTempForm() {
      this.tempForm = {
        username: '',
        password: '',
        confirmPassword: '',
        realName: '',
        cardNumber: '',
        shiftGroup: '',
        avatarUrl: '',
        status: 1,
        phone: ''
      }
    },

    submitForm() {
      this.$refs.userForm.validate(valid => {
        if (!valid) {
          return
        }

        if (this.dialogType === 'create') {
          this.createUser()
        } else {
          this.updateUser()
        }
      })
    },

    createUser() {
      const usernameExists = this.allUsers.some(
        item => item.username === this.tempForm.username
      )

      if (usernameExists) {
        this.$message.error('登录账号已存在')
        return
      }

      if (this.tempForm.cardNumber) {
        const cardExists = this.allUsers.some(
          item => item.cardNumber === this.tempForm.cardNumber
        )

        if (cardExists) {
          this.$message.error('该工卡/RFID已绑定其他用户')
          return
        }
      }

      const now = Date.now()

      const newUser = {
        id: this.getNextId(),
        username: this.tempForm.username,
        realName: this.tempForm.realName,
        cardNumber: this.tempForm.cardNumber,
        shiftGroup: this.tempForm.shiftGroup,
        avatarUrl: this.tempForm.avatarUrl,
        status: this.tempForm.status,
        phone: this.tempForm.phone,
        createdAt: now,
        updatedAt: now
      }

      this.allUsers.unshift(newUser)
      this.dialogFormVisible = false
      this.listQuery.page = 1
      this.getList()

      this.$message.success('用户创建成功')
    },

    updateUser() {
      const user = this.allUsers.find(
        item => item.id === this.editUserId
      )

      if (!user) {
        this.$message.error('用户不存在')
        return
      }

      const cardExists = this.allUsers.some(
        item =>
          item.id !== this.editUserId &&
          item.cardNumber &&
          item.cardNumber === this.tempForm.cardNumber
      )

      if (cardExists) {
        this.$message.error('该工卡/RFID已绑定其他用户')
        return
      }

      user.realName = this.tempForm.realName
      user.cardNumber = this.tempForm.cardNumber
      user.shiftGroup = this.tempForm.shiftGroup
      user.avatarUrl = this.tempForm.avatarUrl
      user.status = this.tempForm.status
      user.phone = this.tempForm.phone
      user.updatedAt = Date.now()

      this.dialogFormVisible = false
      this.getList()

      this.$message.success('用户信息修改成功')
    },

    getNextId() {
      if (this.allUsers.length === 0) {
        return 1
      }

      return Math.max(
        ...this.allUsers.map(item => item.id)
      ) + 1
    },

    handleDialogClose() {
      if (this.$refs.userForm) {
        this.$refs.userForm.resetFields()
      }

      this.resetTempForm()
      this.editUserId = null
    },

    handleReadCard() {
      const cardNumber = `RFID${String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, '0')}`

      const cardExists = this.allUsers.some(
        item => item.cardNumber === cardNumber
      )

      if (cardExists) {
        this.handleReadCard()
        return
      }

      this.tempForm.cardNumber = cardNumber
      this.$message.success(`读取工卡成功：${cardNumber}`)
    },

    handleDisable(row) {
      this.$confirm(
        `确定要禁用用户【${row.realName}】吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const user = this.allUsers.find(
          item => item.id === row.id
        )

        if (user) {
          user.status = 0
          user.updatedAt = Date.now()
        }

        this.getList()
        this.$message.success('用户已禁用')
      }).catch(() => {})
    },

    handleEnable(row) {
      this.$confirm(
        `确定要启用用户【${row.realName}】吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        const user = this.allUsers.find(
          item => item.id === row.id
        )

        if (user) {
          user.status = 1
          user.updatedAt = Date.now()
        }

        this.getList()
        this.$message.success('用户已启用')
      }).catch(() => {})
    },

    handleDelete(row) {
      this.$confirm(
        `确定要删除用户【${row.realName}】吗？`,
        '提示',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = this.allUsers.findIndex(
          item => item.id === row.id
        )

        if (index !== -1) {
          this.allUsers.splice(index, 1)
        }

        if (
          this.listQuery.page > 1 &&
          this.list.length === 1
        ) {
          this.listQuery.page--
        }

        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  padding: 4px 10px;
}

.user-info-text {
  margin-left: 12px;
  text-align: left;
}

.real-name {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.username {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.empty-text {
  color: #c0c4cc;
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

.time-column-wrap {
  display: block !important;
  white-space: normal !important;
  line-height: 1.4;
  word-break: break-all;
}

.time-date {
  display: inline-block;
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.time-clock {
  display: inline-block;
  color: #909399;
  font-size: 11px;
  font-family: monospace;
}

.card-input {
  display: flex;
  align-items: center;
}

.card-input .el-input {
  flex: 1;
}

.card-input .el-button {
  margin-left: 10px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 20px;
}
</style>
```
