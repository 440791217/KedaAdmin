<template>
  <div :class="{ 'compact-fields': compact }">
    <template v-for="field in fields">
      <h5 v-if="grouped" :key="'group-' + field.key" class="field-group-title">{{ field.key === 'refresh_fps' ? '画面' : '视觉检测' }}</h5>
      <el-form-item :key="field.key" :label="compact ? undefined : field.label">
        <div v-if="compact" class="field-copy"><span>{{ field.label }}</span><small>{{ field.key === 'refresh_fps' ? '0 为跟随源流，仅控制画面绘制' : '处理忙时跳过，不积压' }}</small></div>
        <div class="field-controls">
          <el-switch v-if="inherit" :value="value[field.key] == null" :disabled="disabled" active-text="使用公共参数" @change="set(field.key, $event ? null : field.default)" />
          <el-input-number v-if="!inherit || value[field.key] != null" :value="value[field.key]" :min="field.min" :max="field.max" :precision="0" :disabled="disabled" size="small" @change="set(field.key, $event)" />
          <span v-if="compact" class="field-unit">帧/秒</span>
        </div>
        <small v-if="!compact">{{ field.key === 'refresh_fps' ? '帧/秒；0 为跟随源流，仅控制画面绘制' : '帧/秒；处理忙时跳过，不积压' }}</small>
      </el-form-item>
    </template>
  </div>
</template>
<script>
export default {
  name: 'FrameRateFields',
  props: { value: { type: Object, required: true }, inherit: Boolean, disabled: Boolean, compact: Boolean, grouped: Boolean },
  data() { return { fields: [{ key: 'refresh_fps', label: '刷新帧率', min: 0, max: 120, default: 0 }, { key: 'detect_fps', label: '检测帧率', min: 1, max: 60, default: 2 }] } },
  methods: { set(key, value) { this.$emit('input', { ...this.value, [key]: value }) } }
}
</script>
<style scoped>
small { display: block; color: #909399; font-size: 12px; line-height: 1.7; }
.el-switch { margin-right: 12px; }
.field-group-title { margin: 6px 0 0; font-size: 13px; font-weight: 600; color: #303133; }
.field-group-title:not(:first-child) { margin-top: 12px; padding-top: 18px; border-top: 1px solid #ebeef5; }
.field-controls { display: inline-flex; align-items: center; gap: 8px; }
.field-unit { color: #909399; font-size: 12px; white-space: nowrap; }
.field-copy { font-size: 13px; color: #606266; }
.compact-fields ::v-deep .el-form-item { margin-bottom: 0; padding: 12px 0; }
.compact-fields ::v-deep .el-form-item__content { display: flex; align-items: center; justify-content: space-between; gap: 20px; line-height: 1.6; }
.compact-fields ::v-deep .el-form-item__content::before,
.compact-fields ::v-deep .el-form-item__content::after { display: none; }
.compact-fields ::v-deep .el-input-number { width: 128px; }
@media (max-width: 480px) { .compact-fields ::v-deep .el-form-item__content { align-items: flex-start; flex-direction: column; gap: 8px; } }
</style>
