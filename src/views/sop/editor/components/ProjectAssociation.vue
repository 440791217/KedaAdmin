<template>
  <el-dialog
    title="关联当前SOP版本到项目"
    :visible="visible"
    width="600px"
    :close-on-click-modal="false"
    :show-close="!busy"
    :close-on-press-escape="!busy"
    @open="init"
    @update:visible="close"
  >
    <p>{{ document.code }} · {{ revision.title }} · V{{ revision.revision_no }}</p>
    <el-form
      label-width="90px"
    ><el-form-item
       label="项目"
     ><el-select
       v-model="projectId"
       filterable
       remote
       :remote-method="search"
       :disabled="busy"
       placeholder="搜索项目编号或名称"
       style="width: 100%"
       @change="projectChanged"
     ><el-option
       v-for="p in projects"
       :key="p.id"
       :value="p.id"
       :label="`${p.code} · ${p.name}`"
       :disabled="p.status >= 2"
     /></el-select></el-form-item>
      <el-form-item
        label="关联范围"
      ><el-select
        v-model="subId"
        :disabled="busy || !projectId"
        style="width: 100%"
        @change="loadTarget"
      ><el-option label="整个项目" value="" /><el-option
        v-for="s in children"
        :key="s.id"
        :value="s.id"
        :label="`${s.code} · ${s.name}`"
        :disabled="s.status >= 2"
      /></el-select></el-form-item></el-form>
    <el-alert
      v-if="projectId && !loading && target && !target.can_manage"
      title="此范围不可管理SOP关联，请选择具有权限且未完成或归档的项目。"
      type="warning"
      :closable="false"
    />
    <p class="sop-note">关联固定到当前发布版本。再次关联同一SOP会更新原关联，不自动升级其他项目。</p>
    <span
      slot="footer"
    ><el-button :disabled="busy" @click="close(false)">取消</el-button><el-button
      type="primary"
      :loading="busy || loading"
      :disabled="!target || !target.can_manage || loading"
      @click="save"
    >确认关联</el-button></span>
  </el-dialog>
</template>
<script src="../js/project_association.js" />
<style scoped>
.sop-note {
  font-size: 12px;
  color: #909399;
  line-height: 1.8;
}
</style>
