
<template>
  <div class="center-panel">
    <div class="canvas-toolbar">
      <div class="canvas-title">
        <span class="status-dot" />
        工位实时画面

        <el-tag
          size="mini"
          type="success"
          style="margin-left: 10px;"
        >
          本地演示
        </el-tag>
      </div>

      <div class="canvas-actions">
        <el-tooltip content="选择/编辑区域" placement="bottom">
          <el-button
            size="mini"
            :type="toolMode === 'select' ? 'primary' : ''"
            icon="el-icon-thumb"
            @click="$emit('tool-change', 'select')"
          />
        </el-tooltip>

        <el-tooltip content="绘制矩形区域" placement="bottom">
          <el-button
            size="mini"
            :type="toolMode === 'draw' ? 'primary' : ''"
            icon="el-icon-crop"
            @click="$emit('tool-change', 'draw')"
          />
        </el-tooltip>
      </div>
    </div>

    <div class="canvas-container">
      <div
        ref="stage"
        class="stage"
        :class="{
          'draw-mode': toolMode === 'draw',
          'select-mode': toolMode === 'select'
        }"
        @mousedown="handleStageMouseDown"
      >
        <mock-scene />

        <div
          v-for="(region, index) in regions"
          :key="region.id"
          class="roi-box"
          :class="{ selected: selectedRegionId === region.id }"
          :style="getRegionStyle(region)"
          @mousedown.stop="handleRegionMouseDown($event, region)"
          @click.stop="$emit('select-region', region)"
        >
          <div
            class="roi-label"
            :style="{ background: region.color }"
          >
            {{ index + 1 }}. {{ region.name }}
          </div>

          <template v-if="selectedRegionId === region.id">
            <span
              v-for="handle in resizeHandles"
              :key="handle"
              class="resize-handle"
              :class="'handle-' + handle"
              @mousedown.stop.prevent="handleResizeMouseDown(
                $event,
                region,
                handle
              )"
            />
          </template>
        </div>

        <div
          v-if="drawingRect"
          class="drawing-box"
          :style="getRegionStyle(drawingRect)"
        >
          <span class="drawing-size">
            {{ Math.round(drawingRect.width) }}
            ×
            {{ Math.round(drawingRect.height) }}
          </span>
        </div>

        <div class="canvas-help">
          <i class="el-icon-info" />
          {{
            toolMode === 'draw'
              ? '按住鼠标左键拖动创建检测区域'
              : '点击区域选择，拖动区域或控制点进行编辑'
          }}
        </div>
      </div>
    </div>

    <div class="canvas-footer">
      <span>
        <i class="el-icon-picture-outline" />
        画面比例：16:9
      </span>

      <span>当前区域：{{ regions.length }}</span>

      <span>
        当前工具：
        {{ toolMode === 'draw' ? '区域绘制' : '区域选择' }}
      </span>
    </div>
  </div>
</template>

<script>
import MockScene from './MockScene.vue'

import {
  clamp,
  getRegionStyle
} from '../js/region'

export default {
  name: 'AnnotationCanvas',

  components: {
    MockScene
  },

  props: {
    regions: {
      type: Array,
      default: () => []
    },
    selectedRegionId: {
      type: [String, Number],
      default: null
    },
    toolMode: {
      type: String,
      default: 'draw'
    },
    colors: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      drawingRect: null,
      interaction: null,
      resizeHandles: ['nw', 'ne', 'sw', 'se']
    }
  },

  beforeDestroy() {
    this.removeMouseListeners()
  },

  methods: {
    getRegionStyle,

    getMousePercent(event) {
      const stage = this.$refs.stage

      if (!stage) {
        return { x: 0, y: 0 }
      }

      const rect = stage.getBoundingClientRect()

      return {
        x: clamp(
          (event.clientX - rect.left) / rect.width * 100,
          0,
          100
        ),
        y: clamp(
          (event.clientY - rect.top) / rect.height * 100,
          0,
          100
        )
      }
    },

    addMouseListeners() {
      window.addEventListener(
        'mousemove',
        this.handleMouseMove
      )

      window.addEventListener(
        'mouseup',
        this.handleMouseUp
      )
    },

    removeMouseListeners() {
      window.removeEventListener(
        'mousemove',
        this.handleMouseMove
      )

      window.removeEventListener(
        'mouseup',
        this.handleMouseUp
      )
    },

    handleStageMouseDown(event) {
      if (event.button !== 0) return

      if (this.toolMode !== 'draw') {
        return
      }

      const point = this.getMousePercent(event)

      this.interaction = {
        type: 'draw',
        start: point
      }

      this.drawingRect = {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: '#409EFF'
      }

      this.addMouseListeners()
    },

    handleRegionMouseDown(event, region) {
      if (event.button !== 0) return

      this.$emit('select-region', region)

      if (this.toolMode !== 'select') return

      const point = this.getMousePercent(event)

      this.interaction = {
        type: 'drag',
        region: { ...region },
        start: point
      }

      this.addMouseListeners()
    },

    handleResizeMouseDown(event, region, handle) {
      if (event.button !== 0) return

      if (this.toolMode !== 'select') return

      this.$emit('select-region', region)

      this.interaction = {
        type: 'resize',
        region: { ...region },
        handle,
        start: this.getMousePercent(event)
      }

      this.addMouseListeners()
    },

    handleMouseMove(event) {
      if (!this.interaction) return

      const point = this.getMousePercent(event)
      const action = this.interaction

      if (action.type === 'draw') {
        this.drawingRect = {
          x: Math.min(action.start.x, point.x),
          y: Math.min(action.start.y, point.y),
          width: Math.abs(point.x - action.start.x),
          height: Math.abs(point.y - action.start.y),
          color: '#409EFF'
        }

        return
      }

      const region = action.region
      const dx = point.x - action.start.x
      const dy = point.y - action.start.y

      if (action.type === 'drag') {
        this.$emit('update-region', {
          id: region.id,
          x: clamp(
            region.x + dx,
            0,
            100 - region.width
          ),
          y: clamp(
            region.y + dy,
            0,
            100 - region.height
          )
        })

        return
      }

      if (action.type === 'resize') {
        this.resizeRegion(region, action.handle, dx, dy)
      }
    },

    resizeRegion(region, handle, dx, dy) {
      const minSize = 2

      let left = region.x
      let top = region.y
      let right = region.x + region.width
      let bottom = region.y + region.height

      if (handle.includes('w')) {
        left = clamp(
          region.x + dx,
          0,
          right - minSize
        )
      }

      if (handle.includes('e')) {
        right = clamp(
          region.x + region.width + dx,
          left + minSize,
          100
        )
      }

      if (handle.includes('n')) {
        top = clamp(
          region.y + dy,
          0,
          bottom - minSize
        )
      }

      if (handle.includes('s')) {
        bottom = clamp(
          region.y + region.height + dy,
          top + minSize,
          100
        )
      }

      this.$emit('update-region', {
        id: region.id,
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
      })
    },

    handleMouseUp() {
      if (!this.interaction) return

      if (
        this.interaction.type === 'draw' &&
        this.drawingRect &&
        this.drawingRect.width >= 2 &&
        this.drawingRect.height >= 2
      ) {
        this.$emit('create-region', {
          ...this.drawingRect
        })
      }

      this.drawingRect = null
      this.interaction = null

      this.removeMouseListeners()
    }
  }
}
</script>
