import request from '@/utils/request'
import RequestActions from '../components/RequestActions.vue'
import RequestResult from '../components/RequestResult.vue'

export default {
  name: 'RequestTest',

  components: { RequestActions, RequestResult },

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
