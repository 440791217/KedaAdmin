<template>
  <div class="app-container">
    <el-card>
      <div slot="header">
        <span>Request 接口测试</span>
      </div>

      <request-actions @get="testGet" @post="testPost" @put="testPut" @delete="testDelete" @clear="clearResult" />

      <el-divider />

      <request-result :request-status="requestStatus" :result-text="resultText" />
    </el-card>
  </div>
</template>

<script src="./js/request-test.js"></script>
