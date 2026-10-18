<template>
  <div v-loading="loading" class="annotated-image">
    <visual-canvas
      v-if="url"
      :src="url"
      :width="width"
      :height="height"
      :items="items"
      readonly
      @loaded="imageLoaded"
    />
    <div v-else-if="failed">图片加载失败 <el-button type="text" @click="load">重试</el-button></div>
    <div v-if="visual && visual.detection_regions.length" class="sop-note">
      虚线框为检测区域配置，未执行识别。
      <details><summary>查看检测区域参数（{{ visual.detection_regions.length }}项）</summary>
        <p v-for="region in visual.detection_regions" :key="region.id">
          {{ region.name }} · {{ region.enabled ? '启用' : '停用' }} · {{ {object:'目标存在',count:'数量',status:'状态',ocr:'OCR文字'}[region.detect_type] }}
          · 置信度 {{ region.confidence }}%
          <span v-if="region.class_name"> · 类别：{{ region.class_name }}</span>
          <span v-if="region.detect_type==='count'"> · 期望数量：{{ region.expected_count }}</span>
          <span v-if="region.detect_type==='ocr'"> · 期望文字：{{ region.expected_text }}</span>
          <span v-if="region.detect_type==='status'"> · 期望状态：{{ region.expected_state }}</span>
        </p>
      </details>
    </div>
  </div>
</template>
<script>
import image from '../js/protected_image.js'
import VisualCanvas from './VisualCanvas.vue'
export default {
  name: 'AnnotatedImage',
  components: { VisualCanvas },
  extends: image,
  props: { visual: { type: Object, default: null }},
  data() {
    return { dimensions: { width: 1000, height: 600 }}
  },
  computed: {
    width() {
      return this.visual ? this.visual.image_width : this.dimensions.width
    },
    height() {
      return this.visual ? this.visual.image_height : this.dimensions.height
    },
    items() {
      return this.visual ? [...this.visual.guide_items, ...this.visual.detection_regions] : []
    }
  },
  methods: {
    imageLoaded(dimensions) { this.dimensions = dimensions; this.$emit('loaded', dimensions) }
  }
}
</script>
<style scoped>
.annotated-image {
  max-width: 100%;
  width: 800px;
  margin: 16px 0;
  min-height: 60px;
}
.sop-note {
  color: #909399;
  font-size: 12px;
  line-height: 1.7;
}
</style>
