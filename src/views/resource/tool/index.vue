<template>
  <div class="app-container">
    <el-tabs
      v-model="tab"
    ><el-tab-pane
      label="工具与设备"
      name="device"
    ><resource-page
      v-if="tab === 'device'"
      kind="device"
      title="工具 / 设备"
    /></el-tab-pane><el-tab-pane
      label="规格管理"
      name="model"
    ><resource-page
      v-if="tab === 'model'"
      kind="model"
      title="设备规格"
    /></el-tab-pane></el-tabs>
  </div>
</template>
<script src="./js/tool.js" />

<style scoped src="./styles/index.scss" lang="scss" />
