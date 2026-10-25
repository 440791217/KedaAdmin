import { createCaptureClient } from '@/utils/capture-session'

const previousController = global.AbortController
beforeEach(() => {
  global.fetch = jest.fn()
  global.AbortController = class { constructor() { this.signal = {} } abort() {} }
})
afterEach(() => { global.AbortController = previousController })
it('sends camera configuration only to the configured capture service', async() => {
  fetch.mockResolvedValue({ ok: true, status: 201, headers: { get: () => 'application/json' }, json: async() => ({ session_id: 'session-1' }) })
  const client = createCaptureClient({ address: 'http://localhost:18090', token: 'capture-token' })
  await client.open({ device_id: '2', config_version: 1, rtsp_url: 'rtsp://camera/live' })
  expect(fetch.mock.calls[0][0]).toBe('http://localhost:18090/sessions')
  expect(fetch.mock.calls[0][1].credentials).toBe('omit')
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer capture-token')
  expect(JSON.parse(fetch.mock.calls[0][1].body).device_id).toBe('2')
})
it('refuses to disclose the token to an unexpected preview host', () => {
  const client = createCaptureClient({ address: 'http://localhost:18090', token: 'capture-token' })
  expect(() => client.previewURL({ session_id: 'session-1', preview_url: 'http://other-host/sessions/session-1/whep' })).toThrow('预览地址无效')
  expect(client.previewURL({ session_id: 'session-1', preview_url: '/sessions/session-1/whep' })).toBe('http://localhost:18090/sessions/session-1/whep')
})
it('uses keepalive when releasing a session and reports expired credentials', async() => {
  const client = createCaptureClient({ address: 'http://localhost:18090', token: 'expired' })
  fetch.mockResolvedValue({ ok: true, status: 204 })
  await client.release('session-1')
  expect(fetch.mock.calls[0][1].keepalive).toBe(true)
  fetch.mockResolvedValue({ ok: false, status: 401, json: async() => ({}) })
  await expect(client.snapshot('session-1')).rejects.toThrow('访问凭证已失效')
})
