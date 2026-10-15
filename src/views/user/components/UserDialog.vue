
<template>
  <el-dialog
    :title="isCreate ? '新建用户' : '编辑用户'"
    :visible="visible"
    width="600px"
    @update:visible="$emit('update:visible', $event)"
    @open="initForm"
    @close="handleClose"
  >
    <el-form
      ref="userForm"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="登录账号" prop="username">
        <el-input
          v-model="form.username"
          placeholder="请输入登录账号"
          maxlength="64"
          :disabled="!isCreate"
        />
        <div v-if="!isCreate" class="form-tip">
          登录账号创建后不可修改
        </div>
      </el-form-item>

      <el-form-item
        v-if="isCreate"
        label="登录密码"
        prop="password"
      >
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入登录密码"
          show-password
        />
      </el-form-item>

      <el-form-item
        v-if="isCreate"
        label="确认密码"
        prop="confirmPassword"
      >
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入登录密码"
          show-password
        />
      </el-form-item>

      <el-form-item label="真实姓名" prop="real_name">
        <el-input
          v-model="form.real_name"
          placeholder="请输入真实姓名"
          maxlength="64"
        />
      </el-form-item>

      <el-form-item label="工卡/RFID" prop="card_number">
        <div class="card-input">
          <el-input
            v-model="form.card_number"
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

      <el-form-item label="所属班组" prop="shift_group">
        <el-select
          v-model="form.shift_group"
          placeholder="请选择所属班组"
          class="user-select"
        >
          <el-option
            v-for="item in shiftGroups"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="请输入联系电话"
          maxlength="20"
        />
      </el-form-item>

      <el-form-item label="头像地址" prop="avatar_url">
        <el-input
          v-model="form.avatar_url"
          placeholder="请输入头像图片地址"
          maxlength="255"
        />
      </el-form-item>

      <el-form-item label="账号状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="1">正常</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button
        :disabled="submitting"
        @click="$emit('update:visible', false)"
      >
        取消
      </el-button>

      <el-button
        type="primary"
        :loading="submitting"
        @click="submitForm"
      >
        {{ isCreate ? '确定创建' : '保存修改' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  createUser as createUserApi,
  updateUser as updateUserApi
} from '@/api/user'

import {
  createDefaultUserForm,
  createUserRules,
  createUserPayload,
  updateUserPayload
} from '../js/user_form'

export default {
  name: 'UserDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      form: createDefaultUserForm(),
      submitting: false,
      shiftGroups: [
        '一班组',
        '二班组',
        '三班组',
        '维修班组'
      ]
    }
  },

  computed: {
    isCreate() {
      return !this.user
    },

    rules() {
      return createUserRules(this.isCreate, this.form)
    }
  },

  methods: {
    initForm() {
      this.form = {
        ...createDefaultUserForm(),
        ...(this.user || {}),
        password: '',
        confirmPassword: ''
      }

      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
    },

    handleClose() {
      this.form = createDefaultUserForm()
      this.submitting = false
    },

    handleReadCard() {
      const number = String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, '0')

      this.form.card_number = `RFID${number}`
      this.$message.success(`读取工卡成功：${this.form.card_number}`)
    },

    submitForm() {
      if (this.submitting) return

      this.$refs.userForm.validate(async valid => {
        if (!valid) return

        this.submitting = true
        const operation = this.isCreate ? 'create' : 'edit'

        try {
          if (operation === 'create') {
            await createUserApi(createUserPayload(this.form))
            this.$message.success('用户创建成功')
          } else {
            await updateUserApi(
              this.user.id,
              updateUserPayload(this.form)
            )
            this.$message.success('用户信息修改成功')
          }

          this.$emit('update:visible', false)
          this.$emit('success', operation)
        } catch (error) {
          // 请求错误交由项目原有的 request.js 统一处理
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped src="../styles/user-dialog.scss"></style>
