<template>
  <div v-loading="loading" class="app-container">
    <div class="sop-toolbar">
      <el-button icon="el-icon-back" @click="back">返回</el-button><el-button @click="load">刷新</el-button><el-tag v-if="bound">项目使用版本</el-tag>
    </div>
    <el-alert
      v-if="failed"
      title="无法查看此版本，请确认访问权限及关联是否有效。"
      type="error"
      :closable="false"
    />
    <template v-if="revision">
      <el-card
        shadow="never"
        class="sop-card"
      ><div slot="header" class="sop-heading">
         <strong>{{ revision.title }} · V{{ revision.revision_no }}</strong><el-tag :type="revision.status === 1 ? 'success' : 'info'">{{
           ['草稿预览', '已发布', '已停用'][revision.status]
         }}</el-tag>
       </div>
        <p v-if="revision.applicable_scope" class="sop-text">适用范围：{{ revision.applicable_scope }}</p>
        <p v-if="revision.purpose" class="sop-text">目的：{{ revision.purpose }}</p>
        <p v-if="revision.precautions" class="sop-text">注意事项：{{ revision.precautions }}</p>
        <p v-if="revision.revision_note" class="sop-text">修订说明：{{ revision.revision_note }}</p></el-card>
      <el-card
        v-for="(step, index) in revision.steps"
        :key="step.id"
        shadow="never"
        class="sop-card"
      ><strong slot="header">{{ index + 1 }}. {{ step.title }}</strong>
        <div class="sop-text">{{ step.instruction }}</div>
        <p v-if="step.precautions" class="sop-text">注意事项：{{ step.precautions }}</p>
        <p v-if="step.check_requirements" class="sop-text">检查要求：{{ step.check_requirements }}</p>
        <p v-if="step.expected_duration_seconds != null" class="sop-note">
          参考时长：{{ step.expected_duration_seconds }} 秒
        </p>
        <p class="sop-note">检测等待：{{ step.detection_wait_seconds || 0 }} 秒</p><p v-if="step.voice_enabled === 1" class="sop-text">语音提示：{{ step.voice_text }}</p>
        <p v-if="step.workplace_requirements" class="sop-text">环境要求：{{ step.workplace_requirements }}</p><p v-for="req in step.resource_requirements" :key="req.model_id" class="sop-text">{{ req.name }} · {{ req.specification }} × {{ req.quantity }} {{ req.unit }}；{{ req.description }}</p>
        <annotated-image
          v-for="image in step.attachments"
          :key="image.id"
          v-bind="imageContext"
          :file-id="image.file_id"
          :visual="image.visual || null"
        /></el-card>
      <el-alert v-if="!revision.steps.length" title="此草稿尚未添加步骤" type="info" :closable="false" />
    </template>
  </div>
</template>
<script src="./js/sop_preview.js" />
<style scoped src="./styles/index.scss" lang="scss" />
