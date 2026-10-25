import { shallowMount, mount } from '@vue/test-utils'
import LiveDetection from '@/shared/execution/components/LiveDetection.vue'
import DetectionStatus from '@/shared/execution/components/DetectionStatus.vue'
import { createDetectionClient } from '@/utils/detection-service'
jest.mock('@/utils/detection-service', () => ({ createDetectionClient: jest.fn() }))
jest.mock('@/api/resource', () => ({ fetchResource: jest.fn(), fetchCameraCaptureConfig: jest.fn() }))
jest.mock('@/utils/request', () => jest.fn().mockResolvedValue({ data: {}}))

const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve() }
let wrapper, predict, context, originalHidden, load
beforeEach(() => {
  jest.useFakeTimers()
  originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  context = { measureText: jest.fn(text => ({ width: text.length * 7 })), fillRect: jest.fn(), clearRect: jest.fn(), drawImage: jest.fn(), strokeRect: jest.fn(), fillText: jest.fn() }
  HTMLCanvasElement.prototype.getContext = jest.fn(() => context)
  HTMLCanvasElement.prototype.toBlob = jest.fn(callback => callback(new Blob(['jpeg'], { type: 'image/jpeg' })))
  predict = jest.fn()
  load = jest.fn()
  createDetectionClient.mockReturnValue({ models: jest.fn().mockResolvedValue({ models: [{ id: 'yolov8n', status: 'ready' }] }), predict })
  wrapper = shallowMount(LiveDetection, { stubs: { DetectionStatus, 'el-select': true, 'el-option': true, 'el-button': true, 'el-alert': true, 'el-tag': true, 'el-checkbox': true }, propsData: { stationId: '1', executionId: '2', stepId: '3', running: true, step: { detection: { enabled: true, confirmed: true, camera_id: 'camera-1', attachment_id: 'img-1' }, attachments: [{ id: 'img-1', visual: { guide_items: [], detection_regions: [{ id: 'r1', enabled: true, detect_type: 'object', class_name: 'person', confidence: 50, x: 0, y: 0, width: 1, height: 1 }] }}] }}, methods: { load }})
  const video = wrapper.vm.$refs.video
  Object.defineProperties(video, { currentTime: { configurable: true, get: () => Date.now() / 1000 }, videoWidth: { value: 1280 }, videoHeight: { value: 720 }, readyState: { value: 4 }})
})
const start = async() => {
  await flush()
  await wrapper.setData({ cameraId: wrapper.vm.boundCameraId })
  Object.assign(wrapper.vm, { _active: { client: { release: jest.fn().mockResolvedValue() }, session: { session_id: 'test' }}, _streamGeneration: 1, _readyStreamGeneration: 1 })
  wrapper.vm.restartDetection(); await flush()
}

it('uses the camera detection rate and never queues requests or repeats an unchanged frame', async() => {
  const clock = jest.spyOn(performance, 'now').mockReturnValue(0)
  let sourceFrame = 1
  Object.defineProperty(wrapper.vm.$refs.video, 'currentTime', { configurable: true, get: () => sourceFrame })
  predict.mockImplementation((blob, metadata) => Promise.resolve({ context: metadata, image_width: 960, image_height: 540, inference_ms: 1, detections: [] }))
  await wrapper.setData({ frameRates: { refresh_fps: 0, detect_fps: 5 }})
  await start()
  expect(predict).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(190); await flush()
  expect(predict).toHaveBeenCalledTimes(1)
  sourceFrame++
  jest.advanceTimersByTime(20); await flush()
  expect(predict).toHaveBeenCalledTimes(2)
  await wrapper.setProps({ running: false }); await flush()
  Object.defineProperty(wrapper.vm.$refs.video, 'currentTime', { configurable: true, get: () => 42 })
  await wrapper.setProps({ running: true }); await flush()
  const calls = predict.mock.calls.length
  jest.advanceTimersByTime(1000); await flush()
  expect(predict).toHaveBeenCalledTimes(calls)
  clock.mockRestore()
})
afterEach(() => {
  wrapper.destroy(); jest.useRealTimers()
  if (originalHidden) Object.defineProperty(document, 'hidden', originalHidden)
  else delete document.hidden
})

