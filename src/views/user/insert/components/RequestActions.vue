<template>
  <div class="button-group">
    <el-button
      type="primary"
      @click="$emit('get')"
    >
      GET 请求
    </el-button>

    <el-button
      type="success"
      @click="$emit('post')"
    >
      POST 请求
    </el-button>

    <el-button
      type="warning"
      @click="$emit('put')"
    >
      PUT 请求
    </el-button>

    <el-button
      type="danger"
      @click="$emit('delete')"
    >
      DELETE 请求
    </el-button>

    <el-button
      type="info"
      @click="$emit('clear')"
    >
      清空结果
    </el-button>
  </div>
</template>

<script>
export default { name: 'RequestActions' }
</script>

<style lang="scss" scoped src="../styles/request-actions.scss"></style>
