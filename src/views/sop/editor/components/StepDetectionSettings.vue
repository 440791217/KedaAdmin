<template>
  <div class="step-detection-settings">
    <el-form-item label="启用视觉检测"><el-switch :value="value.enabled" @change="update({ enabled: $event })" /></el-form-item>
    <div class="detection-source">
      <p><span>检测相机</span>{{ cameraName }}</p>
      <p><span>检测图片</span>{{ value.attachment_id ? '已选择拍摄照片' : '尚未选择' }}</p>
      <el-button size="mini" icon="el-icon-camera" :disabled="!stationId" @click="$emit('camera')">{{ value.attachment_id ? '重新拍照' : '相机拍照' }}</el-button>
      <p class="settings-hint">选择相机拍照并确认后，自动将相机和照片用于本步骤检测。</p>
      <p v-if="value.enabled && !value.attachment_id" class="settings-warning">请先拍照选择检测图片。</p>
      <p v-if="error" class="settings-warning">{{ error }}<el-button type="text" @click="load">重试</el-button></p>
    </div>
  </div>
</template>
<script>
import { fetchResource } from '@/api/resource'
export default {
  name: 'StepDetectionSettings',
  props: { value: { type: Object, required: true }, stationId: { type: String, default: '' }},
  data() { return { cameras: [], loading: false, error: '', sequence: 0 } },
  computed: { cameraName() { const camera = this.cameras.find(c => String(c.id) === this.value.camera_id); return camera ? camera.name : this.value.camera_id ? '绑定相机暂不可用' : '尚未选择' } },
  watch: { stationId: { immediate: true, handler() { this.load() } }},
  beforeDestroy() { this.sequence++ },
  methods: {
    update(patch) { this.$emit('input', { ...this.value, ...patch }) },
    async load() {
      const seq = ++this.sequence
      this.cameras = []; this.error = ''; this.loading = false
      if (!this.stationId) { this.error = '请先为任务关联工位'; return }
      this.loading = true
      try {
        const { data } = await fetchResource('station', this.stationId)
        if (seq !== this.sequence) return
        this.cameras = data.devices.filter(d => d.type_code === 'camera' && Number(d.status) === 0 && Number(d.model_status) === 0)
        if (!this.cameras.length) this.error = '当前工位没有可用摄像头'
      } catch (e) { if (seq === this.sequence) this.error = '摄像头列表加载失败' } finally { if (seq === this.sequence) this.loading = false }
    }
  }
}
</script>
<style scoped>
.step-detection-settings { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #edf0f5; font-size: 12px; }
p { margin: 5px 0 9px; font-size: 12px; line-height: 1.6; }
.settings-hint { color: #8995a5; }
.settings-warning { color: #a77b31; }
.detection-source span { display: inline-block; width: 64px; color: #8995a5; }
</style>
