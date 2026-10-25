<template>
  <div class="device-settings">
    <header><h3>设备配置</h3></header>
    <section class="device-settings-panel">
      <el-tabs v-model="activeTab"><el-tab-pane label="摄像头" name="camera"><camera-settings /></el-tab-pane></el-tabs>
    </section>
  </div>
</template>
<script>
import CameraSettings from './CameraSettings.vue'
export default {
  name: 'DeviceSettings',
  components: { CameraSettings },
  data() { return { activeTab: 'camera' } }
}
</script>
<style scoped>
.device-settings { max-width: 860px; margin: 24px; color: #606266; font-size: 13px; }
h3 { margin: 0 0 18px; color: #303133; font-size: 16px; font-weight: 600; }
.device-settings-panel { padding: 0 24px 22px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
.device-settings-panel ::v-deep .el-tabs__header { margin-bottom: 12px; }
.device-settings-panel ::v-deep .el-tabs__item { height: 52px; line-height: 52px; font-size: 13px; }
.device-settings-panel ::v-deep .el-tabs__nav-wrap::after { height: 1px; background: #ebeef5; }
@media (max-width: 600px) { .device-settings { margin: 12px; } .device-settings-panel { padding: 0 18px 18px; } }
</style>
