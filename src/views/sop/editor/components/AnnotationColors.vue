<template>
  <div class="annotation-colors">
    <div class="color-palette" role="group" aria-label="常用标注颜色">
      <button
        v-for="color in colors"
        :key="color.value"
        type="button"
        class="color-swatch"
        :class="{ selected: isSelected(color.value) }"
        :style="{ backgroundColor: color.value, color: color.ink }"
        :title="color.name"
        :aria-label="color.name"
        :aria-pressed="isSelected(color.value)"
        :disabled="disabled"
        @click="$emit('input', color.value)"
      ><i v-if="isSelected(color.value)" class="el-icon-check" aria-hidden="true" /></button>
    </div>
    <div class="custom-color"><span>自定义</span><el-color-picker :value="value" :disabled="disabled" size="mini" @change="customColor" /><span class="color-value">{{ value }}</span></div>
  </div>
</template>
<script>
export default {
  name: 'AnnotationColors',
  props: { value: { type: String, default: '#409EFF' }, disabled: Boolean },
  data() {
    return { colors: [
      { name: '蓝色', value: '#409EFF', ink: '#fff' },
      { name: '绿色', value: '#67C23A', ink: '#17212e' },
      { name: '黄色', value: '#FADB14', ink: '#17212e' },
      { name: '橙色', value: '#E6A23C', ink: '#17212e' },
      { name: '红色', value: '#F56C6C', ink: '#17212e' },
      { name: '紫色', value: '#9254DE', ink: '#fff' },
      { name: '白色', value: '#FFFFFF', ink: '#17212e' },
      { name: '黑色', value: '#000000', ink: '#fff' }
    ] }
  },
  methods: {
    isSelected(color) { return String(this.value).toUpperCase() === color },
    customColor(value) { if (value) this.$emit('input', value) }
  }
}
</script>
<style scoped>
.color-palette { display: flex; flex-wrap: wrap; gap: 6px; padding: 3px; }
.color-swatch { display: flex; flex: 0 0 20px; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; border: 1px solid #c4cbd4; border-radius: 3px; cursor: pointer; font-size: 14px; }
.color-swatch.selected { outline: 2px solid #2465a6; outline-offset: 1px; }
.color-swatch:focus-visible { outline: 2px solid #2465a6; outline-offset: 1px; }
.color-swatch:disabled { cursor: not-allowed; opacity: .55; }
.custom-color { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 4px; font-size: 12px; line-height: 24px; color: #606266; }
.color-value { color: #909399; }
</style>
