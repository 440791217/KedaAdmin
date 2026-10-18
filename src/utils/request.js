import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import router from '@/router'
import { getToken } from '@/utils/auth'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 10000
})
let resettingSession = false
const isLogin = config => config && config.url === '/user/auth/login'

function failure(message, code, config) {
  const error = new Error(message || '请求失败')
  error.code = code
  error.reported = true
  Message({ message: error.message, type: 'error', duration: 5000 })
  // 403表示权限不足，不能把仍有效的登录会话清掉。
  if (code === 401 && !isLogin(config) && getToken() && !resettingSession) {
    resettingSession = true
    const redirect = router.currentRoute.fullPath
    store.dispatch('user/resetToken').then(() => {
      if (router.currentRoute.path !== '/login') {
        return router.replace({ path: '/login', query: { redirect }})
      }
    }).catch(() => {
      // 路由守卫也会处理失效会话，避免重复跳转产生未处理异常。
    }).finally(() => {
      resettingSession = false
    })
  }
  return Promise.reject(error)
}

service.interceptors.request.use(config => {
  const token = getToken()
  if (token && !isLogin(config)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(response => {
  if (response.config && response.config.responseType === 'blob') return response.data
  const result = response.data
  if (result && result.code === 200) return result
  return failure(result && result.message, result && result.code, response.config)
}, async error => {
  const response = error.response
  const rawBody = response && response.data
  const body = rawBody instanceof Blob
    ? await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => { try { resolve(JSON.parse(reader.result)) } catch (e) { resolve(null) } }
      reader.onerror = () => resolve(null)
      reader.readAsText(rawBody)
    })
    : rawBody
  return failure(
    (body && body.message) || (response ? `请求失败（${response.status}）` : '连接后端失败，请确认服务已启动'),
    (body && body.code) || (response && response.status),
    error.config
  )
})

export default service
