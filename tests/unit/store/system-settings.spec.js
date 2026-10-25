import settings from '@/store/modules/settings'
import request from '@/utils/request'
import { applySystemTheme } from '@/utils/system-theme'

jest.mock('@/utils/request', () => jest.fn())
jest.mock('@/utils/system-theme', () => ({ applySystemTheme: jest.fn().mockResolvedValue() }))

const fixture = () => ({
  values: { theme: '#13ce66', tagsView: false, fixedHeader: true, sidebarLogo: true },
  versions: { theme: 1, tagsView: 1, fixedHeader: 1, sidebarLogo: 1 },
  can_manage: true
})

let state
let commit

beforeEach(() => {
  request.mockReset()
  state = { ...settings.state, systemVersions: {}}
  commit = (type, value) => settings.mutations[type](state, value)
  settings.actions.resetSystemDefaults({ commit })
})

it('loads typed system defaults and applies the saved theme', async() => {
  request.mockResolvedValue({ data: fixture() })
  await settings.actions.loadSystemDefaults({ commit })
  expect(state.theme).toBe('#13ce66')
  expect(state.tagsView).toBe(false)
  expect(state.systemCanManage).toBe(true)
  expect(state.systemLoading).toBe(false)
  expect(applySystemTheme).toHaveBeenCalledWith('#13ce66')
})

it('saves only SOP appearance parameters with per-key versions', async() => {
  commit('SYSTEM_SETTINGS', fixture())
  request.mockResolvedValue({ data: fixture() })
  await settings.actions.saveSystemDefaults({ state, commit })
  expect(request).toHaveBeenCalledWith({
    url: '/system/settings/appearance', method: 'put',
    data: { values: fixture().values, versions: fixture().versions }
  })
})

it('ignores a pending response from the previous login session', async() => {
  let resolve
  request.mockReturnValue(new Promise(done => { resolve = done }))
  const pending = settings.actions.loadSystemDefaults({ commit })
  settings.actions.resetSystemDefaults({ commit })
  resolve({ data: fixture() })
  await pending
  expect(state.systemLoaded).toBe(false)
  expect(state.systemCanManage).toBe(false)
})
