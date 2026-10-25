<template>
  <div class="app-container network-settings">
    <el-card shadow="never">
      <div slot="header">网络配置</div>
      <el-alert title="配置摄像头采集服务的连接地址。地址保存在当前浏览器；访问凭证仅保存在当前标签页会话。" type="info" :closable="false" />
      <el-form label-position="top" @submit.native.prevent="save">
        <el-form-item label="采集服务地址" required>
          <el-input v-model="form.address" placeholder="http://localhost:18090" @input="result = null" />
          <p class="hint">localhost 指运行浏览器的电脑。部署到服务器时填写服务器地址和采集服务端口。</p>
        </el-form-item>
        <el-form-item label="采集服务访问凭证">
          <el-input v-model="form.token" type="text" autocomplete="off" @input="result = null" />
          <p class="hint">开发阶段默认凭证为 88888888，也可从采集服务 /debug 页面复制。</p>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">保存配置</el-button>
          <el-button :loading="checking" @click="testConnection">测试连接</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="result" :title="result.message" :type="result.type" :closable="false" show-icon />
      <el-divider>检测服务</el-divider>
      <el-form label-position="top" @submit.native.prevent="saveDetection">
        <el-form-item label="检测服务地址" required><el-input v-model="detection.address" placeholder="http://localhost:18092" /><p class="hint">地址保存在当前浏览器；访问凭证保存在当前标签页会话。修改后请在现场页面重新连接。</p></el-form-item>
        <el-form-item label="检测服务访问凭证" required><el-input v-model="detection.token" type="text" autocomplete="off" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit">保存检测配置</el-button><el-button :loading="detectionChecking" @click="testDetection">测试检测连接</el-button></el-form-item>
      </el-form>
      <el-alert v-if="detectionResult" :title="detectionResult.message" :type="detectionResult.type" :closable="false" show-icon />
    </el-card>
  </div>
</template>
<script src="./network_settings.js" />
<style scoped>
.network-settings { max-width: 860px; }
.el-form { margin-top: 24px; }
.hint { color: #909399; font-size: 13px; line-height: 1.6; margin: 6px 0 0; }
</style>
