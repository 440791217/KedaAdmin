import { TaskCameraPool } from '@/utils/task-camera-pool'
import { fetchResource, fetchCameraCaptureConfig } from '@/api/resource'
import { createCaptureClient, loadCaptureReader } from '@/utils/capture-session'
jest.mock('@/api/resource', () => ({ fetchResource: jest.fn(), fetchCameraCaptureConfig: jest.fn() }))
jest.mock('@/utils/capture-session', () => ({ createCaptureClient: jest.fn(), loadCaptureReader: jest.fn() }))

let pool, client, readers, order, frame, originalHidden
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve() }
const steps = ids => ids.map(id => ({ id: 'step-' + id, detection: { camera_id: String(id) }}))
beforeEach(() => {
  jest.useFakeTimers(); readers = []; order = []; frame = 1
  originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  jest.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
  jest.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockReturnValue(1280)
  jest.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockReturnValue(720)
  jest.spyOn(HTMLMediaElement.prototype, 'currentTime', 'get').mockImplementation(() => frame)
  fetchResource.mockResolvedValue({ data: { devices: [1, 2, 3, 4, 5, 6].map(id => ({ id: String(id), type_code: 'camera', status: 0, model_status: 0 })) }})
  fetchCameraCaptureConfig.mockImplementation(id => Promise.resolve({ data: { device_id: id, config_version: 1, rtsp_url: 'rtsp://camera/' + id, frame_rates: { refresh_fps: 10, detect_fps: 2 }}}))
  client = { token: 'test', open: jest.fn(config => { order.push('open-' + config.device_id); return Promise.resolve({ session_id: 'session-' + config.device_id }) }), release: jest.fn(id => { order.push('release-' + id); return Promise.resolve() }), heartbeat: jest.fn().mockResolvedValue({ state: 'ready' }), previewURL: session => '/sessions/' + session.session_id }
  createCaptureClient.mockReturnValue(client)
  loadCaptureReader.mockResolvedValue(class {
    constructor(config) { this.config = config; this.close = jest.fn(); readers.push(this); config.onTrack({ streams: [{}] }) }
  })
  pool = new TaskCameraPool('station-1')
})
afterEach(async() => {
  await pool.close(); jest.restoreAllMocks(); jest.useRealTimers(); jest.clearAllMocks()
  if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden); else delete document.hidden
})

it('preconnects four unique cameras and reuses connections when switching or changing execution context', async() => {
  const cameras = steps([1, 1, 2, 3, 4])
  pool.plan('1', cameras); await pool.queue
  expect(pool.entries.size).toBe(4); expect(client.open).toHaveBeenCalledTimes(4)
  const entry = pool.activate('1'); expect(pool.valid(entry)).toBe(true)
  pool.plan('2', cameras, 2); await pool.queue
  expect(pool.activate('2')).toBe(pool.entries.get('2'))
  pool.plan('1', steps([1, 2, 3, 4]), 0); await pool.queue
  expect(pool.activate('1')).toBe(entry)
  expect(client.open).toHaveBeenCalledTimes(4); expect(client.release).not.toHaveBeenCalled()
  expect(client.open.mock.calls[0][0].frame_rates).toBeUndefined()
})

it('does not reload the same stream for duplicate video or audio track events', async() => {
  pool.plan('1', steps([1])); await pool.queue
  const entry = pool.entries.get('1'); const stream = entry.video.srcObject
  const assign = jest.fn()
  Object.defineProperty(entry.video, 'srcObject', { configurable: true, get: () => stream, set: assign })
  readers[0].config.onTrack({ track: { kind: 'video' }, streams: [stream] })
  readers[0].config.onTrack({ track: { kind: 'audio' }, streams: [{}] })
  expect(assign).not.toHaveBeenCalled()
  expect(entry.error).toBe('')
  expect(client.release).not.toHaveBeenCalled()
})

it('retries an interrupted browser play without closing the camera session', async() => {
  const interrupted = new Error('The play() request was interrupted by a new load request.')
  interrupted.name = 'AbortError'
  HTMLMediaElement.prototype.play.mockRejectedValueOnce(interrupted)
  pool.plan('1', steps([1])); await pool.queue; await flush()
  const entry = pool.entries.get('1')
  expect(entry.error).toBe('')
  jest.advanceTimersByTime(100); await flush()
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  expect(pool.valid(entry)).toBe(true)
  expect(client.release).not.toHaveBeenCalled()
  expect(readers[0].close).not.toHaveBeenCalled()
})

it('ignores an old play rejection after replacing its stream', async() => {
  let rejectOld
  HTMLMediaElement.prototype.play.mockImplementationOnce(() => new Promise((resolve, reject) => { rejectOld = reject }))
  pool.plan('1', steps([1])); await pool.queue
  readers[0].config.onTrack({ track: { kind: 'video' }, streams: [{}] })
  rejectOld(new Error('old playback request failed')); await flush()
  expect(pool.entries.get('1').error).toBe('')
  expect(client.release).not.toHaveBeenCalled()
})

it('releases a standby slot before opening a fifth task camera', async() => {
  const cameras = steps([1, 2, 3, 4, 5])
  pool.plan('1', cameras); await pool.queue; pool.activate('1'); await pool.queue
  pool.plan('5', cameras, 4); await pool.queue
  expect(pool.entries.size).toBe(4)
  expect(pool.entries.has('1')).toBe(true)
  expect(pool.valid(pool.activate('5'))).toBe(true)
  expect(order.indexOf('release-session-4')).toBeLessThan(order.indexOf('open-5'))
})

it('releases a late-created session after leaving without creating a video reader', async() => {
  let finish
  client.open.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  pool.plan('1', steps([1])); await flush()
  await pool.close(); finish({ session_id: 'late' }); await pool.queue
  expect(client.release).toHaveBeenCalledWith('late')
  expect(readers).toHaveLength(0); expect(pool.host.isConnected).toBe(false)
})

it('reconnects a requested camera independently and parks the same player across view changes', async() => {
  pool.plan('1', steps([1, 2])); await pool.queue
  const current = pool.activate('1'); const standby = pool.entries.get('2')
  const holder = document.createElement('div'); holder.appendChild(current.video)
  pool.park(current)
  expect(current.video.parentNode).toBe(pool.host)
  expect(client.release).not.toHaveBeenCalled()
  await pool.reset('1'); await pool.queue
  expect(pool.entries.get('2')).toBe(standby)
  expect(readers[1].close).not.toHaveBeenCalled()
  expect(client.open).toHaveBeenCalledTimes(3)
})

it('stops treating a frozen frame as ready and retries only the affected source', async() => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(10000)
  pool.plan('1', steps([1, 2])); await pool.queue
  const old = pool.activate('1')
  expect(pool.valid(old)).toBe(true)
  Object.defineProperty(pool.entries.get('2').video, 'currentTime', { configurable: true, get: () => Date.now() / 1000 })
  // A genuinely stalled standby is not silently presented as a live image.
  clock.mockReturnValue(13100); jest.advanceTimersByTime(3100); await flush()
  expect(pool.valid(old)).toBe(false)
  expect(old.error).toContain('停滞')
  expect(client.release).toHaveBeenCalledWith('session-1')
  expect(pool.valid(pool.entries.get('2'))).toBe(true)
  expect(readers[1].close).not.toHaveBeenCalled()
})
