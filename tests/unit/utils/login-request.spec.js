import service from '@/utils/request'
import { login, getInfo } from '@/api/user'
import { getToken } from '@/utils/auth'
import store from '@/store'

jest.mock('@/store', () => ({ dispatch: jest.fn().mockResolvedValue() }))
jest.mock('@/router', () => ({
  currentRoute: { path: '/dashboard', fullPath: '/dashboard' },
  replace: jest.fn().mockResolvedValue()
}))
jest.mock('@/utils/auth', () => ({ getToken: jest.fn() }))
jest.mock('element-ui', () => ({ Message: jest.fn() }))

describe('login HTTP contract', () => {
  let received
  beforeEach(() => {
    jest.clearAllMocks()
    getToken.mockReturnValue('saved-token')
    service.defaults.adapter = config => {
      received = config
      return Promise.resolve({ status: 200, data: { code: 200, data: {}}, config })
    }
  })

  it('posts password in JSON and never in URL parameters or a stale bearer header', async() => {
    await login({ account: 'root', password: 'Root123!' })
    expect(received.url).toBe('/user/auth/login')
    expect(received.params).toBeUndefined()
    expect(JSON.parse(received.data)).toEqual({ account: 'root', password: 'Root123!' })
    expect(received.headers.Authorization).toBeUndefined()
  })

  it('adds a bearer token when reading the current user', async() => {
    await getInfo()
    expect(received.url).toBe('/user/me')
    expect(received.headers.Authorization).toBe('Bearer saved-token')
  })

  it('returns a protected image blob and still sends the bearer header', async() => {
    const blob = new Blob(['png'], { type: 'image/png' })
    service.defaults.adapter = config => { received = config; return Promise.resolve({ status: 200, data: blob, config }) }
    const result = await service({ url: '/sop/7/version/8/image/9', responseType: 'blob' })
    expect(result).toBe(blob)
    expect(received.headers.Authorization).toBe('Bearer saved-token')
    expect(received.params).toBeUndefined()
  })

  it('does not clear session for a forbidden protected image', async() => {
    service.defaults.adapter = config => Promise.reject({ response: { status: 403, data: new Blob(['denied']) }, config })
    await expect(service({ url: '/sop/7/version/8/image/9', responseType: 'blob' })).rejects.toBeTruthy()
    expect(store.dispatch).not.toHaveBeenCalled()
  })
  it('shows the backend camera error returned as a JSON blob', async() => {
    service.defaults.adapter = config => Promise.reject({ response: { status: 502, data: new Blob([JSON.stringify({ code: 502, message: '摄像头取图超时' })], { type: 'application/json' }) }, config })
    await expect(service({ url: '/resource/device/1/snapshot', method: 'post', responseType: 'blob' })).rejects.toThrow('摄像头取图超时')
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('shows backend validation errors without clearing an authenticated session on 403', async() => {
    service.defaults.adapter = config => Promise.reject({
      response: { status: 403, data: { code: 403, message: '请先修改初始密码' }}, config
    })
    await expect(getInfo()).rejects.toThrow('请先修改初始密码')
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('does not clear session for an incorrect login password', async() => {
    service.defaults.adapter = config => Promise.reject({
      response: { status: 401, data: { code: 401, message: '账号或密码错误' }}, config
    })
    await expect(login({ account: 'root', password: 'Wrong123!' })).rejects.toThrow('账号或密码错误')
    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
