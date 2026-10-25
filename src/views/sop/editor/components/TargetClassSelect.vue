<template>
  <div>
    <el-select :value="value" filterable :loading="loading" placeholder="搜索并选择模型类别" style="width: 100%" @change="$emit('input', $event)">
      <el-option v-if="value && !options.some(item => item.name === value)" :value="value" :label="classLabel(value) + '（历史配置，当前模型未提供）'" disabled />
      <el-option v-for="item in options" :key="item.name" :value="item.name" :label="classLabel(item.name) + ' · ' + item.models.join(' / ')" />
    </el-select>
    <p class="class-hint">类别读取自检测服务的就绪模型，现场请选择对应模型。<el-button type="text" :loading="loading" @click="load">刷新类别</el-button></p>
    <p v-if="error" class="class-error" role="alert">{{ error }}</p>
    <div v-if="referenceSrc && region" class="class-recommend">
      <el-select v-if="models.length > 1" v-model="recommendModel" size="small" placeholder="选择推荐模型"><el-option v-for="model in models" :key="model.id" :value="model.id" :label="model.id" /></el-select>
      <el-button size="small" :loading="predicting" :disabled="loading || !recommendModel" @click="recommend">从参考图识别推荐</el-button>
      <p class="class-hint">识别当前区域内的物品，点击候选选用；模型不支持的物品无法自动新增类别。</p>
    </div>
    <el-dialog title="候选类别 TOP 5" :visible.sync="recommendOpen" width="520px" append-to-body @close="clearRecommendation">
      <p v-if="predicting" role="status"><i class="el-icon-loading" /> 正在识别参考图中的选定区域，请稍候…</p>
      <template v-else>
        <p v-if="suggestions.length" class="recommend-title">按置信度排序 · 当前 {{ suggestions.length }} 类，点击选用</p>
        <el-button v-for="(item, index) in suggestions" :key="item.name" size="small" class="suggestion" @click="choose(item.name)"><span class="recommend-rank">{{ index + 1 }}</span> {{ classLabel(item.name) }} · {{ (item.confidence * 100).toFixed(1) }}%</el-button>
        <p v-if="recommendMessage" class="class-hint" role="status">{{ recommendMessage }}</p>
      </template>
      <span slot="footer"><el-button @click="recommendOpen = false">关闭</el-button></span>
    </el-dialog>
  </div>
