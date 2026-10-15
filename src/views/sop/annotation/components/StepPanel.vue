
<template>
  <div class="left-panel">
    <div class="panel-title">
      <div>
        <i class="el-icon-s-operation" />
        SOP步骤
      </div>

      <div class="step-header-actions">
        <el-tag size="mini" type="info">
          {{ stepOptions.length }}步
        </el-tag>

        <el-tooltip
          content="新增步骤"
          placement="top"
        >
          <el-button
            type="primary"
            plain
            class="step-create-button"
            size="mini"
            icon="el-icon-plus"
            @click="$emit('create-step')"
          >新增</el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="step-list">
      <div
        v-for="(step, index) in stepOptions"
        :key="step.id"
        class="step-item"
        :class="{ active: currentStep === step.value }"
        @click="$emit('step-change', step.value)"
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
          <div class="step-summary">
            <span>{{ step.waitTime ? `${step.waitTime}秒等待` : '立即检测' }}</span>
            <span v-if="step.voiceEnabled">语音</span>
            <span v-if="step.textGuide">文字</span>
            <span v-if="step.imageGuide">图片</span>
          </div>
        </div>

        <div class="step-actions">
          <el-tooltip content="编辑步骤" placement="top">
            <i
              class="el-icon-edit"
              @click.stop="$emit('edit-step', step)"
            />
          </el-tooltip>

          <el-tooltip content="删除步骤" placement="top">
            <i
              class="el-icon-delete"
              @click.stop="$emit('delete-step', step)"
            />
          </el-tooltip>
        </div>
      </div>

      <div
        v-if="!stepOptions.length"
        class="empty-step"
      >
        <i class="el-icon-document-add" />
        <div>暂无SOP步骤</div>

        <el-button
          type="text"
          @click="$emit('create-step')"
        >
          添加第一个步骤
        </el-button>
      </div>
    </div>

    <div class="region-header">
      <span>
        <i class="el-icon-crop" />
        检测区域
      </span>

      <el-tag type="primary" size="mini">
        {{ regions.length }}
      </el-tag>
    </div>

    <div
      v-if="regions.length"
      class="region-list"
    >
      <div
        v-for="region in regions"
        :key="region.id"
        class="region-list-item"
        :class="{ active: selectedRegionId === region.id }"
        @click="$emit('select-region', region)"
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
            · Y {{ Math.round(region.y) }}
            · {{ Math.round(region.width) }}
            × {{ Math.round(region.height) }}
          </div>
        </div>

        <i
          class="el-icon-delete region-delete"
          @click.stop="$emit('delete-region', region.id)"
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
</template>

<script>
export default {
  name: 'StepPanel',

  props: {
    stepOptions: {
      type: Array,
      default: () => []
    },

    currentStep: {
      type: [String, Number],
      default: ''
    },

    regions: {
      type: Array,
      default: () => []
    },

    selectedRegionId: {
      type: [String, Number],
      default: null
    }
  }
}
</script>
