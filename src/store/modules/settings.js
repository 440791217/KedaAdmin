import variables from '@/styles/element-variables.scss'
import defaultSettings from '@/settings'
import request from '@/utils/request'
import { applySystemTheme } from '@/utils/system-theme'

const { showSettings, tagsView, fixedHeader, sidebarLogo } = defaultSettings
let systemLoad
let systemGeneration = 0

const state = {
  theme: variables.theme,
  showSettings: showSettings,
  tagsView: tagsView,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  systemLoaded: false,
  systemLoading: false,
  systemCanManage: false,
  systemVersions: {}
}

const mutations = {
  SYSTEM_SETTINGS(state, data) {
    Object.keys(data.values).forEach(key => {
      if (['theme', 'tagsView', 'fixedHeader', 'sidebarLogo'].includes(key)) state[key] = data.values[key]
    })
    state.systemVersions = data.versions
    state.systemCanManage = data.can_manage === true
    state.systemLoaded = true
  },
  CHANGE_SETTING: (state, { key, value }) => {
    // eslint-disable-next-line no-prototype-builtins
    if (state.hasOwnProperty(key)) {
      state[key] = value
    }
  }
}

const actions = {
  loadSystemDefaults({ commit }) {
    if (systemLoad) return systemLoad
    const generation = systemGeneration
    commit('CHANGE_SETTING', { key: 'systemLoading', value: true })
    const pending = request({ url: '/system/settings/appearance', method: 'get' })
      .then(({ data }) => {
        if (generation !== systemGeneration) return
        commit('SYSTEM_SETTINGS', data)
        applySystemTheme(data.values.theme).catch(() => {})
      })
      .finally(() => {
        if (generation === systemGeneration) commit('CHANGE_SETTING', { key: 'systemLoading', value: false })
        if (systemLoad === pending) systemLoad = null
      })
    systemLoad = pending
    return pending
  },
  async saveSystemDefaults({ state, commit }) {
    const generation = systemGeneration
    const values = {
      theme: state.theme,
      tagsView: state.tagsView,
      fixedHeader: state.fixedHeader,
      sidebarLogo: state.sidebarLogo
    }
    const { data } = await request({
      url: '/system/settings/appearance',
      method: 'put',
      data: { values, versions: state.systemVersions }
    })
    if (generation !== systemGeneration) return
    commit('SYSTEM_SETTINGS', data)
    applySystemTheme(data.values.theme).catch(() => {})
  },
  resetSystemDefaults({ commit }) {
    ++systemGeneration
    systemLoad = null
    commit('CHANGE_SETTING', { key: 'systemLoading', value: false })
    commit('CHANGE_SETTING', { key: 'systemLoaded', value: false })
    commit('CHANGE_SETTING', { key: 'systemCanManage', value: false })
    commit('CHANGE_SETTING', { key: 'systemVersions', value: {}})
  },
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
    if (data.key === 'theme') applySystemTheme(data.value).catch(() => {})
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

