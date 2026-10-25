<template>
  <svg class="live-guidance" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="xMidYMid meet" aria-label="当前步骤操作指引和检测区域">
    <g v-for="item in guides" :key="'guide-' + item.id" :stroke="item.color || '#409EFF'" :fill="item.color || '#409EFF'" :stroke-width="lineWidth">
      <template v-if="item.kind === 'arrow'"><line :x1="item.x * width" :y1="item.y * height" :x2="item.x2 * width" :y2="item.y2 * height" /><polygon :points="arrowHead(item)" stroke="none" /></template>
      <template v-else-if="item.kind === 'text'"><foreignObject :x="item.x * width" :y="item.y * height" :width="item.width * width" :height="item.height * height"><div xmlns="http://www.w3.org/1999/xhtml" :style="{ color: item.color || '#409EFF', fontSize: fontSize + 'px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }">{{ item.text }}</div></foreignObject></template>
      <template v-else><rect :x="item.x * width" :y="item.y * height" :width="item.width * width" :height="item.height * height" fill="none" /><text :x="item.x * width + 5" :y="labelY(item)" :font-size="fontSize" stroke="none">{{ item.name }}</text></template>
    </g>
    <g v-for="state in states" :key="'region-' + state.region.id" :stroke="state.matched ? '#20e080' : '#ffc34d'" :fill="state.matched ? '#20e080' : '#ffc34d'" :stroke-width="lineWidth" :data-region="state.region.id" :data-matched="state.matched">
      <rect :x="state.region.x * width" :y="state.region.y * height" :width="state.region.width * width" :height="state.region.height * height" fill="none" :stroke-dasharray="state.matched ? '' : `${lineWidth * 4} ${lineWidth * 2}`" />
      <region-label :region="state.region" :width="width" :height="height" :font-size="fontSize" :message="state.message" :placement="regionPlacements.find(label => label.id === state.region.id)" :color="state.matched ? '#21a675' : '#d99a24'" />
    </g>
  </svg>
</template>
<script>
import RegionLabel from '@/shared/sop/components/RegionLabel.vue'
import { layoutRegionLabels } from '@/utils/region-label-layout'
export default {
  name: 'LiveGuidanceOverlay',
  components: { RegionLabel },
  props: { visual: { type: Object, default: null }, states: { type: Array, default: () => [] }, width: { type: Number, default: 16 }, height: { type: Number, default: 9 }},
  data() { return { stageWidth: 0 } },
  computed: {
    regionPlacements() { return layoutRegionLabels(this.states.map(state => state.region), this.width, this.height, this.fontSize) },
    guides() { return ((this.visual && this.visual.guide_items) || []).filter(item => item.enabled !== false) },
    fontSize() { return this.width * 12 / (this.stageWidth || 800) },
    lineWidth() { return this.width / 500 }
  },
  watch: { width() { this.measure() }, height() { this.measure() } },
  mounted() {
    this.measure()
    if (typeof ResizeObserver !== 'undefined') { this.stageObserver = new ResizeObserver(this.measure); this.stageObserver.observe(this.$el) }
    window.addEventListener('resize', this.measure)
  },
  beforeDestroy() { if (this.stageObserver) this.stageObserver.disconnect(); window.removeEventListener('resize', this.measure) },
  methods: {
    measure() { const rect = this.$el.getBoundingClientRect(); this.stageWidth = rect.height ? Math.min(rect.width, rect.height * this.width / this.height) : rect.width },
    labelY(item) { return Math.min(this.height - this.fontSize / 3, item.y * this.height + this.fontSize * 1.3) },
    arrowHead(item) {
      const x = item.x2 * this.width; const y = item.y2 * this.height
      const angle = Math.atan2(y - item.y * this.height, x - item.x * this.width)
      return [[x, y], [x - this.fontSize * Math.cos(angle - 0.5), y - this.fontSize * Math.sin(angle - 0.5)], [x - this.fontSize * Math.cos(angle + 0.5), y - this.fontSize * Math.sin(angle + 0.5)]].map(point => point.join(',')).join(' ')
    }
  }
}
</script>
<style scoped>
.live-guidance { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
