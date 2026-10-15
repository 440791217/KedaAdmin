
<template>
  <div class="right-panel">
    <div class="panel-title">
      <div>
        <i class="el-icon-setting" />
        区域属性
      </div>
    </div>

    <div v-if="region" class="property-content">
      <el-form label-position="top" size="small">
        <el-form-item label="区域名称">
          <el-input
            :value="region.name"
            placeholder="请输入区域名称"
            @input="updateField('name', $event)"
          />
        </el-form-item>

        <el-form-item label="检测类型">
          <el-select
            :value="region.detectType"
            style="width: 100%;"
            @input="updateField('detectType', $event)"
          >
            <el-option label="目标存在检测" value="object" />
            <el-option label="数量检测" value="count" />
            <el-option label="状态检测" value="status" />
            <el-option label="OCR文字检测" value="ocr" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标类别">
          <el-select
            :value="region.className"
            style="width: 100%;"
            @input="updateField('className', $event)"
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
              :value="region.confidence"
              :min="0"
              :max="100"
              :show-tooltip="false"
              @input="updateField('confidence', $event)"
            />

            <span>{{ region.confidence }}%</span>
          </div>
        </el-form-item>

        <el-form-item label="区域颜色">
          <div class="color-row">
            <span
              v-for="color in colors"
              :key="color"
              class="color-option"
              :class="{ active: region.color === color }"
              :style="{ background: color }"
              @click="updateField('color', color)"
            />
          </div>
        </el-form-item>
      </el-form>

      <div class="property-divider">
        区域坐标
      </div>

      <div class="coordinate-grid">
        <div
          v-for="item in coordinates"
          :key="item.label"
          class="coordinate-item"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="property-divider">
        判定规则
      </div>

      <el-form label-position="top" size="small">
        <el-form-item label="期望数量">
          <el-input-number
            :value="region.expectedCount"
            :min="0"
            :max="20"
            controls-position="right"
            style="width: 100%;"
            @change="updateField('expectedCount', $event)"
          />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch
            :value="region.enabled"
            active-text="启用"
            inactive-text="停用"
            @change="updateField('enabled', $event)"
          />
        </el-form-item>
      </el-form>

      <el-button
        type="danger"
        plain
        icon="el-icon-delete"
        style="width: 100%; margin-top: 10px;"
        @click="$emit('delete-region', region.id)"
      >
        删除当前区域
      </el-button>
    </div>

    <div v-else class="empty-property">
      <i class="el-icon-edit-outline" />
      <div>未选择检测区域</div>

      <span>
        在左侧选择区域，或在画面中绘制新的检测区域
      </span>

      <el-button
        type="primary"
        size="small"
        icon="el-icon-crop"
        @click="$emit('start-draw')"
      >
        开始绘制
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegionProperty',

  props: {
    region: {
      type: Object,
      default: null
    },
    colors: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    coordinates() {
      if (!this.region) return []

      return [
        {
          label: 'X',
          value: Math.round(this.region.x)
        },
        {
          label: 'Y',
          value: Math.round(this.region.y)
        },
        {
          label: 'W',
          value: Math.round(this.region.width)
        },
        {
          label: 'H',
          value: Math.round(this.region.height)
        }
      ]
    }
  },

  methods: {
    updateField(field, value) {
      if (!this.region) return

      this.$emit('update-region', {
        id: this.region.id,
        [field]: value
      })
    }
  }
}
</script>
