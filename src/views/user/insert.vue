```vue
<template>
  <div class="app-container">
    <el-card>
      <div slot="header">
        <span>Request 接口测试</span>
      </div>

      <div class="button-group">
        <el-button
          type="primary"
          @click="testGet"
        >
          GET 请求
        </el-button>

        <el-button
          type="success"
          @click="testPost"
        >
          POST 请求
        </el-button>

        <el-button
          type="warning"
          @click="testPut"
        >
          PUT 请求
        </el-button>

        <el-button
          type="danger"
          @click="testDelete"
        >
          DELETE 请求
        </el-button>

        <el-button
          type="info"
          @click="clearResult"
        >
          清空结果
        </el-button>
      </div>

      <el-divider />

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
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'RequestTest',

  data() {
    return {
      requestStatus: '',
      resultText: '暂无请求结果'
    }
  },

  methods: {
    async testGet() {
      this.requestStatus = ''
      this.resultText = '请求中...'

      try {
        const response = await request({
          url: '/test/get',
          method: 'get',
          params: {
            id: 1,
            username: 'zhangsan'
          }
        })

        this.requestStatus = 'success'
        this.resultText = this.formatResult(response)
      } catch (error) {
        this.requestStatus = 'error'
        this.resultText = this.formatResult(error)
        console.error('GET 请求失败:', error)
      }
    },

    async testPost() {
      this.requestStatus = ''
      this.resultText = '请求中...'

      try {
        const response = await request({
          url: '/test/post',
          method: 'post',
          data: {
            username: 'zhangsan',
            realName: '张三',
            cardNumber: 'RFID001001',
            shiftGroup: '一班组'
          }
        })

        this.requestStatus = 'success'
        this.resultText = this.formatResult(response)
      } catch (error) {
        this.requestStatus = 'error'
        this.resultText = this.formatResult(error)
        console.error('POST 请求失败:', error)
      }
    },

    async testPut() {
      this.requestStatus = ''
      this.resultText = '请求中...'

      try {
        const response = await request({
          url: '/test/put',
          method: 'put',
          data: {
            id: 1,
            realName: '张三',
            phone: '13800138001',
            status: 1
          }
        })

        this.requestStatus = 'success'
        this.resultText = this.formatResult(response)
      } catch (error) {
        this.requestStatus = 'error'
        this.resultText = this.formatResult(error)
        console.error('PUT 请求失败:', error)
      }
    },

    async testDelete() {
      this.requestStatus = ''
      this.resultText = '请求中...'

      try {
        const response = await request({
          url: '/test/delete/1',
          method: 'delete'
        })

        this.requestStatus = 'success'
        this.resultText = this.formatResult(response)
      } catch (error) {
        this.requestStatus = 'error'
        this.resultText = this.formatResult(error)
        console.error('DELETE 请求失败:', error)
      }
    },

    formatResult(data) {
      try {
        return JSON.stringify(data, null, 2)
      } catch (error) {
        return String(data)
      }
    },

    clearResult() {
      this.requestStatus = ''
      this.resultText = '暂无请求结果'
    }
  }
}
</script>

<style scoped>
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.request-info {
  margin-top: 10px;
}

.label {
  margin-right: 10px;
  color: #606266;
}

.result-title {
  margin-top: 25px;
  margin-bottom: 10px;
  color: #303133;
  font-weight: 600;
}

.result-box {
  min-height: 300px;
  margin: 0;
  padding: 15px;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
  color: #303133;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
```
