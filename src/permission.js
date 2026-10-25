import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false })
const whiteList = ['/login', '/auth-redirect']

router.beforeEach(async(to, from, next) => {
  NProgress.start()
  document.title = getPageTitle(to.meta.title)
  if (!getToken()) {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath }})
      NProgress.done()
    }
    return
  }
  try {
    if (!store.getters.user_loaded) await store.dispatch('user/getInfo')
    if (store.getters.must_change_password && to.path !== '/change-password') {
      next('/change-password')
      NProgress.done()
      return
    }
    if (to.path === '/login') {
      next('/')
      NProgress.done()
      return
    }
    if (!store.state.settings.systemLoaded && !store.state.settings.systemLoading) {
      store.dispatch('settings/loadSystemDefaults').catch(() => {})
    }
    if (!store.getters.routes_ready) {
      const routes = await store.dispatch('permission/generateRoutes', store.getters.roles)
      router.addRoutes(routes)
      next({ ...to, replace: true })
    } else {
      next()
    }
  } catch (error) {
    await store.dispatch('user/resetToken')
    if (!error.reported) Message.error(error.message || '登录状态已失效，请重新登录')
    next({ path: '/login', query: { redirect: to.fullPath }})
    NProgress.done()
  }
})
router.afterEach(() => NProgress.done())
