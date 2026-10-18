<template>
  <div v-loading="loading">
    <el-alert
      v-if="failed"
      title="任务内容加载失败，请重新打开重试"
      type="error"
      :closable="false"
    /><template
      v-if="revision"
    ><h3>{{ revision.title }} · V{{ revision.revision_no }}</h3>
      <el-card
        v-for="(step, index) in revision.steps"
        :key="step.id"
        shadow="never"
      ><h4>{{ index + 1 }}. {{ step.title }}</h4>
        <p class="standard-text">{{ step.instruction }}</p>
        <p v-if="step.precautions" class="standard-text">
          注意事项：{{ step.precautions }}
        </p>
        <p v-if="step.check_requirements" class="standard-text">
          检查要求：{{ step.check_requirements }}
        </p>
        <p v-if="step.workplace_requirements" class="standard-text">
          环境要求：{{ step.workplace_requirements }}
        </p>
        <p v-for="req in step.resource_requirements" :key="req.model_id">
          {{ req.name }} · {{ req.specification }} × {{ req.quantity }}
          {{ req.unit }}；{{ req.description }}
        </p>
        <annotated-image
          v-for="image in step.attachments"
          :key="image.id"
          :project-id="projectId"
          :subproject-id="subprojectId"
          :task-id="sopId ? '' : taskId"
          :sop-id="sopId"
          :revision-id="revisionId"
          :file-id="image.file_id"
          :visual="image.visual || null"
        /></el-card></template>
  </div>
</template>
<script src="../js/task_standard.js" />
<style scoped>
.standard-text {
  white-space: pre-wrap;
  line-height: 1.7;
}
.el-card {
  margin-bottom: 16px;
}
</style>
