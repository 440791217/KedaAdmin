import { readDetectionSettings, saveDetectionSettings, createDetectionClient } from '@/utils/detection-service'

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); global.fetch = jest.fn() })

it('stores only the address persistently and uses independent detection credentials', () => {
  expect(readDetectionSettings().address).toBe('http://localhost:18092')
  saveDetectionSettings({ address: 'http://localhost:18093/', token: ' detector-token ' })
  expect(readDetectionSettings()).toEqual({ address: 'http://localhost:18093', token: 'detector-token' })
  expect(localStorage.getItem('detection-service-token')).toBeNull()
  expect(() => saveDetectionSettings({ address: 'http://localhost:18093/path', token: 'token' })).toThrow()
})

it('sends a multipart frame with context and no business login credentials', async() => {
  global.fetch.mockResolvedValue({ ok: true, json: async() => ({ detections: [] }) })
  const signal = {}
  await createDetectionClient({ address: 'http://localhost:18092', token: 'detector-token' }).predict(new Blob(['jpeg']), { model_id: 'yolov8n', frame_id: '1', step_id: '2' }, signal)
  const [url, options] = global.fetch.mock.calls[0]
  expect(url).toBe('http://localhost:18092/predict')
  expect(options.headers).toEqual({ Authorization: 'Bearer detector-token' })
  expect(options.credentials).toBe('omit')
  expect(options.signal).toBe(signal)
  expect(JSON.parse(options.body.get('metadata')).step_id).toBe('2')
})

it('reports model overload without accepting it as a successful result', async() => {
  global.fetch.mockResolvedValue({ ok: false, status: 429, json: async() => ({ detail: 'busy' }) })
  await expect(createDetectionClient().models()).rejects.toThrow('繁忙')
})
