<template>
  <g class="region-label" stroke="none" :transform="`translate(${x},${y})`">
    <title>{{ description }}</title>
    <line v-if="layout.displaced" :x1="region.x * width - x" :y1="region.y * height - y" :x2="padding" :y2="labelHeight / 2" :stroke="accent" :stroke-width="fontSize / 14" opacity="0.65" pointer-events="none" />
    <rect :width="labelWidth" :height="labelHeight" :rx="fontSize / 3" fill="#ffffffed" :stroke="accent" :stroke-width="fontSize / 16" />
    <rect :width="fontSize / 4" :height="labelHeight - fontSize / 2" :y="fontSize / 4" :rx="fontSize / 8" :fill="accent" />
    <text :x="padding" :y="labelHeight / 2" dominant-baseline="central" :font-size="fontSize" fill="#334155" font-family="sans-serif">{{ layout.text }}</text>
  </g>
</template>
<script>
import { regionRequirements } from '@/utils/region-requirements'
import { layoutRegionLabels } from '@/utils/region-label-layout'
export default {
  name: 'RegionLabel',
  props: { region: { type: Object, required: true }, width: { type: Number, required: true }, height: { type: Number, required: true }, fontSize: { type: Number, required: true }, message: { type: String, default: '' }, placement: { type: Object, default: null }, color: { type: String, default: '' }},
  computed: {
    description() { return [this.region.name || '检测区域', ...regionRequirements(this.region), this.message].filter(Boolean).join('；') },
    accent() { return this.color || this.region.color || '#409EFF' },
    layout() { return this.placement || layoutRegionLabels([this.region], this.width, this.height, this.fontSize)[0] },
    padding() { return this.fontSize * 0.7 },
    labelWidth() { return this.layout.width },
    labelHeight() { return this.layout.height },
    x() { return this.layout.x },
    y() { return this.layout.y }
  }
}
</script>
