<template>
  <div class="app-container annotation-page">

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="currentStation"
          placeholder="选择工位"
          style="width: 150px;"
        >
          <el-option
            v-for="item in stationOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select
          v-model="currentSop"
          placeholder="选择SOP"
          style="width: 210px; margin-left: 10px;"
        >
          <el-option
            v-for="item in sopOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-select
          v-model="currentStep"
          placeholder="选择步骤"
          style="width: 220px; margin-left: 10px;"
        >
          <el-option
            v-for="item in stepOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>

      <div class="toolbar-right">
        <el-button
          icon="el-icon-refresh-left"
          @click="resetRegions"
        >
          重置
        </el-button>

        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          @click="clearRegions"
        >
          清空标注
        </el-button>

        <el-button
          type="primary"
          icon="el-icon-check"
          @click="saveRegions"
        >
          保存标注
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="annotation-body">

      <!-- 左侧 -->
      <div class="left-panel">
        <div class="panel-title">
          <div>
            <i class="el-icon-s-operation" />
            SOP步骤
          </div>

          <el-tag size="mini" type="info">
            {{ stepOptions.length }}步
          </el-tag>
        </div>

        <div class="step-list">
          <div
            v-for="(step, index) in stepOptions"
            :key="step.value"
            class="step-item"
            :class="{ active: currentStep === step.value }"
            @click="currentStep = step.value"
          >
            <div
              class="step-number"
              :class="{ active: currentStep === step.value }"
            >
              {{ index + 1 }}
            </div>

            <div class="step-info">
              <div class="step-name">
                {{ step.name }}
              </div>
              <div class="step-desc">
                {{ step.desc }}
              </div>
            </div>
          </div>
        </div>

        <div class="region-header">
          <span>
            <i class="el-icon-crop" />
            检测区域
          </span>

          <el-tag
            type="primary"
            size="mini"
          >
            {{ regions.length }}
          </el-tag>
        </div>

        <div
          v-if="regions.length"
          class="region-list"
        >
          <div
            v-for="(region) in regions"
            :key="region.id"
            class="region-list-item"
            :class="{ active: selectedRegionId === region.id }"
            @click="selectRegion(region)"
          >
            <div
              class="region-color"
              :style="{ background: region.color }"
            />

            <div class="region-list-info">
              <div class="region-name">
                {{ region.name }}
              </div>

              <div class="region-coordinate">
                X {{ Math.round(region.x) }}
                ·
                Y {{ Math.round(region.y) }}
                ·
                {{ Math.round(region.width) }} ×
                {{ Math.round(region.height) }}
              </div>
            </div>

            <i
              class="el-icon-delete region-delete"
              @click.stop="deleteRegion(region.id)"
            />
          </div>
        </div>

        <div
          v-else
          class="empty-region"
        >
          <i class="el-icon-crop" />
          <div>暂无检测区域</div>
          <span>在中间画面中拖动鼠标创建</span>
        </div>
      </div>

      <!-- 中间画布 -->
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
            <el-tooltip
              content="选择/编辑区域"
              placement="bottom"
            >
              <el-button
                size="mini"
                :type="toolMode === 'select' ? 'primary' : ''"
                icon="el-icon-thumb"
                @click="toolMode = 'select'"
              />
            </el-tooltip>

            <el-tooltip
              content="绘制矩形区域"
              placement="bottom"
            >
              <el-button
                size="mini"
                :type="toolMode === 'draw' ? 'primary' : ''"
                icon="el-icon-crop"
                @click="toolMode = 'draw'"
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
            @mousemove="handleStageMouseMove"
            @mouseup="handleStageMouseUp"
            @mouseleave="handleStageMouseUp"
          >
            <!-- 模拟现场背景 -->
            <div class="mock-scene">
              <div class="scene-top">
                <span>CAM-01</span>
                <span>1920 × 1080</span>
              </div>

              <div class="workbench">
                <div class="machine">
                  <div class="machine-head">
                    <div class="camera-lens" />
                  </div>

                  <div class="machine-body">
                    <div class="product">
                      <div class="product-label">
                        PRODUCT
                      </div>

                      <div class="screw screw-1" />
                      <div class="screw screw-2" />
                      <div class="screw screw-3" />
                      <div class="screw screw-4" />

                      <div class="part part-1" />
                      <div class="part part-2" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="scene-tip">
                模拟现场画面 · 后续可替换为摄像头截图
              </div>
            </div>

            <!-- 已有区域 -->
            <div
              v-for="(region, index) in regions"
              :key="region.id"
              class="roi-box"
              :class="{
                selected: selectedRegionId === region.id
              }"
              :style="getRegionStyle(region)"
              @mousedown.stop="handleRegionMouseDown($event, region)"
              @click.stop="selectRegion(region)"
            >
              <div
                class="roi-label"
                :style="{ background: region.color }"
              >
                {{ index + 1 }}. {{ region.name }}
              </div>

              <template v-if="selectedRegionId === region.id">
                <span class="resize-handle handle-nw" />
                <span class="resize-handle handle-ne" />
                <span class="resize-handle handle-sw" />
                <span class="resize-handle handle-se" />
              </template>
            </div>

            <!-- 正在绘制 -->
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
                  : '点击区域进行选择，拖动区域可调整位置'
              }}
            </div>
          </div>
        </div>

        <div class="canvas-footer">
          <span>
            <i class="el-icon-picture-outline" />
            画面比例：16:9
          </span>

          <span>
            当前区域：{{ regions.length }}
          </span>

          <span>
            当前工具：
            {{ toolMode === 'draw' ? '区域绘制' : '区域选择' }}
          </span>
        </div>
      </div>

      <!-- 右侧属性 -->
      <div class="right-panel">
        <div class="panel-title">
          <div>
            <i class="el-icon-setting" />
            区域属性
          </div>
        </div>

        <template v-if="selectedRegion">
          <div class="property-content">
            <el-form
              label-position="top"
              size="small"
            >
              <el-form-item label="区域名称">
                <el-input
                  v-model="selectedRegion.name"
                  placeholder="请输入区域名称"
                />
              </el-form-item>

              <el-form-item label="检测类型">
                <el-select
                  v-model="selectedRegion.detectType"
                  style="width: 100%;"
                >
                  <el-option
                    label="目标存在检测"
                    value="object"
                  />
                  <el-option
                    label="数量检测"
                    value="count"
                  />
                  <el-option
                    label="状态检测"
                    value="status"
                  />
                  <el-option
                    label="OCR文字检测"
                    value="ocr"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="目标类别">
                <el-select
                  v-model="selectedRegion.className"
                  style="width: 100%;"
                >
                  <el-option label="螺丝" value="screw" />
                  <el-option label="工件" value="workpiece" />
                  <el-option label="标签" value="label" />
                  <el-option label="按钮" value="button" />
                </el-select>
              </el-form-item>

              <el-form-item label="置信度阈值">
                <div class="confidence-row">
                  <el-slider
                    v-model="selectedRegion.confidence"
                    :min="0"
                    :max="100"
                    :show-tooltip="false"
                  />

                  <span>
                    {{ selectedRegion.confidence }}%
                  </span>
                </div>
              </el-form-item>

              <el-form-item label="区域颜色">
                <div class="color-row">
                  <span
                    v-for="color in colors"
                    :key="color"
                    class="color-option"
                    :class="{
                      active: selectedRegion.color === color
                    }"
                    :style="{ background: color }"
                    @click="selectedRegion.color = color"
                  />
                </div>
              </el-form-item>
            </el-form>

            <div class="property-divider">
              区域坐标
            </div>

            <div class="coordinate-grid">
              <div class="coordinate-item">
                <span>X</span>
                <strong>{{ Math.round(selectedRegion.x) }}</strong>
              </div>

              <div class="coordinate-item">
                <span>Y</span>
                <strong>{{ Math.round(selectedRegion.y) }}</strong>
              </div>

              <div class="coordinate-item">
                <span>W</span>
                <strong>{{ Math.round(selectedRegion.width) }}</strong>
              </div>

              <div class="coordinate-item">
                <span>H</span>
                <strong>{{ Math.round(selectedRegion.height) }}</strong>
              </div>
            </div>

            <div class="property-divider">
              判定规则
            </div>

            <el-form
              label-position="top"
              size="small"
            >
              <el-form-item label="期望数量">
                <el-input-number
                  v-model="selectedRegion.expectedCount"
                  :min="0"
                  :max="20"
                  controls-position="right"
                  style="width: 100%;"
                />
              </el-form-item>

              <el-form-item label="是否启用">
                <el-switch
                  v-model="selectedRegion.enabled"
                  active-text="启用"
                  inactive-text="停用"
                />
              </el-form-item>
            </el-form>

            <el-button
              type="danger"
              plain
              icon="el-icon-delete"
              style="width: 100%; margin-top: 10px;"
              @click="deleteRegion(selectedRegion.id)"
            >
              删除当前区域
            </el-button>
          </div>
        </template>

        <div
          v-else
          class="empty-property"
        >
          <i class="el-icon-edit-outline" />
          <div>未选择检测区域</div>
          <span>
            在左侧选择区域，或在画面中绘制新的检测区域
          </span>

          <el-button
            type="primary"
            size="small"
            icon="el-icon-crop"
            @click="toolMode = 'draw'"
          >
            开始绘制
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SopAnnotation',

  data() {
    return {
      currentStation: 'station01',
      currentSop: 'sop001',
      currentStep: 'step01',

      toolMode: 'draw',

      stationOptions: [
        {
          label: '1号装配工位',
          value: 'station01'
        },
        {
          label: '2号检测工位',
          value: 'station02'
        },
        {
          label: '3号包装工位',
          value: 'station03'
        }
      ],

      sopOptions: [
        {
          label: 'SOP-001 产品装配',
          value: 'sop001'
        },
        {
          label: 'SOP-002 外观检测',
          value: 'sop002'
        }
      ],

      stepOptions: [
        {
          value: 'step01',
          label: '步骤1：放置工件',
          name: '放置工件',
          desc: '将工件放置于定位区域'
        },
        {
          value: 'step02',
          label: '步骤2：安装零件',
          name: '安装零件',
          desc: '安装左右两侧连接件'
        },
        {
          value: 'step03',
          label: '步骤3：锁紧螺丝',
          name: '锁紧螺丝',
          desc: '依次锁紧四颗固定螺丝'
        },
        {
          value: 'step04',
          label: '步骤4：标签检查',
          name: '标签检查',
          desc: '确认产品标签粘贴正确'
        }
      ],

      colors: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C',
        '#9B59B6',
        '#00B8A9'
      ],

      regions: [
        {
          id: 1,
          name: '产品主体区域',
          detectType: 'object',
          className: 'workpiece',
          confidence: 80,
          expectedCount: 1,
          enabled: true,
          color: '#409EFF',
          x: 28,
          y: 26,
          width: 44,
          height: 48
        },
        {
          id: 2,
          name: '标签检测区域',
          detectType: 'object',
          className: 'label',
          confidence: 75,
          expectedCount: 1,
          enabled: true,
          color: '#67C23A',
          x: 41,
          y: 42,
          width: 18,
          height: 13
        }
      ],

      selectedRegionId: 1,

      isDrawing: false,
      drawingRect: null,
      drawStartX: 0,
      drawStartY: 0,

      isDragging: false,
      dragRegionId: null,
      dragStartX: 0,
      dragStartY: 0,
      dragOriginalX: 0,
      dragOriginalY: 0,

      regionSeed: 3
    }
  },

  computed: {
    selectedRegion() {
      return this.regions.find(
        item => item.id === this.selectedRegionId
      ) || null
    }
  },

  methods: {
    getRegionStyle(region) {
      return {
        left: region.x + '%',
        top: region.y + '%',
        width: region.width + '%',
        height: region.height + '%',
        borderColor: region.color || '#409EFF'
      }
    },

    getMousePercent(event) {
      const stage = this.$refs.stage

      if (!stage) {
        return {
          x: 0,
          y: 0
        }
      }

      const rect = stage.getBoundingClientRect()

      let x =
        ((event.clientX - rect.left) / rect.width) * 100

      let y =
        ((event.clientY - rect.top) / rect.height) * 100

      x = Math.max(0, Math.min(100, x))
      y = Math.max(0, Math.min(100, y))

      return {
        x,
        y
      }
    },

    handleStageMouseDown(event) {
      if (this.toolMode !== 'draw') {
        this.selectedRegionId = null
        return
      }

      const point = this.getMousePercent(event)

      this.isDrawing = true

      this.drawStartX = point.x
      this.drawStartY = point.y

      this.drawingRect = {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: '#409EFF'
      }
    },

    handleStageMouseMove(event) {
      if (this.isDrawing) {
        const point = this.getMousePercent(event)

        const x = Math.min(
          this.drawStartX,
          point.x
        )

        const y = Math.min(
          this.drawStartY,
          point.y
        )

        const width = Math.abs(
          point.x - this.drawStartX
        )

        const height = Math.abs(
          point.y - this.drawStartY
        )

        this.drawingRect = {
          x,
          y,
          width,
          height,
          color: '#409EFF'
        }

        return
      }

      if (this.isDragging) {
        const region = this.regions.find(
          item => item.id === this.dragRegionId
        )

        if (!region) {
          return
        }

        const point = this.getMousePercent(event)

        const dx = point.x - this.dragStartX
        const dy = point.y - this.dragStartY

        let x = this.dragOriginalX + dx
        let y = this.dragOriginalY + dy

        x = Math.max(
          0,
          Math.min(100 - region.width, x)
        )

        y = Math.max(
          0,
          Math.min(100 - region.height, y)
        )

        region.x = x
        region.y = y
      }
    },

    handleStageMouseUp() {
      if (this.isDrawing) {
        this.finishDrawing()
      }

      this.isDragging = false
      this.dragRegionId = null
    },

    finishDrawing() {
      this.isDrawing = false

      if (!this.drawingRect) {
        return
      }

      if (
        this.drawingRect.width < 2 ||
        this.drawingRect.height < 2
      ) {
        this.drawingRect = null
        return
      }

      const color =
        this.colors[
          this.regions.length % this.colors.length
        ]

      const region = {
        id: this.regionSeed++,
        name: `检测区域 ${this.regions.length + 1}`,
        detectType: 'object',
        className: 'workpiece',
        confidence: 75,
        expectedCount: 1,
        enabled: true,
        color,
        x: this.drawingRect.x,
        y: this.drawingRect.y,
        width: this.drawingRect.width,
        height: this.drawingRect.height
      }

      this.regions.push(region)

      this.selectedRegionId = region.id

      this.drawingRect = null

      this.$message.success('检测区域创建成功')
    },

    handleRegionMouseDown(event, region) {
      if (this.toolMode !== 'select') {
        this.selectRegion(region)
        return
      }

      this.selectRegion(region)

      const point = this.getMousePercent(event)

      this.isDragging = true
      this.dragRegionId = region.id

      this.dragStartX = point.x
      this.dragStartY = point.y

      this.dragOriginalX = region.x
      this.dragOriginalY = region.y
    },

    selectRegion(region) {
      this.selectedRegionId = region.id
    },

    deleteRegion(id) {
      const index = this.regions.findIndex(
        item => item.id === id
      )

      if (index === -1) {
        return
      }

      this.regions.splice(index, 1)

      if (this.selectedRegionId === id) {
        this.selectedRegionId =
          this.regions.length
            ? this.regions[0].id
            : null
      }

      this.$message.success('区域已删除')
    },

    clearRegions() {
      this.$confirm(
        '确定清空当前步骤的所有检测区域吗？',
        '提示',
        {
          confirmButtonText: '确定清空',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        this.regions = []
        this.selectedRegionId = null

        this.$message.success('已清空全部区域')
      }).catch(() => {})
    },

    resetRegions() {
      this.regions = [
        {
          id: 1,
          name: '产品主体区域',
          detectType: 'object',
          className: 'workpiece',
          confidence: 80,
          expectedCount: 1,
          enabled: true,
          color: '#409EFF',
          x: 28,
          y: 26,
          width: 44,
          height: 48
        },
        {
          id: 2,
          name: '标签检测区域',
          detectType: 'object',
          className: 'label',
          confidence: 75,
          expectedCount: 1,
          enabled: true,
          color: '#67C23A',
          x: 41,
          y: 42,
          width: 18,
          height: 13
        }
      ]

      this.selectedRegionId = 1
      this.regionSeed = 3

      this.$message.success('已恢复演示数据')
    },

    saveRegions() {
      console.log(
        '当前标注数据：',
        JSON.parse(
          JSON.stringify(this.regions)
        )
      )

      this.$message.success(
        `本地保存演示：共 ${this.regions.length} 个检测区域`
      )
    }
  }
}
</script>

