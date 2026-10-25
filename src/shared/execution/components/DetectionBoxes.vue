<template><canvas ref="canvas" class="detection-boxes" aria-label="当前步骤相关目标检测框" /></template>
<script>
import { drawDetectionBoxes } from '../js/live_regions'
export default {
  name: 'DetectionBoxes',
  props: { result: { type: Object, default: null }, visual: { type: Object, default: null }},
  watch: { result() { this.draw() }, visual() { this.draw() } },
  mounted() {
    this.draw()
    if (typeof ResizeObserver !== 'undefined') { this.observer = new ResizeObserver(this.draw); this.observer.observe(this.$el) }
    window.addEventListener('resize', this.draw)
  },
  beforeDestroy() { if (this.observer) this.observer.disconnect(); window.removeEventListener('resize', this.draw) },
  methods: {
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight
      drawDetectionBoxes(canvas, this.result, this.visual)
    }
  }
}
</script>
<style scoped>
.detection-boxes { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
