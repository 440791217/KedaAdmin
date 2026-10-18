<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left" @submit.native.prevent="handleLogin">

      <div class="title-container">
        <h3 class="title">SOP管理端</h3>
      </div>

      <el-form-item prop="account">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="account"
          v-model="loginForm.account"
          placeholder="账号"
          name="account"
          type="text"
          tabindex="1"
          autocomplete="username"
          maxlength="64"
        />
      </el-form-item>

      <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
        <el-form-item prop="password">
          <span class="svg-container">
            <svg-icon icon-class="password" />
          </span>
          <el-input
            :key="passwordType"
            ref="password"
            v-model="loginForm.password"
            :type="passwordType"
            placeholder="密码"
            name="password"
            tabindex="2"
            autocomplete="current-password"
            maxlength="128"
            @keyup.native="checkCapslock"
            @blur="capsTooltip = false"
          />
          <span class="show-pwd" @click="showPwd">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
      </el-tooltip>

      <el-button :loading="loading" type="primary" native-type="submit" style="width:100%;margin-bottom:30px;">登 录</el-button>

      <div style="position:relative">
        <div class="tips" />
        <div class="tips" />
      </div>
    </el-form>
  </div>
</template>

<script src="../js/login_form.js"></script>

<style lang="scss" src="../styles/login_inputs.scss"></style>

<style lang="scss" scoped src="../styles/login.scss"></style>