<style scoped>
.annotation-page {
  height: calc(100vh - 84px);
  min-height: 650px;
  padding: 20px;
  box-sizing: border-box;
  background: #f5f7fa;
}

/* 顶部 */

.top-toolbar {
  height: 64px;
  padding: 0 18px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

/* 主体布局 */

.annotation-body {
  height: calc(100% - 79px);
  display: grid;
  grid-template-columns: 250px minmax(500px, 1fr) 280px;
  gap: 15px;
}

.left-panel,
.center-panel,
.right-panel {
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 0;
}

.left-panel,
.right-panel {
  overflow-y: auto;
}

.center-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题 */

.panel-title {
  height: 50px;
  padding: 0 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.panel-title i {
  margin-right: 6px;
  color: #409EFF;
}

/* SOP步骤 */

.step-list {
  padding: 10px;
}

.step-item {
  min-height: 58px;
  padding: 9px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.step-item:hover {
  background: #f5f7fa;
}

.step-item.active {
  background: #ecf5ff;
}

.step-number {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step-number.active {
  color: #ffffff;
  background: #409EFF;
}

.step-info {
  margin-left: 10px;
  min-width: 0;
}

.step-name {
  color: #303133;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
}

.step-desc {
  color: #909399;
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 区域列表 */

.region-header {
  height: 42px;
  padding: 0 15px;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}

.region-header i {
  margin-right: 5px;
}

.region-list {
  padding: 8px;
}

.region-list-item {
  height: 54px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
}

.region-list-item:hover {
  background: #f5f7fa;
}

.region-list-item.active {
  border-color: #b3d8ff;
  background: #ecf5ff;
}

.region-color {
  width: 4px;
  height: 32px;
  border-radius: 2px;
}

.region-list-info {
  flex: 1;
  margin-left: 9px;
  overflow: hidden;
}

.region-name {
  color: #303133;
  font-size: 12px;
  line-height: 19px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.region-coordinate {
  color: #909399;
  font-size: 10px;
  line-height: 16px;
}

.region-delete {
  color: #c0c4cc;
  font-size: 15px;
}

.region-delete:hover {
  color: #f56c6c;
}

.empty-region {
  padding: 25px 10px;
  color: #909399;
  text-align: center;
  font-size: 13px;
}

.empty-region i {
  display: block;
  margin-bottom: 8px;
  color: #c0c4cc;
  font-size: 30px;
}

.empty-region span {
  display: block;
  margin-top: 5px;
  color: #c0c4cc;
  font-size: 11px;
}

/* 中间 */

.canvas-toolbar {
  height: 50px;
  padding: 0 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.canvas-title {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  margin-right: 8px;
  background: #67C23A;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.15);
}

.canvas-container {
  flex: 1;
  min-height: 0;
  padding: 18px;
  background: #eef1f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage {
  position: relative;
  width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  background: #20252b;
  overflow: hidden;
  user-select: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.stage.draw-mode {
  cursor: crosshair;
}

.stage.select-mode {
  cursor: default;
}

/* 模拟现场 */

.mock-scene {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      #555d64 0%,
      #353b40 60%,
      #262b30 100%
    );
  overflow: hidden;
}

.scene-top {
  position: absolute;
  top: 12px;
  left: 15px;
  right: 15px;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  font-size: 11px;
  display: flex;
  justify-content: space-between;
}

.workbench {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 8%;
  height: 72%;
  background: #6b7175;
  border: 8px solid #464c50;
  box-sizing: border-box;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.35);
}

.machine {
  width: 100%;
  height: 100%;
  position: relative;
}

.machine-head {
  position: absolute;
  width: 15%;
  height: 22%;
  left: 42.5%;
  top: 0;
  background: #24292d;
  border-radius: 0 0 4px 4px;
}

.camera-lens {
  position: absolute;
  width: 24px;
  height: 24px;
  left: calc(50% - 12px);
  bottom: 10px;
  border-radius: 50%;
  background: #111;
  border: 4px solid #777;
  box-sizing: border-box;
}

.machine-body {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 10%;
  height: 60%;
  background: #959b9f;
  border-radius: 3px;
}

.product {
  position: absolute;
  left: 23%;
  top: 14%;
  width: 54%;
  height: 70%;
  background: #d8dde0;
  border: 5px solid #a8afb3;
  box-sizing: border-box;
  border-radius: 5px;
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
}

.product-label {
  position: absolute;
  left: 35%;
  top: 38%;
  width: 30%;
  height: 22%;
  background: #f2f3f5;
  color: #777;
  border: 1px solid #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.screw {
  position: absolute;
  width: 13px;
  height: 13px;
  background: #555;
  border: 2px solid #777;
  border-radius: 50%;
}

.screw-1 {
  left: 8%;
  top: 12%;
}

.screw-2 {
  right: 8%;
  top: 12%;
}

.screw-3 {
  left: 8%;
  bottom: 12%;
}

.screw-4 {
  right: 8%;
  bottom: 12%;
}

.part {
  position: absolute;
  width: 12%;
  height: 40%;
  top: 30%;
  background: #778086;
}

.part-1 {
  left: 12%;
}

.part-2 {
  right: 12%;
}

.scene-tip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  font-size: 10px;
}

/* ROI */

.roi-box {
  position: absolute;
  z-index: 10;
  border: 2px solid #409EFF;
  background: rgba(64, 158, 255, 0.04);
  box-sizing: border-box;
  cursor: pointer;
}

.roi-box:hover {
  background: rgba(64, 158, 255, 0.08);
}

.roi-box.selected {
  border-width: 2px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.roi-label {
  position: absolute;
  left: -2px;
  top: -25px;
  height: 23px;
  padding: 0 8px;
  color: #ffffff;
  font-size: 11px;
  line-height: 23px;
  white-space: nowrap;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border: 2px solid #409EFF;
  box-sizing: border-box;
}

.handle-nw {
  left: -5px;
  top: -5px;
}

.handle-ne {
  right: -5px;
  top: -5px;
}

.handle-sw {
  left: -5px;
  bottom: -5px;
}

.handle-se {
  right: -5px;
  bottom: -5px;
}

.drawing-box {
  position: absolute;
  z-index: 20;
  border: 2px dashed #409EFF;
  background: rgba(64, 158, 255, 0.15);
  box-sizing: border-box;
}

.drawing-size {
  position: absolute;
  right: 0;
  bottom: -22px;
  padding: 2px 5px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.65);
  font-size: 10px;
}

.canvas-help {
  position: absolute;
  left: 50%;
  bottom: 15px;
  z-index: 30;
  transform: translateX(-50%);
  padding: 7px 13px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 3px;
  font-size: 11px;
  pointer-events: none;
}

.canvas-help i {
  margin-right: 5px;
}

.canvas-footer {
  height: 38px;
  padding: 0 15px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 25px;
  box-sizing: border-box;
}

/* 右侧 */

.property-content {
  padding: 15px;
}

.property-content >>> .el-form-item {
  margin-bottom: 15px;
}

.property-content >>> .el-form-item__label {
  padding-bottom: 5px;
  color: #606266;
  font-size: 12px;
  line-height: 20px;
}

.confidence-row {
  display: flex;
  align-items: center;
}

.confidence-row .el-slider {
  flex: 1;
}

.confidence-row span {
  width: 42px;
  margin-left: 12px;
  color: #409EFF;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-option {
  width: 22px;
  height: 22px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 1px #dcdfe6;
  box-sizing: border-box;
}

.color-option.active {
  box-shadow: 0 0 0 2px #303133;
}

.property-divider {
  margin: 17px 0 12px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 11px;
}

.coordinate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.coordinate-item {
  height: 45px;
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.coordinate-item span {
  color: #909399;
  font-size: 11px;
}

.coordinate-item strong {
  color: #303133;
  font-family: monospace;
  font-size: 13px;
}

.empty-property {
  padding: 70px 25px 20px;
  color: #909399;
  text-align: center;
}

.empty-property > i {
  display: block;
  margin-bottom: 15px;
  color: #c0c4cc;
  font-size: 42px;
}

.empty-property div {
  margin-bottom: 7px;
  color: #606266;
  font-size: 14px;
}

.empty-property span {
  display: block;
  margin-bottom: 20px;
  color: #c0c4cc;
  font-size: 11px;
  line-height: 18px;
}

@media screen and (max-width: 1300px) {
  .annotation-body {
    grid-template-columns: 220px minmax(450px, 1fr) 250px;
  }

  .annotation-page {
    padding: 12px;
  }
}
</style>
