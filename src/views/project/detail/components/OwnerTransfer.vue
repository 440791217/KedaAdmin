<template>
  <el-dialog title="转移负责人" :visible="visible" width="540px" :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving" @open="init" @update:visible="close">
    <el-form ref="form" :model="form" label-width="100px" :disabled="saving">
      <el-form-item label="交接范围">{{ entity ? entity.name : project.name }}</el-form-item>
      <el-form-item label="当前负责人">{{ entity ? entity.owner_name : project.owner_name }}</el-form-item>
      <el-form-item label="新负责人" prop="owner_user_id" :rules="[{ required: true, message: '请选择新负责人' }]">
        <el-select v-model="form.owner_user_id" filterable remote :remote-method="search" :loading="loading" style="width:100%" placeholder="搜索姓名或账号"><el-option v-for="user in options" :key="user.id" :value="user.id" :label="`${user.real_name}（${user.username}）`" /></el-select>
      </el-form-item>
      <el-alert :title="entity ? '新负责人必须是本项目有效编辑成员。' : '新负责人自动成为编辑成员，旧负责人保留编辑身份。转移后，你的管理权限将按新身份重新计算。'" type="info" :closable="false" />
    </el-form>
    <span slot="footer"><el-button :disabled="saving" @click="close(false)">取消</el-button><el-button type="primary" :loading="saving" @click="save">确认交接</el-button></span>
  </el-dialog>
</template>
<script src="../js/owner_transfer.js" />
