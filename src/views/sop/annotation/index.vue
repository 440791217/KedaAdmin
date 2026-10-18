
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

<script src="./js/annotation.js" />

<style lang="scss" src="./styles/annotation.scss"></style>
