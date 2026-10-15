<template>
  <div class="step-details-content">
    <section v-if="step" class="step-detail" aria-label="当前步骤配置">
      <div class="step-detail-heading">
        <span class="step-detail-name" :title="step.name">{{ step.name }}</span>
        <el-button type="text" size="mini" @click="$emit('edit-step', step)">编辑</el-button>
      </div>
      <dl class="step-settings">
        <div class="step-setting-row">
          <dt>等待时间</dt>
          <dd>{{ step.waitTime ? `${step.waitTime} 秒` : '立即检测' }}</dd>
        </div>
        <div class="step-setting-row">
          <dt>语音提示</dt>
          <dd :class="{ 'is-muted': !step.voiceEnabled }">{{ step.voiceEnabled ? '已启用' : '未启用' }}</dd>
        </div>
      </dl>
      <div v-if="step.voiceEnabled && step.voiceText" class="step-guide-block">
        <div class="step-guide-label">语音内容</div>
        <p>{{ step.voiceText }}</p>
      </div>
      <div class="step-guide-block">
        <div class="step-guide-label">文字引导</div>
        <p :class="{ 'is-muted': !step.textGuide }">{{ step.textGuide || '暂未设置' }}</p>
      </div>
      <div class="step-guide-block">
        <div class="step-guide-label">图片引导 <span v-if="step.imageGuide">点击查看大图</span></div>
        <el-image
          v-if="step.imageGuide"
          class="step-detail-image"
          :src="step.imageGuide"
          :preview-src-list="[step.imageGuide]"
          fit="contain"
        />
        <p v-else class="is-muted">暂未设置</p>
      </div>
    </section>
    <div v-if="!step" class="empty-step">请先添加并选择一个步骤</div>
  </div>
</template>

<script>
export default {
  name: 'StepDetails',
  props: {
    step: { type: Object, default: null }
  }
}
</script>
