<template>
  <el-dialog :title="`${entity ? '编辑' : '新建'}${projectId ? '子项目' : '项目'}`" :visible="visible" width="560px" :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving" @open="initForm" @update:visible="close">
    <el-form ref="form" :model="form" :rules="rules" label-width="90px" :disabled="saving">
      <el-form-item label="编号" prop="code"><el-input :value="form.code" readonly /><div v-if="!entity" class="project-hint">自动生成，保存失败重试时沿用此编号。</div></el-form-item>
      <el-form-item label="名称" prop="name"><el-input v-model="form.name" :disabled="!canEditProfile" maxlength="128" /></el-form-item>
      <el-form-item v-if="!projectId" label="客户名称"><el-input v-model="form.customer_name" :disabled="!canEditProfile" maxlength="128" clearable /></el-form-item>
      <el-form-item label="负责人" prop="owner_user_id">
        <el-select v-model="form.owner_user_id" :disabled="!!entity" filterable remote :remote-method="searchOwners" :loading="ownersLoading" placeholder="输入姓名或账号搜索" style="width: 100%">
          <el-option v-for="owner in owners" :key="owner.id" :label="`${owner.real_name}（${owner.username}）`" :value="owner.id" />
        </el-select>
        <div v-if="entity" class="project-hint"><el-button v-if="entity.can_transfer_owner" type="text" :disabled="saving" @click="changeOwner">调整负责人</el-button><span v-else>当前账号无负责人调整权限。</span></div>
        <div v-else-if="projectId" class="project-hint">仅可选择本项目的有效编辑成员。</div>
      </el-form-item>
      <el-form-item label="说明"><el-input v-model="form.description" :disabled="!canEditProfile" type="textarea" :rows="4" maxlength="5000" show-word-limit /></el-form-item>
    </el-form>
    <span slot="footer"><el-button :disabled="saving" @click="close(false)">取消</el-button><el-button v-if="canEditProfile" type="primary" :loading="saving" @click="save">保存</el-button></span>
  </el-dialog>
</template>
<script src="../js/entity_dialog.js" />
<style scoped src="../styles/project.scss" lang="scss" />
