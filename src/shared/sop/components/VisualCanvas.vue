<template>
  <div class="visual-stage" :class="{ 'can-draw': !readonly && tool !== 'select' }">
    <img
      v-if="src"
      :src="src"
      alt="SOP标注底图"
      draggable="false"
      @load="$emit('loaded', { width: $event.target.naturalWidth, height: $event.target.naturalHeight })"
    >
    <svg
      v-if="src"
      ref="svg"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      @pointerdown.prevent="start($event, null)"
    >
      <g
        v-for="item in items"
        :key="item.id"
        :opacity="item.enabled === false ? 0.4 : 1"
        @pointerdown.stop.prevent="start($event, item)"
      >
        <line
          v-if="item.kind === 'arrow'"
          :x1="item.x * width"
          :y1="item.y * height"
          :x2="item.x2 * width"
          :y2="item.y2 * height"
          :stroke="item.color"
          :stroke-width="lineWidth"
        />
        <polygon v-if="item.kind === 'arrow'" :points="arrowHead(item)" :fill="item.color" />
        <rect
          v-else
          :x="item.x * width"
          :y="item.y * height"
          :width="item.width * width"
          :height="item.height * height"
          :stroke="item.color"
          :fill="item.id === selectedId ? '#409eff20' : '#ffffff08'"
          :stroke-width="lineWidth"
          :stroke-dasharray="item.detect_type ? `${lineWidth * 3},${lineWidth * 2}` : ''"
        />
        <foreignObject v-if="item.kind === 'text'" :x="item.x*width" :y="item.y*height" :width="item.width*width" :height="item.height*height">
          <div xmlns="http://www.w3.org/1999/xhtml" :style="{fontSize:`${fontSize}px`,color:item.color,whiteSpace:'pre-wrap',overflowWrap:'anywhere',overflow:'hidden',height:'100%',padding:`${lineWidth*2}px`}">{{ item.text }}</div>
        </foreignObject>
        <text
          v-else
          :x="item.x * width + lineWidth * 2"
          :y="item.y * height + fontSize"
          :font-size="fontSize"
          :fill="item.color"
          font-family="sans-serif"
        >
          {{ item.kind === 'text' ? item.text : item.name }}
        </text>
        <template v-if="!readonly && item.id === selectedId && item.kind !== 'arrow'">
          <rect
            v-for="corner in corners"
            :key="corner"
            :x="(item.x + (corner.includes('e') ? item.width : 0)) * width - handle / 2"
            :y="(item.y + (corner.includes('s') ? item.height : 0)) * height - handle / 2"
            :width="handle"
            :height="handle"
            fill="#fff"
            :stroke="item.color"
            :stroke-width="lineWidth"
            @pointerdown.stop.prevent="start($event, item, corner)"
          />
        </template>
      </g>
      <rect
        v-if="drawing && tool !== 'arrow'"
        :x="Math.min(drawing.a.x, drawing.b.x) * width"
        :y="Math.min(drawing.a.y, drawing.b.y) * height"
        :width="Math.abs(drawing.a.x - drawing.b.x) * width"
        :height="Math.abs(drawing.a.y - drawing.b.y) * height"
        fill="#409eff20"
        stroke="#409eff"
        :stroke-width="lineWidth"
      />
      <line
        v-if="drawing && tool === 'arrow'"
        :x1="drawing.a.x * width"
        :y1="drawing.a.y * height"
        :x2="drawing.b.x * width"
        :y2="drawing.b.y * height"
        stroke="#409eff"
        :stroke-width="lineWidth"
      />
    </svg>
  </div>
</template>
<script src="../js/visual_canvas.js" />
<style scoped>
.visual-stage {
  position: relative;
  width: 100%;
  user-select: none;
  touch-action: none;
  background: #fff;
}
.visual-stage img {
  display: block;
  width: 100%;
  pointer-events: none;
}
.visual-stage svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.visual-stage g {
  cursor: move;
}
.can-draw {
  cursor: crosshair;
}
</style>