it('waits for each response and discards a late result after switching steps', async() => {
  let finish
  predict.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  await start()
  expect(predict).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(1000); await flush()
  expect(predict).toHaveBeenCalledTimes(1)
  const [, metadata, signal] = predict.mock.calls[0]
  await wrapper.setProps({ running: false }); await flush()
  expect(wrapper.vm.running).toBe(false)
  await wrapper.setProps({ stepId: '4', running: false }); await flush()
  expect(wrapper.vm.running).toBe(false)
  expect(signal.aborted).toBe(true)
  finish({ context: metadata, image_width: 960, image_height: 540, inference_ms: 30, detections: [] })
  await flush(); jest.advanceTimersByTime(3000); await flush()
  expect(wrapper.vm.result).toBeNull()
  expect(predict).toHaveBeenCalledTimes(1)
})

it('draws boxes in the contained video area and stops when leaving', async() => {
  predict.mockImplementation((blob, metadata) => Promise.resolve({ context: metadata, image_width: 960, image_height: 540, inference_ms: 30, detections: [{ class_name: 'person', confidence: 0.9, bbox_xyxy: [96, 54, 480, 270] }] }))
  await start()
  expect(wrapper.vm.result.detections).toHaveLength(1)
  expect(wrapper.find({ name: 'LiveGuidanceOverlay' }).props('states')).toHaveLength(1)
  await wrapper.setData({ showRegions: false })
  expect(wrapper.find({ name: 'LiveGuidanceOverlay' }).props('states')).toEqual([])
  expect(context.strokeRect).toHaveBeenCalledWith(128, 72, 512, 288)
  expect(context.strokeStyle).toBe('#409EFF')
  expect(context.font).toBe('12px sans-serif')
  wrapper.destroy(); jest.advanceTimersByTime(3000); await flush()
  expect(predict).toHaveBeenCalledTimes(1)
})

it('uses only the selected pooled video and rejects an older camera response without reconnecting sources', async() => {
  const pending = []
  predict.mockImplementation((file, metadata, signal) => new Promise(resolve => pending.push({ metadata, signal, resolve })))
  const entries = new Map()
  for (const id of ['camera-1', 'camera-2']) {
    const video = document.createElement('video')
    Object.defineProperties(video, { videoWidth: { value: 1280 }, videoHeight: { value: 720 }, readyState: { value: 4 }})
    video.requestVideoFrameCallback = jest.fn(() => 1); video.cancelVideoFrameCallback = jest.fn()
    entries.set(id, { id, video, error: '', cameras: [], rates: { refresh_fps: 0, detect_fps: 2 }, client: {}, session: {}})
  }
  const pool = { entries, valid: entry => !!entry, activate: id => entries.get(id), plan: jest.fn(), reset: jest.fn(), subscribe: jest.fn(() => jest.fn()) }
  const first = wrapper.props('step')
  const second = { ...first, detection: { ...first.detection, camera_id: 'camera-2' }}
  const harness = mount({
    data() { return { current: first, index: 0 } },
    render(h) { return h(LiveDetection, { props: { stationId: '1', executionId: '2', stepId: String(this.index + 3), running: true, cameraPool: pool, cameraSteps: [first, second], cameraStepIndex: this.index, step: this.current }}) }
  }, { stubs: { DetectionStatus: true, LiveGuidanceOverlay: true, 'el-select': true, 'el-option': true, 'el-button': true, 'el-tag': true, 'el-checkbox': true }})
  try {
    await flush()
    const live = harness.find(LiveDetection).vm
    expect(live.sourceVideo()).toBe(entries.get('camera-1').video)
    expect(pending).toHaveLength(1)
    await harness.setData({ current: second, index: 1 }); await flush()
    expect(live.boundCameraId).toBe('camera-2')
    expect(live.cameraId).toBe('camera-2')
    expect(live.sourceVideo()).toBe(entries.get('camera-2').video)
    expect(pending[0].signal.aborted).toBe(true)
    expect(pending.length).toBeGreaterThanOrEqual(2)
    expect(pending.filter(request => !request.signal.aborted)).toHaveLength(1)
    pending[0].resolve({ context: pending[0].metadata, image_width: 960, image_height: 540, inference_ms: 1, detections: [] }); await flush()
    expect(live.result).toBeNull()
    expect(pool.reset).not.toHaveBeenCalled()
  } finally { harness.destroy() }
})

