
<template>
  <div class="app-container annotation-page">
    <annotation-toolbar
      :current-station="currentStation"
      :current-sop="currentSop"
      :current-step="currentStep"
      :station-options="stationOptions"
      :sop-options="sopOptions"
      :step-options="stepOptions"
      @station-change="currentStation = $event"
      @sop-change="currentSop = $event"
      @step-change="handleStepChange"
      @reset="resetRegions"
      @clear="clearRegions"
      @save="saveRegions"
    />

    <div class="annotation-body">
      <step-panel
        :step-options="stepOptions"
        :current-step="currentStep"
        :regions="regions"
        :selected-region-id="selectedRegionId"
        @step-change="handleStepChange"
        @create-step="handleCreateStep"
        @edit-step="handleEditStep"
        @delete-step="handleDeleteStep"
        @select-region="selectRegion"
        @delete-region="deleteRegion"
      />

      <annotation-canvas
        :regions="regions"
        :selected-region-id="selectedRegionId"
        :tool-mode="toolMode"
        :colors="colors"
        @tool-change="toolMode = $event"
        @select-region="selectRegion"
        @create-region="createRegion"
        @update-region="updateRegion"
      />

      <aside class="annotation-inspector">
        <el-tabs v-model="inspectorTab" class="inspector-tabs" stretch>
          <el-tab-pane label="步骤配置" name="step">
            <step-details :step="activeStep" @edit-step="handleEditStep" />
          </el-tab-pane>
          <el-tab-pane label="区域属性" name="region">
            <region-property
              :region="selectedRegion"
              :colors="colors"
              @update-region="updateRegion"
              @delete-region="deleteRegion"
              @start-draw="toolMode = 'draw'"
            />
          </el-tab-pane>
        </el-tabs>
      </aside>
    </div>

    <step-dialog
      :visible.sync="stepDialogVisible"
      :step="editingStep"
      @save="handleSaveStep"
    />
  </div>
</template>

<script>
import AnnotationToolbar from './components/AnnotationToolbar.vue'
import StepPanel from './components/StepPanel.vue'
import StepDialog from './components/StepDialog.vue'
import AnnotationCanvas from './components/AnnotationCanvas.vue'
import RegionProperty from './components/RegionProperty.vue'
import StepDetails from './components/StepDetails.vue'

import {
  createDefaultRegion,
  createDemoRegions
} from './js/region'

import {
  createDefaultStep,
  createDemoSteps,
  createStepLabel
} from './js/step'

