<template>
  <section v-loading="loading" class="frame-rate-settings" aria-label="摄像头公共参数">
    <p class="parameter-note">公共参数默认应用于各摄像头，单台设备可独立设置。</p>
    <el-form v-if="form" label-position="top" @submit.native.prevent="save">
      <frame-rate-fields v-model="form" compact grouped :disabled="!canManage || saving" />
      <section class="statistics-fields">
        <h4>帧率统计</h4>
        <p>仅影响实际 FPS 的统计和显示，不改变画面与检测频率。</p>
        <div class="statistics-grid">
          <el-form-item label="画面统计窗口（秒）">
            <el-input-number v-model="form.video_window_seconds" :min="1" :max="30" :disabled="!canManage || saving" size="small" />
          </el-form-item>
          <el-form-item label="检测统计窗口（秒）">
            <el-input-number v-model="form.detection_window_seconds" :min="1" :max="60" :disabled="!canManage || saving" size="small" />
          </el-form-item>
          <el-form-item label="数值更新间隔（秒）">
            <el-input-number v-model="form.update_interval_seconds" :min="1" :max="5" :disabled="!canManage || saving" size="small" />
          </el-form-item>
        </div>
      </section>
      <footer><span>统计参数保存后生效；刷新、检测帧率需重新连接摄像头</span><el-button v-if="canManage" type="primary" size="small" :loading="saving" native-type="submit">保存</el-button></footer>
    </el-form>
    <el-alert v-if="failed" title="公共参数加载失败" type="error" :closable="false" /><el-button v-if="failed" type="text" @click="load">重新加载</el-button>
  </section>
</template>
<script>
import request from '@/utils/request'
import FrameRateFields from '@/shared/resource/components/FrameRateFields.vue'
import { statisticsDefaults, publishStatistics } from '@/utils/frame-statistics-settings'

const formOf = data => ({
  refresh_fps: data.refresh_fps,
  detect_fps: data.detect_fps,
  version: data.version,
  video_window_seconds: data.video_window_seconds || statisticsDefaults.video_window_seconds,
  detection_window_seconds: data.detection_window_seconds || statisticsDefaults.detection_window_seconds,
  update_interval_seconds: data.update_interval_seconds || statisticsDefaults.update_interval_seconds
})
export default {
  name: 'CameraSettings', components: { FrameRateFields },
  data() { return { form: null, canManage: false, loading: false, saving: false, failed: false } },
  created() { this.load() },
  methods: {
    async load() {
      this.loading = true
      this.failed = false
      try {
        const { data } = await request({ url: '/resource/frame-rates', method: 'get' })
        this.form = formOf(data)
        this.canManage = data.can_manage
      } catch (error) {
        this.failed = true
      } finally {
        this.loading = false
      }
    },
    async save() {
      if (!this.canManage || this.saving) return
      this.saving = true
      try {
        const { data } = await request({ url: '/resource/frame-rates', method: 'put', data: this.form })
        this.form = formOf(data)
        publishStatistics(this.form)
        this.$message.success('保存成功，统计参数已生效')
      } catch (error) {
        // Request interceptor reports validation and concurrency errors.
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
<style scoped>
.frame-rate-settings { padding-top: 4px; }
.statistics-fields { padding-top: 18px; border-top: 1px solid #ebeef5; }
.statistics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 12px; }
h4 { margin: 0; color: #303133; font-size: 13px; font-weight: 600; }
p { margin: 5px 0 12px; color: #909399; font-size: 12px; line-height: 1.7; }
footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 8px; padding-top: 18px; border-top: 1px solid #ebeef5; }
footer span { color: #909399; font-size: 12px; }
@media (max-width: 480px) { footer { align-items: flex-start; flex-direction: column; } }
</style>