</template>
<script>
import { createDetectionClient } from '@/utils/detection-service'
import { classLabel } from '@/utils/detection-classes'
import { cropReference } from '@/utils/crop-reference'
export default {
  name: 'TargetClassSelect',
  props: { value: { type: String, default: '' }, referenceSrc: { type: String, default: '' }, region: { type: Object, default: null }},
  data() { return { loading: false, options: [], error: '', models: [], recommendModel: '', predicting: false, suggestions: [], recommendMessage: '', recommendOpen: false } },
  watch: {
    referenceSrc() { this.clearRecommendation() },
    region: { deep: true, handler() { this.clearRecommendation() } },
    recommendModel() { this.clearRecommendation() }
  },
  mounted() { this.load() },
  beforeDestroy() { if (this._request) this._request.abort(); this._request = null; this.clearRecommendation() },
  methods: {
    classLabel,
    choose(name) { this.$emit('input', name); this.recommendOpen = false },
    clearRecommendation() {
      if (this._prediction) this._prediction.abort()
      this._prediction = null; this.predicting = false; this.suggestions = []; this.recommendMessage = ''; this.recommendOpen = false
    },
    async recommend() {
      this.clearRecommendation()
      if (!this.referenceSrc || !this.region || !this.recommendModel) return
      const controller = new AbortController(); this._prediction = controller
      const timeout = setTimeout(() => controller.abort(), 20000)
      const region = { ...this.region }
      this.predicting = true
      this.recommendOpen = true
      try {
        const image = await fetch(this.referenceSrc, { signal: controller.signal, credentials: 'omit' })
        if (!image.ok) throw new Error('参考图片读取失败，请重新加载图片')
        const blob = await image.blob()
        if (this._prediction !== controller) return
        const crop = await cropReference(blob, region, controller.signal)
        if (this._prediction !== controller) return
        const metadata = { model_id: this.recommendModel, frame_id: 'authoring-' + Date.now(), confidence: 0.25 }
        const result = await createDetectionClient().predict(crop.blob, metadata, controller.signal)
        if (this._prediction !== controller) return
        if (!result.context || result.context.frame_id !== metadata.frame_id || result.context.model_id !== metadata.model_id || !(result.image_width > 0 && result.image_height > 0) || !Array.isArray(result.detections)) throw new Error('推荐结果格式不正确，请重试')
        const candidates = new Map()
        result.detections.forEach(item => {
          const box = item.bbox_xyxy
          if (!Array.isArray(box) || box.length !== 4 || !box.every(Number.isFinite) || !Number.isFinite(item.confidence)) return
          const x = (box[0] + box[2]) / 2 / result.image_width; const y = (box[1] + box[3]) / 2 / result.image_height
          if (x < crop.region.x || x > crop.region.x + crop.region.width || y < crop.region.y || y > crop.region.y + crop.region.height) return
          if (!this.options.some(option => option.name === item.class_name && option.models.includes(metadata.model_id))) return
          if (!candidates.has(item.class_name) || candidates.get(item.class_name).confidence < item.confidence) candidates.set(item.class_name, { name: item.class_name, confidence: item.confidence })
        })
        this.suggestions = Array.from(candidates.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 5)
        this.recommendMessage = this.suggestions.length ? '请点击正确的候选类别确认选用' : '当前区域未识别到可用目标，请调整参考图片或换用支持该物品的模型'
      } catch (error) {
        if (this._prediction === controller) this.recommendMessage = error.name === 'AbortError' ? '识别推荐超时，请重试' : error.message
      } finally { clearTimeout(timeout); if (this._prediction === controller) { this._prediction = null; this.predicting = false } }
    },
    async load() {
      if (this._request) this._request.abort()
      const controller = new AbortController(); this._request = controller
      const timeout = setTimeout(() => controller.abort(), 8000)
      this.loading = true; this.error = ''
      try {
        const data = await createDetectionClient().models(controller.signal)
        if (this._request !== controller) return
        this.models = data.models.filter(model => model.status === 'ready')
        if (!this.models.some(model => model.id === this.recommendModel)) this.recommendModel = (this.models[0] || {}).id || ''
        const names = new Map()
        data.models.filter(model => model.status === 'ready').forEach(model => {
          const classes = model.classes || []
          classes.forEach(item => {
            if (!names.has(item.name)) names.set(item.name, { name: item.name, models: [] })
            names.get(item.name).models.push(model.id)
          })
        })
        this.options = Array.from(names.values())
        if (!this.options.length) this.error = '没有可用类别，请确认检测模型已加载后刷新'
      } catch (error) {
        if (this._request === controller) { this.options = []; this.models = []; this.recommendModel = ''; this.error = error.name === 'AbortError' ? '读取类别超时，请检查检测服务后刷新' : error.message }
      } finally { clearTimeout(timeout); if (this._request === controller) this.loading = false }
    }
  }
}
</script>
<style scoped>
.class-hint { color: #909399; font-size: 12px; line-height: 1.6; margin: 6px 0 0; }
.class-error { color: #e6a23c; font-size: 12px; line-height: 1.6; margin: 0; }
.class-recommend { margin-top: 8px; }
.class-recommend .el-select { width: 100%; margin-bottom: 8px; }
.suggestion { margin: 6px 6px 0 0; }
.recommend-title { font-size: 12px; color: #606266; margin: 10px 0 0; }
.suggestion { display: block; width: 100%; margin-left: 0; text-align: left; white-space: normal; line-height: 1.5; }
.recommend-rank { display: inline-block; min-width: 18px; color: #409eff; font-weight: 600; }
</style>
