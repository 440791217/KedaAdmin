<template>
  <div class="request-info">
    <div>
      <span class="label">请求状态：</span>
      <el-tag
        v-if="requestStatus === 'success'"
        type="success"
      >
        成功
      </el-tag>

      <el-tag
        v-else-if="requestStatus === 'error'"
        type="danger"
      >
        失败
      </el-tag>

      <el-tag
        v-else
        type="info"
      >
        未请求
      </el-tag>
    </div>

    <div class="result-title">
      返回结果：
    </div>

    <pre class="result-box">{{ resultText }}</pre>
  </div>
</template>

<script>
export default {
  name: 'RequestResult',
  props: {
    requestStatus: { type: String, default: '' },
    resultText: { type: String, default: '暂无请求结果' }
  }
}
</script>

<style lang="scss" scoped src="../styles/request-result.scss"></style>
