<template>
  <div class="password-container">
    <el-card class="password-card">
      <h2>{{ mustChange ? '请先修改初始密码' : '修改密码' }}</h2>
      <p>修改成功后需要重新登录。</p>
      <el-form ref="passwordForm" :model="form" :rules="rules" label-position="top" @submit.native.prevent="submit">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="form.old_password" type="password" show-password maxlength="128" autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="form.new_password" type="password" show-password maxlength="128" autocomplete="new-password" placeholder="8至128个字符" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" show-password maxlength="128" autocomplete="new-password" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="saving">保存并重新登录</el-button>
        <el-button v-if="!mustChange" :disabled="saving" @click="$router.push('/')">返回首页</el-button>
        <el-button type="text" :disabled="saving" @click="logout">退出登录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script src="./js/change_password.js"></script>

<style lang="scss" scoped src="./styles/change_password.scss"></style>