it('clears previous boxes on service failure and retries with a delay', async() => {
  predict.mockRejectedValue(new Error('检测服务繁忙'))
  await start()
  expect(wrapper.vm.result).toBeNull()
  expect(wrapper.vm.detectionError).toContain('繁忙')
  expect(wrapper.find('.live-frame .recognition-status').text()).toContain('检测服务繁忙')
  expect(wrapper.findAll('el-alert-stub').length).toBe(0)
  jest.advanceTimersByTime(1000); await flush(); expect(predict).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(1000); await flush(); expect(predict).toHaveBeenCalledTimes(2)
})

it('keeps results from the new step when an older request returns later', async() => {
  const pending = []
  predict.mockImplementation((blob, metadata) => new Promise(resolve => pending.push({ metadata, resolve })))
  await start()
  await wrapper.setProps({ stepId: '4' }); await flush()
  expect(pending).toHaveLength(2)
  const result = request => ({ context: request.metadata, image_width: 960, image_height: 540, inference_ms: 30, detections: [] })
  pending[1].resolve(result(pending[1])); await flush()
  pending[0].resolve(result(pending[0])); await flush()
  expect(wrapper.vm.result.context.step_id).toBe('4')
})

it('offsets detection boxes by the letterbox margins', async() => {
  await flush()
  const video = wrapper.vm.$refs.video
  Object.defineProperties(video, { clientWidth: { value: 600 }, clientHeight: { value: 600 }})
  wrapper.vm.drawResult({ image_width: 960, image_height: 540, detections: [{ class_name: 'person', confidence: 0.9, bbox_xyxy: [96, 54, 480, 270] }] }, video)
  expect(context.strokeRect).toHaveBeenCalledWith(60, 165, 240, 135)
})

it('allows preview before an execution without sending predictions', async() => {
  await wrapper.setProps({ executionId: '', running: false }); await wrapper.setData({ cameraId: 'camera-1' })
  await start()
  expect(wrapper.text()).toContain('检测未启动')
  expect(wrapper.find('.recognition-status').text()).toContain('等待扫码开工')
  expect(predict).not.toHaveBeenCalled()
  expect(wrapper.find({ name: 'LiveGuidanceOverlay' }).props('states')).toEqual([])
  expect(wrapper.find('.live-frame .detection-verdict').exists()).toBe(false)
  expect(wrapper.vm.verdict).toEqual({ code: 'idle', text: '待开工' })
})

it('shows NG until all enabled regions match in the same result, then emits the exact step with OK', async() => {
  const step = JSON.parse(JSON.stringify(wrapper.props('step')))
  step.attachments[0].visual.detection_regions.push({ ...step.attachments[0].visual.detection_regions[0], id: 'r2', class_name: 'cup' })
  await wrapper.setProps({ step }); await flush()
  let includeCup = false
  predict.mockImplementation((blob, metadata) => Promise.resolve({ context: metadata, image_width: 960, image_height: 540, inference_ms: 30, detections: [{ class_name: 'person', confidence: 0.9, bbox_xyxy: [96, 54, 480, 270] }, ...(includeCup ? [{ class_name: 'cup', confidence: 0.9, bbox_xyxy: [96, 54, 480, 270] }] : [])] }))
  await start()
  expect(wrapper.find('.detection-verdict.is-ng').text()).toContain('NG')
  expect(wrapper.emitted('satisfied')).toBeUndefined()
  includeCup = true; jest.advanceTimersByTime(500); await flush()
  expect(wrapper.find('.detection-verdict.is-ok').text()).toContain('OK')
  expect(wrapper.emitted('satisfied')[0][0]).toEqual(expect.objectContaining({ executionId: '2', stepId: '3', photo: expect.objectContaining({ file: expect.any(Blob), metadata: expect.objectContaining({ camera_id: 'camera-1', model_id: 'yolov8n', automatic: true, image_width: 960, image_height: 540 }) }) }))
  expect(wrapper.emitted('satisfied')[0][0].photo.file).toBe(predict.mock.calls[1][0])
  await wrapper.setProps({ running: false, stepConfirmed: true }); await flush()
  expect(wrapper.find('.detection-verdict.is-ok').text()).toContain('本步骤已完成')
})