export default {
  name: 'SopAnnotation',

  components: {
    AnnotationToolbar,
    StepPanel,
    StepDialog,
    AnnotationCanvas,
    RegionProperty,
    StepDetails
  },

  data() {
    const steps = createDemoSteps()

    return {
      currentStation: '',
      currentSop: '',
      currentStep: steps.length ? steps[0].value : '',

      stationOptions: [],
      sopOptions: [],

      stepOptions: steps,

      stepDialogVisible: false,
      editingStep: null,
      inspectorTab: 'step',
      stepSeed: steps.length + 1,

      toolMode: 'draw',

      colors: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C',
        '#9B59B6',
        '#00B8A9'
      ],

      selectedRegionId: null,
      regionSeed: 1
    }
  },

  computed: {
    activeStep() {
      return this.stepOptions.find(
        step => step.value === this.currentStep
      ) || null
    },

    regions() {
      return this.activeStep
        ? this.activeStep.regions
        : []
    },

    selectedRegion() {
      return this.regions.find(
        item => item.id === this.selectedRegionId
      ) || null
    }
  },

  methods: {
    handleStepChange(value) {
      this.inspectorTab = 'step'
      if (this.currentStep === value) return

      this.currentStep = value
      this.selectedRegionId = null
    },

    handleCreateStep() {
      this.editingStep = null
      this.stepDialogVisible = true
    },

    handleEditStep(step) {
      this.editingStep = { ...step }
      this.stepDialogVisible = true
    },

    handleSaveStep(form) {
      if (form.id === null) {
        const id = this.stepSeed++

        const step = createDefaultStep({
          ...form,
          id,
          value: id,
          name: form.name,
          desc: form.desc,
          regions: []
        })

        this.stepOptions.push(step)
        this.currentStep = id
        this.selectedRegionId = null
        this.inspectorTab = 'step'

        this.$message.success('SOP步骤添加成功')
      } else {
        const step = this.stepOptions.find(
          item => item.id === form.id
        )

        if (!step) return

        Object.assign(step, form)

        this.$message.success('SOP步骤修改成功')
      }

      this.refreshStepLabels()

      this.inspectorTab = 'step'
      this.stepDialogVisible = false
      this.editingStep = null
    },

    async handleDeleteStep(step) {
      try {
        await this.$confirm(
          `确定删除步骤“${step.name}”吗？该步骤下的所有检测区域也将被删除。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (error) {
        return
      }

      const index = this.stepOptions.findIndex(
        item => item.id === step.id
      )

      if (index === -1) return

      this.stepOptions.splice(index, 1)

      if (this.currentStep === step.value) {
        const nextStep = this.stepOptions[
          Math.min(index, this.stepOptions.length - 1)
        ]

        this.currentStep = nextStep
          ? nextStep.value
          : ''

        this.selectedRegionId = null
        this.inspectorTab = 'step'
      }

      this.refreshStepLabels()

      this.$message.success('SOP步骤已删除')
    },

    refreshStepLabels() {
      this.stepOptions.forEach((step, index) => {
        step.label = createStepLabel(index, step.name)
      })
    },

    createRegion(rect) {
      if (!this.activeStep) {
        this.$message.warning('请先添加SOP步骤')
        return
      }

      const color = this.colors[
        this.regions.length % this.colors.length
      ]

      const region = createDefaultRegion({
        ...rect,
        id: this.regionSeed++,
        name: `检测区域 ${this.regions.length + 1}`,
        color
      })

      this.activeStep.regions.push(region)
      this.selectedRegionId = region.id
      this.inspectorTab = 'region'

      this.$message.success('检测区域创建成功')
    },

    updateRegion(updatedRegion) {
      if (!this.activeStep) return

      const index = this.regions.findIndex(
        item => item.id === updatedRegion.id
      )

      if (index === -1) return

      this.$set(this.activeStep.regions, index, {
        ...this.regions[index],
        ...updatedRegion
      })
    },

    selectRegion(region) {
      this.selectedRegionId = region.id
      this.inspectorTab = 'region'
    },

    deleteRegion(id) {
      if (!this.activeStep) return

      const index = this.regions.findIndex(
        item => item.id === id
      )

      if (index === -1) return

      this.activeStep.regions.splice(index, 1)

      if (this.selectedRegionId === id) {
        this.selectedRegionId = this.regions.length
          ? this.regions[0].id
          : null
      }

      this.$message.success('区域已删除')
    },

    async clearRegions() {
      if (!this.activeStep) {
        this.$message.warning('请先选择SOP步骤')
        return
      }

      try {
        await this.$confirm(
          '确定清空当前步骤的所有检测区域吗？',
          '提示',
          {
            confirmButtonText: '确定清空',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch (error) {
        return
      }

      this.activeStep.regions = []
      this.selectedRegionId = null

      this.$message.success('已清空当前步骤的全部区域')
    },

    resetRegions() {
      if (!this.activeStep) {
        this.$message.warning('请先选择SOP步骤')
        return
      }

      const regions = createDemoRegions().map(region => ({
        ...region,
        id: this.regionSeed++
      }))

      this.activeStep.regions = regions
      this.selectedRegionId = regions[0].id
      this.inspectorTab = 'region'

      this.$message.success('已恢复当前步骤的演示数据')
    },

    saveRegions() {
      if (!this.activeStep) {
        this.$message.warning('请先选择SOP步骤')
        return
      }

      const data = JSON.parse(
        JSON.stringify({
          stepId: this.activeStep.id,
          stepName: this.activeStep.name,
          waitTime: this.activeStep.waitTime,
          voiceEnabled: this.activeStep.voiceEnabled,
          voiceText: this.activeStep.voiceText,
          imageGuide: this.activeStep.imageGuide,
          textGuide: this.activeStep.textGuide,
          regions: this.activeStep.regions
        })
      )

      console.log('当前步骤标注数据：', data)

      this.$message.success(
        `本地保存演示：当前步骤共 ${data.regions.length} 个检测区域`
      )
    }
  }
}
</script>

<style lang="scss" src="./styles/annotation.scss"></style>
