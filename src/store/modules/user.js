import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

const defaultState = () => ({
  token: '',
  user_id: '',
  user_name: '',
  avatar: '',
  roles: [],
  permissions: [],
  is_superuser: false,
  must_change_password: false,
  loaded: false,
  access_token: '',
  refresh_token: '',
  token_type: '',
  expires_in: 0
})
const state = { ...defaultState(), token: getToken() || '' }

const mutations = {
  SET_SESSION(state, data) {
    state.token = data.access_token
    state.access_token = data.access_token
    state.token_type = data.token_type
    state.expires_in = data.expires_in
  },
  SET_USER_INFO(state, user) {
    state.user_id = user.id
    state.user_name = user.real_name || user.username
    state.avatar = user.avatar_url || ''
    state.roles = user.roles || []
    state.permissions = user.permissions || []
    state.is_superuser = Boolean(user.is_superuser)
    state.must_change_password = Boolean(user.must_change_password)
    state.loaded = true
  },
  CLEAR_SESSION(state) {
    Object.assign(state, defaultState())
  }
}

const actions = {
  async login({ commit }, form) {
    const { data } = await login({ account: form.account.trim(), password: form.password })
    if (!data || !data.access_token || !data.user) {
      throw new Error('登录响应缺少用户资料或token')
    }
    commit('SET_SESSION', data)
    commit('SET_USER_INFO', data.user)
    setToken(data.access_token)
    return data
  },
  async getInfo({ commit }) {
    const { data } = await getInfo()
    commit('SET_USER_INFO', data)
    return data
  },
  async logout({ dispatch }) {
    try {
      await logout()
    } catch (error) {
      // 服务端已过期或网络失败时，仍清除本地会话。
    } finally {
      await dispatch('resetToken')
    }
  },
  async resetToken({ commit, dispatch }) {
    removeToken()
    commit('CLEAR_SESSION')
    resetRouter()
    await dispatch('permission/resetRoutes', null, { root: true })
    await dispatch('tagsView/delAllViews', null, { root: true })
  },
  changeRoles() {
    return Promise.reject(new Error('角色由服务端管理，不能在浏览器中模拟切换'))
  }
}

export default { namespaced: true, state, mutations, actions }
