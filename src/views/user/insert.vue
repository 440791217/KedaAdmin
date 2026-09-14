<template>
  <div class="user-create-page">
    <el-card class="form-card" shadow="never">
      <div slot="header" class="card-header">
        <span>新建用户</span>
      </div>

      <el-form
        ref="userForm"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="user-form"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>

          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item label="登录账号" prop="username">
                <el-input
                  v-model.trim="form.username"
                  placeholder="请输入登录账号"
                  maxlength="64"
                  show-word-limit
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="真实姓名" prop="realName">
                <el-input
                  v-model.trim="form.realName"
                  placeholder="请输入真实姓名"
                  maxlength="64"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item label="登录密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入登录密码"
                  maxlength="64"
                  show-password
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入登录密码"
                  maxlength="64"
                  show-password
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input
                  v-model.trim="form.phone"
                  placeholder="请输入联系电话"
                  maxlength="20"
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="工卡/RFID" prop="cardNumber">
                <el-input
                  v-model.trim="form.cardNumber"
                  placeholder="请输入工卡/RFID物理卡号"
                  maxlength="64"
                >
                  <el-button
                    slot="append"
                    icon="el-icon-postcard"
                    @click="readCard"
                  >
                    读卡
                  </el-button>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 工作信息 -->
        <div class="form-section">
          <div class="section-title">工作信息</div>

          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item label="所属班组" prop="shiftGroup">
                <el-select
                  v-model="form.shiftGroup"
                  placeholder="请选择所属班组"
                  clearable
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in shiftGroupOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="账号状态" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio :label="1">正常</el-radio>
                  <el-radio :label="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 用户头像 -->
        <div class="form-section">
          <div class="section-title">用户照片</div>

          <el-form-item label="头像/照片">
            <el-upload
              class="avatar-uploader"
              action=""
              :show-file-list="false"
              :http-request="uploadAvatar"
              :before-upload="beforeAvatarUpload"
            >
              <img
                v-if="form.avatarUrl"
                :src="form.avatarUrl"
                class="avatar"
              >

              <i
                v-else
                class="el-icon-plus avatar-uploader-icon"
              />
            </el-upload>

            <div class="upload-tip">
              支持 JPG、PNG 格式，建议尺寸 200×200
            </div>
          </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <div class="form-footer">
          <el-button @click="handleCancel">
            取消
          </el-button>

          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            保存用户
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'UserCreate',

  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      submitting: false,

      form: {
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

      shiftGroupOptions: [
        {
          label: '一班组',
          value: '一班组'
        },
        {
          label: '二班组',
          value: '二班组'
        },
        {
          label: '三班组',
          value: '三班组'
        },
        {
          label: '维修班组',
          value: '维修班组'
        }
      ],

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
            message: '账号长度为 3-64 个字符',
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
            max: 64,
            message: '密码长度为 6-64 个字符',
            trigger: 'blur'
          }
        ],

        confirmPassword: [
          {
            required: true,
            validator: validateConfirmPassword,
            trigger: 'blur'
          }
        ],

        realName: [
          {
            required: true,
            message: '请输入真实姓名',
            trigger: 'blur'
          },
          {
            max: 64,
            message: '姓名长度不能超过 64 个字符',
            trigger: 'blur'
          }
        ],

        cardNumber: [
          {
            max: 64,
            message: '工卡号不能超过 64 个字符',
            trigger: 'blur'
          }
        ],

        shiftGroup: [
          {
            required: true,
            message: '请选择所属班组',
            trigger: 'change'
          }
        ],

        phone: [
          {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号码',
            trigger: 'blur'
          }
        ],

        status: [
          {
            required: true,
            message: '请选择账号状态',
            trigger: 'change'
          }
        ]
      }
    }
  },

  methods: {
    /**
     * 提交表单
     */
    handleSubmit() {
      this.$refs.userForm.validate(valid => {
        if (!valid) {
          return
        }

        this.submitting = true

        // 实际项目中这里调用后端接口
        const requestData = {
          username: this.form.username,
          password: this.form.password,
          realName: this.form.realName,
          cardNumber: this.form.cardNumber || null,
          shiftGroup: this.form.shiftGroup || null,
          avatarUrl: this.form.avatarUrl || null,
          status: this.form.status,
          phone: this.form.phone || null
        }

        console.log('提交用户数据:', requestData)

        // 示例：
        //
        // createUser(requestData)
        //   .then(() => {
        //     this.$message.success('用户创建成功')
        //     this.$router.push('/system/user')
        //   })
        //   .finally(() => {
        //     this.submitting = false
        //   })

        setTimeout(() => {
          this.submitting = false
          this.$message.success('用户创建成功')
          this.$router.back()
        }, 500)
      })
    },

    /**
     * 取消
     */
    handleCancel() {
      this.$confirm(
        '确定放弃当前填写的内容吗？',
        '提示',
        {
          type: 'warning'
        }
      )
        .then(() => {
          this.$router.back()
        })
        .catch(() => {})
    },

    /**
     * RFID 读卡
     *
     * 实际项目中这里可以调用：
     * WebSocket / 本地客户端 / USB RFID 读卡器
     */
    readCard() {
      // 示例模拟
      this.$message.info('等待 RFID 读卡器读取卡号...')

      // 实际项目：
      // this.form.cardNumber = cardNumber
    },

    /**
     * 图片上传前校验
     */
    beforeAvatarUpload(file) {
      const isImage =
        file.type === 'image/jpeg' ||
        file.type === 'image/png'

      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('头像只能上传 JPG 或 PNG 图片')
        return false
      }

      if (!isLt2M) {
        this.$message.error('头像图片大小不能超过 2MB')
        return false
      }

      return true
    },

    /**
     * 上传头像
     */
    uploadAvatar(option) {
      const file = option.file

      // 实际项目中调用文件上传接口
      //
      // uploadFile(file).then(res => {
      //   this.form.avatarUrl = res.data.url
      // })

      // 临时预览
      const reader = new FileReader()

      reader.onload = event => {
        this.form.avatarUrl = event.target.result
      }

      reader.readAsDataURL(file)
    }
  }
}
</script>

<style scoped>
.user-create-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.form-card {
  max-width: 1100px;
  margin: 0 auto;
  border: none;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.user-form {
  padding: 10px 20px 20px;
}

.form-section {
  margin-bottom: 30px;
}

.section-title {
  position: relative;
  margin-bottom: 25px;
  padding-left: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 3px;
  height: 16px;
  background: #409eff;
  border-radius: 2px;
}

.avatar-uploader {
  display: inline-block;
}

.avatar-uploader ::v-deep .el-upload {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
}

.avatar-uploader ::v-deep .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.form-footer {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.form-footer .el-button {
  min-width: 100px;
}
</style>
