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
import { fetchUserList, createUser, updateUser, deleteUser, updateUserStatus } from '@/api/user'

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
      }
    }
  },

  created() {
    this.getList()
  },

  methods: {
    getList() {
      this.listLoading = true
      fetchUserList(this.listQuery).then(response => {
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
      createUser(this.tempForm).then(() => {
        this.dialogFormVisible = false
        this.listQuery.page = 1
        this.getList()
        this.$message.success('用户创建成功')
      }).catch(err => {
        console.error(err)
      })
    },

    updateUser() {
      updateUser({ ...this.tempForm, id: this.editUserId }).then(() => {
        this.dialogFormVisible = false
        this.getList()
        this.$message.success('用户信息修改成功')
      }).catch(err => {
        console.error(err)
      })
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
        updateUserStatus(row.id, 0).then(() => {
          this.getList()
          this.$message.success('用户已禁用')
        }).catch(err => {
          console.error(err)
        })
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
        updateUserStatus(row.id, 1).then(() => {
          this.getList()
          this.$message.success('用户已启用')
        }).catch(err => {
          console.error(err)
        })
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
        deleteUser(row.id).then(() => {
          if (
            this.listQuery.page > 1 &&
            this.list.length === 1
          ) {
            this.listQuery.page--
          }

          this.getList()
          this.$message.success('删除成功')
        }).catch(err => {
          console.error(err)
        })
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
