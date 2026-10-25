import { normalizeCaptureAddress, saveCaptureSettings, readCaptureSettings, checkCaptureService } from '@/utils/capture-service'

describe('capture service network settings', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    global.fetch = jest.fn()
    global.AbortController = class {
      constructor() { this.signal = {} }
      abort() {}
    }
  })
  it('defaults to localhost and saves address separately from credentials', () => {
    expect(readCaptureSettings().address).toBe('http://localhost:18090')
    expect(readCaptureSettings().token).toBe('88888888')
    saveCaptureSettings({ address: ' http://localhost:18091/ ', token: 'secret' })
    expect(readCaptureSettings()).toEqual({ address: 'http://localhost:18091', token: 'secret' })
    expect(localStorage.getItem('capture-service-token')).toBeNull()
  })
  it('rejects credentials, paths and non-HTTP addresses', () => {
    for (const address of ['rtsp://camera', 'http://user:password@localhost', 'http://localhost/path', 'http://localhost/?token=x']) {
      expect(() => normalizeCaptureAddress(address)).toThrow()
    }
  })
  it('checks authenticated tools without sending business cookies', async() => {
    fetch.mockResolvedValue({ ok: true, json: async() => ({ ffmpeg: true, mediamtx: true }) })
    await expect(checkCaptureService({ address: 'http://localhost:18090', token: 'secret' })).resolves.toEqual({ ffmpeg: true, mediamtx: true })
    expect(fetch.mock.calls[0][1].credentials).toBe('omit')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer secret')
  })
  it('reports authorization errors instead of claiming success', async() => {
    fetch.mockResolvedValue({ ok: false, json: async() => ({ error: '凭证无效' }) })
    await expect(checkCaptureService({ address: 'http://localhost:18090', token: 'expired' })).rejects.toThrow('凭证无效')
  })
})
