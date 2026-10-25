import { readCaptureSettings, saveCaptureSettings, checkCaptureService } from '@/utils/capture-service'
import { readDetectionSettings, saveDetectionSettings, createDetectionClient } from '@/utils/detection-service'

export default {
  name: 'NetworkSettings',
  data() {
    return { form: readCaptureSettings(), checking: false, result: null, detection: readDetectionSettings(), detectionChecking: false, detectionResult: null }
  },
  methods: {
    saveDetection() {
      try { this.detection = saveDetectionSettings(this.detection); this.$message.success('检测服务配置已保存') } catch (error) { this.$message.error(error.message) }
    },
    async testDetection() {
      this.detectionChecking = true; this.detectionResult = null
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const data = await createDetectionClient(this.detection).models(controller.signal)
        const ready = data.models.filter(model => model.status === 'ready')
        this.detectionResult = { type: ready.length ? 'success' : 'warning', message: ready.length ? '连接成功，就绪模型：' + ready.map(model => model.id).join('、') : '连接成功，但没有就绪模型' }
      } catch (error) { this.detectionResult = { type: 'error', message: error.name === 'AbortError' ? '检测服务连接超时' : error.message } } finally { clearTimeout(timeout); this.detectionChecking = false }
    },
    save() {
      try {
        this.form = saveCaptureSettings(this.form)
        this.$message.success('网络配置已保存')
      } catch (error) {
        this.$message.error(error.message)
      }
    },
    async testConnection() {
      this.checking = true
      this.result = null
      try {
        const tools = await checkCaptureService(this.form)
        this.result = tools.ffmpeg && tools.mediamtx
          ? { type: 'success', message: '连接成功，访问凭证有效，采集工具已就绪' }
          : { type: 'warning', message: '连接成功，但媒体工具未齐备，请在采集服务中安装 FFmpeg 和 MediaMTX' }
      } catch (error) {
        this.result = { type: 'error', message: error.message }
      } finally {
        this.checking = false
      }
    }
  }
}
