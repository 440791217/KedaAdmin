import user from '@/store/modules/user'
import { login, getInfo } from '@/api/user'
import { setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

jest.mock('@/api/user', () => ({ login: jest.fn(), logout: jest.fn(), getInfo: jest.fn() }))
jest.mock('@/utils/auth', () => ({ getToken: jest.fn(), setToken: jest.fn(), removeToken: jest.fn() }))
jest.mock('@/router', () => ({ resetRouter: jest.fn() }))

describe('real user session contract', () => {
  beforeEach(() => jest.clearAllMocks())

  it('reads token and user from the actual login response and sends only credentials', async() => {
    const payload = {
      access_token: 'test-token', token_type: 'Bearer', expires_in: 28800,
      user: { id: '9007199254740993', username: 'root', real_name: '管理员',
        is_superuser: true, roles: ['superuser'], permissions: ['*'], must_change_password: false }
    }
    login.mockResolvedValue({ data: payload })
    const state = { ...user.state }
    const commit = (type, value) => user.mutations[type](state, value)
    await user.actions.login({ commit }, { account: ' ROOT ', password: 'Root123!', captcha_code: '8888' })
    expect(login).toHaveBeenCalledWith({ account: 'ROOT', password: 'Root123!' })
    expect(state.token).toBe('test-token')
    expect(state.user_id).toBe('9007199254740993')
    expect(state.user_name).toBe('管理员')
    expect(state.permissions).toEqual(['*'])
    expect(setToken).toHaveBeenCalledWith('test-token')
  })

  it('allows authenticated users with no assigned role', async() => {
    getInfo.mockResolvedValue({ data: { id: '2', username: 'member', roles: [], permissions: [] }})
    const state = { ...user.state }
    await user.actions.getInfo({ commit: (type, value) => user.mutations[type](state, value) })
    expect(state.loaded).toBe(true)
    expect(state.roles).toEqual([])
  })

  it('clears identity, permission flags and dynamic routes on session reset', async() => {
    const state = { ...user.state, token: 'old', loaded: true, is_superuser: true, roles: ['superuser'] }
    const dispatch = jest.fn().mockResolvedValue()
    await user.actions.resetToken({ commit: type => user.mutations[type](state), dispatch })
    expect(state.token).toBe('')
    expect(state.loaded).toBe(false)
    expect(state.is_superuser).toBe(false)
    expect(removeToken).toHaveBeenCalled()
    expect(resetRouter).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith('permission/resetRoutes', null, { root: true })
  })
})
