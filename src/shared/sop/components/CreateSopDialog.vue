<template>
  <el-dialog
    title="新建 SOP"
    :visible="visible"
    width="560px"
    :close-on-click-modal="false"
    :show-close="!busy"
    :close-on-press-escape="!busy"
    @open="init"
    @update:visible="close"
  ><el-form
    ref="form"
    :model="form"
    :rules="rules"
    label-width="90px"
    :disabled="busy"
  ><el-form-item label="编号" prop="code"><el-input :value="form.code" readonly /><div class="sop-note">自动生成，保存失败重试时沿用此编号。</div></el-form-item><el-form-item label="名称" prop="name"><el-input v-model="form.name" maxlength="128" /></el-form-item><el-form-item
    label="管理项目"
    prop="managing_project_id"
  ><el-select
    v-model="form.managing_project_id"
    filterable
    remote
    :remote-method="searchProjects"
    :loading="projectLoading"
    style="width: 100%"
    @change="projectChanged"
  ><el-option
    v-for="p in projects"
    :key="p.id"
    :value="p.id"
    :label="`${p.name}（${p.code}）`"
  /></el-select></el-form-item><el-form-item
    label="负责人"
    prop="owner_user_id"
  ><el-select
    v-model="form.owner_user_id"
    :disabled="!form.managing_project_id"
    filterable
    remote
    :remote-method="searchOwners"
    :loading="ownerLoading"
    style="width: 100%"
  ><el-option
    v-for="p in owners"
    :key="p.id"
    :value="p.id"
    :label="`${p.real_name}（${p.username}）`"
  /></el-select></el-form-item>
    <div class="sop-note">管理项目负责协作和权限；发布后可将固定版本关联到项目或子项目使用。</div></el-form><span
    slot="footer"
  ><el-button :disabled="busy" @click="close(false)">取消</el-button><el-button type="primary" :loading="busy" @click="save">创建并编写</el-button></span></el-dialog>
</template>
<script src="../js/create_sop_dialog.js" />
<style scoped src="../styles/sop.scss" lang="scss" />
