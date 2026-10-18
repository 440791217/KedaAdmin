<template>
  <div>
    <el-form-item
      label="通信方式"
      required
    ><el-select
      :value="value.transport"
      :disabled="disabled"
      @change="changeTransport"
    ><el-option
      v-for="(label, key) in labels"
      :key="key"
      :value="key"
      :label="label"
    /></el-select></el-form-item><el-form-item
      v-if="value.transport !== 'none'"
      label="协议 / 模式"
      required
    ><el-select
      :value="value.protocol"
      :disabled="disabled"
      @input="field('protocol', $event)"
    ><el-option
      v-for="p in protocols"
      :key="p"
      :value="p"
      :label="p"
    /></el-select></el-form-item><template
      v-if="value.transport === 'network'"
    ><el-form-item
      v-if="value.protocol === 'rtsp'"
      label="RTSP 地址"
      required
    ><el-input
      :value="value.rtsp_url"
      type="text"
      :disabled="disabled"
      placeholder="rtsp://192.168.1.100:554/视频流路径"
      maxlength="1300"
      @input="field('rtsp_url', $event)"
    /></el-form-item><template v-else><el-form-item
      label="设备IP / 主机"
      required
    ><el-input
      :value="value.host"
      :disabled="disabled"
      placeholder="例如 192.168.1.201，不要填写工位IP"
      maxlength="255"
      @input="field('host', $event)"
    /></el-form-item><el-form-item
      label="端口"
      required
    ><el-input-number
      :value="value.port == null ? undefined : value.port"
      :disabled="disabled"
      :min="1"
      :max="65535"
      :precision="0"
      @input="
        field('port', $event == null ? null : $event)
      "
    /></el-form-item><el-form-item
      label="路径"
    ><el-input
      :value="value.path"
      :disabled="disabled"
      placeholder="例如 /stream，不包含账号密码"
      maxlength="1000"
      @input="field('path', $event)"
    /></el-form-item></template></template><template
      v-if="value.transport === 'usb' || value.transport === 'serial'"
    ><el-form-item
      label="接入电脑"
      required
    ><el-input
      :value="value.host_key"
      :disabled="disabled"
      placeholder="工位电脑标识"
      maxlength="128"
      @input="field('host_key', $event)"
    /></el-form-item><el-form-item
      label="设备标识"
      required
    ><el-input
      :value="value.device_key"
      :disabled="disabled"
      placeholder="设备路径 / 序列号；键盘模式可用现场标签"
      maxlength="255"
      @input="field('device_key', $event)"
    /></el-form-item></template><el-form-item
      v-if="value.transport !== 'none'"
      label="启用连接"
    ><el-switch
      :value="value.enabled"
      :disabled="disabled"
      @input="field('enabled', $event)"
    /></el-form-item>
    <el-form-item v-if="value.transport === 'network' && value.protocol === 'rtsp'" label="连接测试">
      <el-button :disabled="disabled || !value.enabled" :loading="testing" @click="test">测试连接并取图</el-button>
      <div v-if="previewUrl"><img :src="previewUrl" alt="摄像头测试截图" class="camera-test-image"></div>
    </el-form-item>
    <p class="resource-note">
      RTSP填写完整地址，可包含用户名和密码；其他网络协议填写设备IP。保存配置后可测试实际取图。
    </p>
  </div>
</template>
<script src="../js/connection_fields.js" />
<style scoped src="../styles/camera_connection.scss" lang="scss" />