it('uses only the saved baseline and refuses unconfigured detection', async() => {
  expect(wrapper.vm.activeVisual).toBe(wrapper.props('step').attachments[0].visual)
  await wrapper.setProps({ step: { detection: { enabled: true, confirmed: true, camera_id: 'camera-1', attachment_id: 'missing' }, attachments: wrapper.props('step').attachments }})
  await start()
  expect(predict).not.toHaveBeenCalled()
  expect(wrapper.vm.activeVisual).toBeNull()
  expect(wrapper.text()).toContain('步骤检测配置待确认')
})
it('clears old results and reconnects when the step binds another camera', async() => {
  let finish
  predict.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  await start()
  const [, metadata, signal] = predict.mock.calls[0]
  const step = JSON.parse(JSON.stringify(wrapper.props('step')))
  load.mockClear()
  step.detection.camera_id = 'camera-2'
  await wrapper.setProps({ stepId: '5', step }); await flush()
  expect(wrapper.vm.boundCameraId).toBe('camera-2')
  expect(wrapper.vm.preferredCamera()).toBe('camera-2')
  expect(load).toHaveBeenCalledTimes(1)
  expect(signal.aborted).toBe(true)
  finish({ context: metadata, image_width: 960, image_height: 540, inference_ms: 30, detections: [] }); await flush()
  expect(wrapper.vm.result).toBeNull()
})
it('reuses the stream and video element when switching steps and baselines on the same camera', async() => {
  predict.mockImplementation(() => new Promise(() => {}))
  await start()
  const stream = {}; const video = wrapper.vm.$refs.video; video.srcObject = stream
  const active = wrapper.vm._active; const reader = { close: jest.fn() }; wrapper.vm._reader = reader
  const oldSignal = predict.mock.calls[0][2]; load.mockClear()
  const step = JSON.parse(JSON.stringify(wrapper.props('step')))
  step.detection.attachment_id = 'img-2'; step.attachments[0].id = 'img-2'
  await wrapper.setProps({ stepId: '4', step }); await flush()
  expect(oldSignal.aborted).toBe(true)
  expect(wrapper.vm.result).toBeNull()
  expect(load).not.toHaveBeenCalled()
  expect(wrapper.vm._active).toBe(active); expect(reader.close).not.toHaveBeenCalled()
  expect(wrapper.vm.$refs.video).toBe(video); expect(video.srcObject).toBe(stream)
  expect(predict.mock.calls[predict.mock.calls.length - 1][1].step_id).toBe('4')
})
it('pauses predictions for references and resumes on the existing session without reconnecting', async() => {
  predict.mockImplementation(() => new Promise(() => {}))
  await start(); const active = wrapper.vm._active; const signal = predict.mock.calls[0][2]; load.mockClear()
  await wrapper.setProps({ previewActive: false }); await flush(); jest.advanceTimersByTime(3000); await flush()
  expect(signal.aborted).toBe(true); expect(predict).toHaveBeenCalledTimes(1)
  expect(wrapper.vm._active).toBe(active); expect(load).not.toHaveBeenCalled()
  await wrapper.setProps({ previewActive: true }); await flush()
  expect(predict).toHaveBeenCalledTimes(2); expect(wrapper.vm._active).toBe(active)
  expect(load).not.toHaveBeenCalled()
})
