<template>
  <div class="execution-evidence">
    <template v-if="photo">
      <div class="evidence-stage"><div class="evidence-photo"><annotated-image :key="executionId + ':' + position" :execution-id="executionId" :evidence-position="position" :show-detection="false" @loaded="loaded = true" /><detection-boxes v-if="loaded" :result="result" :visual="visual" /><live-guidance-overlay v-if="loaded && showRegions" :states="states" :width="photo.image_width" :height="photo.image_height" /></div></div>
      <div class="evidence-caption"><el-checkbox v-model="showRegions">显示检测区域</el-checkbox><br>现场留存照片 · {{ time(photo.captured_at) }}<span v-if="photo.model_id"> · {{ photo.model_id }}</span> · {{ photo.automatic ? '自动检测通过' : '人工确认抓拍' }}</div>
    </template>
    <div v-else class="evidence-empty"><i class="el-icon-camera" /><strong>未留存现场照片</strong><span>该步骤没有现场照片记录，可查看参考图</span></div>
  </div>
</template>
<script>
import AnnotatedImage from '@/shared/sop/components/AnnotatedImage.vue'
import { stepImage } from '@/utils/step-image'
import { evaluateRegions } from '../js/live_regions'
import DetectionBoxes from './DetectionBoxes.vue'
import LiveGuidanceOverlay from './LiveGuidanceOverlay.vue'
export default {
  name: 'ExecutionEvidence',
  components: { AnnotatedImage, DetectionBoxes, LiveGuidanceOverlay },
  props: { executionId: { type: String, required: true }, position: { type: Number, required: true }, step: { type: Object, default: null }, photo: { type: Object, default: null }},
  data() { return { showRegions: false, loaded: false } },
  computed: {
    visual() { const image = stepImage(this.step); return image ? image.visual : null },
    result() { return this.photo ? { ...this.photo, detections: this.photo.detections || [] } : null },
    states() { return evaluateRegions(this.visual, this.result) }
  },
  watch: { position() { this.showRegions = false; this.loaded = false }, executionId() { this.loaded = false } },
  methods: { time(value) { return value ? String(value).replace('T', ' ').slice(0, 19) : '—' } }
}
</script>
<style scoped>
.execution-evidence { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.evidence-stage { display: flex; flex: 1; min-height: 0; align-items: center; justify-content: center; overflow: auto; background: #192536; padding: 16px; }
.evidence-photo { position: relative; width: 100%; margin: auto; }
.evidence-stage .annotated-image { width: 100%; margin: 0; min-height: 0; }
.evidence-caption ::v-deep .el-checkbox__label { font-size: 12px; }
.evidence-caption { padding: 10px 14px; color: #7a8ba0; font-size: 12px; line-height: 1.7; }
.evidence-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; background: #f5f7fb; color: #8797ab; font-size: 12px; text-align: center; }
.evidence-empty i { font-size: 36px; color: #b6c4d6; }
.evidence-empty strong { font-size: 14px; font-weight: 500; }
</style>
