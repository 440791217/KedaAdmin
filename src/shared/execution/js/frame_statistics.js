import { RollingRate, observeVideoFrames } from '@/utils/frame-rate-meter'
import { statisticsSettings, subscribeStatistics } from '@/utils/frame-statistics-settings'

export default {
  data() {
    return { measuredVideoFps: null, measuredDetectionFps: null, frameMeasurementAvailable: true }
  },
  computed: {
    statisticsSignature() {
      return JSON.stringify(statisticsSettings)
    },
    videoFpsText() {
      if (this.streamError || (!this.connected && !this.connecting)) return '实时 0 FPS'
      if (!this.frameMeasurementAvailable) return '实时 FPS 不可用'
      return this.measuredVideoFps == null ? '实时 统计中' : '实时 ' + Math.round(this.measuredVideoFps) + ' FPS'
    }
  },
  watch: {
    statisticsSignature() {
      this.resetFrameRates()
      this.scheduleFrameDisplay()
    }
  },
  mounted() {
    this.resetFrameRates()
    this._unsubscribeStatistics = subscribeStatistics()
    this.scheduleFrameDisplay()
  },
  beforeDestroy() {
    this.stopFrameMeasurement()
    clearInterval(this._frameDisplayTimer)
    if (this._unsubscribeStatistics) this._unsubscribeStatistics()
  },
  methods: {
    resetFrameRates() {
      this._videoRate = new RollingRate(statisticsSettings.video_window_seconds)
      this.resetDetectionRate()
      this.measuredVideoFps = null
    },
    resetDetectionRate() {
      this._detectionRate = new RollingRate(statisticsSettings.detection_window_seconds)
      this.measuredDetectionFps = null
    },
    scheduleFrameDisplay() {
      clearInterval(this._frameDisplayTimer)
      this._frameDisplayTimer = setInterval(() => {
        this.measuredVideoFps = this._videoRate ? this._videoRate.value() : null
        this.measuredDetectionFps = this._detectionRate ? this._detectionRate.value() : null
      }, statisticsSettings.update_interval_seconds * 1000)
    },
    recordPaintedFrame(now) {
      if (this._videoRate && !document.hidden) this._videoRate.record(now)
    },
    recordDetectionFrame() {
      if (this._detectionRate) this._detectionRate.record()
    },
    startFrameMeasurement(video, painted) {
      this.stopFrameMeasurement()
      this.resetFrameRates()
      this.frameMeasurementAvailable = (!painted && typeof video.requestVideoFrameCallback === 'function') || !!video.getVideoPlaybackQuality
      if (!painted && this.frameMeasurementAvailable) {
        this._stopFrameObserver = observeVideoFrames(video, (now, count) => {
          if (this._videoRate) this._videoRate.record(now, count)
        }, () => this.previewActive !== false && !this.snapshotUrl)
      }
    },
    stopFrameMeasurement() {
      if (this._stopFrameObserver) this._stopFrameObserver()
      this._stopFrameObserver = null
      this.measuredVideoFps = null
      this._videoRate = null
    }
  }
}
