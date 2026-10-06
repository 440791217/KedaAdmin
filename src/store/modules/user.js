import { login, logout } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(),
  user_id: '',
  user_name: '',
  avatar: '',
  gender: '',
  roles: [],
  access_token: '',
  refresh_token: '',
  token_type: '',
  expires_in: ''
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_USER_ID: (state, user_id) => {
    state.user_id = user_id
  },
  SET_USER_NAME: (state, user_name) => {
    state.user_name = user_name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_GENDER: (state, gender) => {
    state.gender = gender
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_ACCESS_TOKEN: (state, access_token) => {
    state.access_token = access_token
  },
  SET_REFRESH_TOKEN: (state, refresh_token) => {
    state.refresh_token = refresh_token
  },
  SET_TOKEN_TYPE: (state, token_type) => {
    state.token_type = token_type
  },
  SET_EXPIRES_IN: (state, expires_in) => {
    state.expires_in = expires_in
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { account, password, login_type, captcha_code } = userInfo
    return new Promise((resolve, reject) => {
      login({
        account: account.trim(),
        password: password,
        login_type: login_type || 'password',
        captcha_code: captcha_code
      }).then(response => {
        const { data } = response
        const user_info = data.user_info || {}

        // 保存 token
        const token = user_info.access_token
        commit('SET_TOKEN', token)
        commit('SET_ACCESS_TOKEN', user_info.access_token)
        commit('SET_REFRESH_TOKEN', user_info.refresh_token)
        commit('SET_TOKEN_TYPE', user_info.token_type)
        commit('SET_EXPIRES_IN', user_info.expires_in)
        setToken(token)

        // 保存用户信息
        commit('SET_USER_ID', data.user_id)
        commit('SET_USER_NAME', data.user_name)
        commit('SET_GENDER', data.gender)
        commit('SET_ROLES', user_info.roles || [])
        commit('SET_AVATAR', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif')

        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get user info（已废弃，登录时已一次性返回）
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      if (state.roles && state.roles.length > 0) {
        resolve({
          roles: state.roles,
          user_name: state.user_name,
          avatar: state.avatar
        })
      } else {
        reject('请先登录')
      }
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        commit('SET_USER_ID', '')
        commit('SET_USER_NAME', '')
        commit('SET_ACCESS_TOKEN', '')
        commit('SET_REFRESH_TOKEN', '')
        removeToken()
        resetRouter()

        // reset visited views and cached views
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const roles = [role]
    commit('SET_ROLES', roles)

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
