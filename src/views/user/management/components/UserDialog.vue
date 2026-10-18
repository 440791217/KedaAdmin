
<template>
  <el-dialog
    :title="isCreate ? '新建用户' : '编辑用户'"
    :visible="visible"
    width="600px"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
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
        </div>
      </el-form-item>

      <el-form-item label="所属班组" prop="team_id">
        <el-select
          v-model="form.team_id"
          placeholder="可暂不设置班组"
          clearable
          class="user-select"
        >
          <el-option
            v-for="item in teams"
            :key="item.id"
            :label="item.name + (item.status === 0 ? '（已禁用）' : '')"
            :value="item.id"
            :disabled="item.status !== 1"
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

      <el-form-item v-if="canAssign" label="用户角色" prop="role_ids">
        <el-select v-model="form.role_ids" multiple clearable class="user-select" placeholder="请选择角色">
          <el-option v-for="item in roleOptions" :key="item.id" :label="item.name" :value="item.id" :disabled="item.disabled" />
        </el-select>
        <div v-if="isCreate" class="form-tip">不选择时默认分配普通用户角色</div>
      </el-form-item>

      <el-form-item v-if="isCreate" label="账号状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="1">正常</el-radio>
          <el-radio :label="0">禁用</el-radio>
          <el-radio :label="2">离职</el-radio>
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

<script src="../js/user_dialog.js"></script>

<style lang="scss" scoped src="../styles/user-dialog.scss"></style>
