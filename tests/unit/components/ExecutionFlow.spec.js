import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import ExecutionPanel from '@/shared/execution/components/ExecutionPanel.vue'
import ExecutionRecords from '@/views/onsite/records/index.vue'
import ProtectedImage from '@/shared/sop/components/ProtectedImage.vue'
import request from '@/utils/request'
import * as executionVoice from '@/shared/execution/voice-events'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
const fixture = () => ({ id: '50', task_name: '外观检查', product_code: 'P001', status: 0, version: 0, revision_no: 1, can_operate: true, can_abort: true, content: { steps: [{ id: '41', title: '第一步', instruction: '检查外观', attachments: [] }, { id: '42', title: '第二步', instruction: '复核标签', attachments: [] }] }, steps: [{ position: 1, confirmed_at: null }, { position: 2, confirmed_at: null }], events: [] })
let wrappers
function restoreUrls(create, revoke) { URL.createObjectURL = create; URL.revokeObjectURL = revoke }
const message = { success: jest.fn(), warning: jest.fn() }
function page(component, propsData) { const w = mount(component, { localVue, sync: false, propsData, mocks: { $message: message, $confirm: jest.fn().mockResolvedValue() }, stubs: { AnnotatedImage: true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }}); wrappers.push(w); return w }
beforeEach(() => { wrappers = []; request.mockReset(); request.mockResolvedValue({ data: fixture() }) })
afterEach(() => { wrappers.forEach(w => w.destroy()); jest.restoreAllMocks() })
it('confirms only the next step and uses execution version, then advances to the next step', async() => {
  const w = page(ExecutionPanel, { executionId: '50' }); await flush()
  expect(w.vm.canConfirm).toBe(true)
  w.vm.stepIndex = 1; await flush(); expect(w.vm.canConfirm).toBe(false)
  w.vm.stepIndex = 0; const next = fixture(); next.version = 1; next.steps[0].confirmed_at = '2026-10-17T14:00:00'; request.mockResolvedValueOnce({ data: next })
  await w.vm.submit('confirm'); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50/step/1/confirm', data: { version: 0, reason: undefined }})); expect(w.vm.stepIndex).toBe(1)
  expect(w.findAll('button').wrappers.some(b => b.text() === '完成作业')).toBe(false)
  expect(w.find('.flow-progress').text()).toBe('已完成 1/2')
})

it.each([
  ['pause', 1, 'execution.paused'],
  ['resume', 0, 'execution.resumed'],
  ['abort', 3, 'execution.aborted'],
  ['complete', 2, 'execution.completed']
])('announces %s only after its successful response', async(action, status, event) => {
  const announce = jest.spyOn(executionVoice, 'announceExecution').mockImplementation(() => {})
  const w = page(ExecutionPanel, { executionId: '50' })
  await flush()
  expect(announce).not.toHaveBeenCalled()
  const result = fixture()
  result.version = 7
  result.status = status
  request.mockResolvedValueOnce({ data: result })
  await w.vm.submit(action, '原因')
  expect(announce).toHaveBeenCalledWith(event, {
    scopeId: 'execution:50',
    operationId: '7'
  })
  await w.vm.load()
  expect(announce).toHaveBeenCalledTimes(1)
})

it('announces all steps complete separately from completing the job and stays silent on failure', async() => {
  const announce = jest.spyOn(executionVoice, 'announceExecution').mockImplementation(() => {})
  const w = page(ExecutionPanel, { executionId: '50' })
  await flush()
  request.mockRejectedValueOnce(new Error('failed'))
  await w.vm.submit('confirm')
  expect(announce).not.toHaveBeenCalled()
  const result = fixture()
  result.version = 3
  result.steps.forEach(row => { row.confirmed_at = 'done' })
  request.mockResolvedValueOnce({ data: result })
  await w.vm.submit('confirm')
  expect(announce).toHaveBeenCalledWith('execution.stepsCompleted', {
    scopeId: 'execution:50',
    operationId: '3'
  })
})

it('saves heartbeat time, freezes on page suspension and starts a new session only when continuing', async() => {
  const hidden = Object.getOwnPropertyDescriptor(document, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const record = fixture(); record.clock_supported = true; record.content.steps[0].expected_duration_seconds = 30
  record.steps[0].elapsed_ms = 0; record.steps[0].remaining_ms = 30000; record.steps[0].timing_running = false
  let elapsed = 0
  request.mockImplementation(config => {
    if (!config.url.endsWith('/clock')) return Promise.resolve({ data: record })
    elapsed += config.data.elapsed_ms
    return Promise.resolve({ data: { position: 1, elapsed_ms: elapsed, remaining_ms: 30000 - elapsed, timing_running: config.data.action !== 'release' }})
  })
  try {
    const w = page(ExecutionPanel, { executionId: '50' }); await flush()
    expect(w.vm.clockConnected).toBe(true); const originalSession = w.vm._heartbeat.session
    now = 5000; jest.advanceTimersByTime(5000); await flush()
    expect(w.vm.execution.steps[0].elapsed_ms).toBe(5000)
    w.vm.suspendClock(); await flush(); expect(w.vm.clockConnected).toBe(false)
    expect(w.vm.execution.steps[0].timing_running).toBe(false)
    now = 25000; jest.advanceTimersByTime(20000); await flush(); expect(elapsed).toBe(5000)
    const count = request.mock.calls.length
    w.vm.syncClock(); await flush(); expect(request.mock.calls.length).toBe(count)
    w.vm.resumeClock(); await flush(); expect(w.vm.clockConnected).toBe(true)
    expect(w.vm._heartbeat.session).not.toBe(originalSession)
    expect(w.vm.execution.steps[0].elapsed_ms).toBe(5000)
    request.mockClear(); now = 25500; await w.vm.submit('confirm'); await flush()
    const confirm = request.mock.calls.find(([config]) => config.url.endsWith('/confirm'))[0]
    expect(confirm.data.clock_session_id).toBeTruthy()
    expect(request.mock.calls[0][0].url).toBe('/execution/50/clock')
  } finally {
    wrappers.forEach(wrapper => wrapper.destroy()); wrappers = []
    if (hidden) Object.defineProperty(document, 'hidden', hidden); else delete document.hidden
    jest.useRealTimers()
  }
})

it('refreshes an older cached execution before starting its heartbeat and counts between saves', async() => {
  const hidden = Object.getOwnPropertyDescriptor(document, 'hidden')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const cached = fixture(); const fresh = fixture(); fresh.clock_supported = true
  fresh.content.steps[0].expected_duration_seconds = 30
  fresh.steps[0] = { ...fresh.steps[0], elapsed_ms: 0, remaining_ms: 30000, timing_running: false }
  let elapsed = 0
  request.mockImplementation(config => {
    if (!config.url.endsWith('/clock')) return Promise.resolve({ data: fresh })
    elapsed += config.data.elapsed_ms
    return Promise.resolve({ data: { position: 1, elapsed_ms: elapsed, remaining_ms: 30000 - elapsed, timing_running: config.data.action !== 'release' }})
  })
  try {
    const w = page(ExecutionPanel, { executionId: '50', initialExecution: cached }); await flush()
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50' }))
    expect(w.vm.clockConnected).toBe(true)
    for (let second = 1; second <= 7; second++) {
      now = second * 1000; jest.advanceTimersByTime(1000); await flush()
      expect(w.find('.timing-running').text()).toBe('剩余 00:' + String(30 - second).padStart(2, '0'))
    }
    expect(elapsed).toBe(5000)
    const writes = request.mock.calls.filter(([config]) => config.url.endsWith('/clock'))
    expect(writes).toHaveLength(2)
  } finally {
    wrappers.forEach(wrapper => wrapper.destroy()); wrappers = []
    if (hidden) Object.defineProperty(document, 'hidden', hidden); else delete document.hidden
    jest.useRealTimers()
  }
})

it('locks running and paused navigation and refuses a direct out-of-order confirmation', async() => {
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  const guide = w.find({ name: 'OperationGuide' })
  expect(guide.props('navigationLocked')).toBe(true)
  expect(w.findAll('.operation-flow button').at(1).attributes('disabled')).toBe('disabled')
  expect(w.find('.operation-controls').text()).not.toContain('下一步')
  expect(w.find('.operation-controls').text()).not.toContain('上一步')
  guide.vm.select(1); guide.vm.$emit('select', 1); await flush()
  expect(w.vm.stepIndex).toBe(0)
  w.vm.execution.status = 1; await flush(); w.vm.selectStep(1)
  expect(w.vm.stepIndex).toBe(0)
  w.vm.execution.status = 0; w.vm.stepIndex = 1
  await w.vm.submit('confirm'); expect(request).not.toHaveBeenCalled()
})

it('allows browsing ended and readonly executions while keeping active work fixed', async() => {
  const record = fixture(); record.status = 2; record.can_operate = false; request.mockResolvedValueOnce({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush()
  expect(w.find({ name: 'OperationGuide' }).props('navigationLocked')).toBe(false)
  w.vm.selectStep(1); await flush(); expect(w.vm.stepIndex).toBe(1)
  await w.setProps({ readonly: true }); w.vm.execution.status = 0; w.vm.selectStep(0)
  expect(w.vm.stepIndex).toBe(0)
})
it('requires a pause reason and keeps paused executions from confirming', async() => {
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  await w.vm.action('pause'); expect(w.vm.reasonOpen).toBe(true); await w.vm.submitReason(); expect(request).not.toHaveBeenCalled()
  const paused = fixture(); paused.status = 1; paused.version = 1; request.mockResolvedValueOnce({ data: paused }); w.vm.reason = '来料异常'; await w.vm.submitReason(); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50/pause', data: { version: 0, reason: '来料异常' }})); expect(w.vm.canConfirm).toBe(false)
  expect(w.find('.operation-controls').text()).toContain('继续作业')
  expect(w.find('.operation-controls').text()).not.toContain('确认本步骤')
  request.mockResolvedValueOnce({ data: fixture() }); await w.findAll('button').wrappers.find(b => b.text() === '继续作业').trigger('click'); await flush()
  expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/execution/50/resume' }))
})
it('automatically confirms only the current detection step and ignores duplicate or stale results', async() => {
  const record = fixture(); record.content.steps[0].detection = { enabled: true }; request.mockResolvedValueOnce({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  expect(w.find('.operation-controls').text()).not.toContain('确认本步骤')
  await w.vm.autoConfirm({ executionId: '49', stepId: '41' })
  await w.vm.autoConfirm({ executionId: '50', stepId: '42' })
  expect(request).not.toHaveBeenCalled()
  let finish; request.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const pending = w.vm.autoConfirm({ executionId: '50', stepId: '41' })
  await w.vm.autoConfirm({ executionId: '50', stepId: '41' }); expect(request).toHaveBeenCalledTimes(1)
  const next = fixture(); next.version = 1; next.steps[0].confirmed_at = '2026-10-22T10:00:00'; finish({ data: next }); await pending; await flush()
  expect(w.vm.stepIndex).toBe(1)
  await w.vm.autoConfirm({ executionId: '50', stepId: '41' }); expect(request).toHaveBeenCalledTimes(1)
})
it('uploads the passing image with step confirmation and never falls back to confirmation without it', async() => {
  const record = fixture(); record.content.steps[0].detection = { enabled: true, camera_id: '77' }; request.mockResolvedValueOnce({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  request.mockRejectedValueOnce(new Error('照片保存失败'))
  const file = new Blob(['passed-frame'], { type: 'image/jpeg' })
  await w.vm.autoConfirm({ executionId: '50', stepId: '41', photo: { file, metadata: { request_key: 'evidence_request_0001', camera_id: '77', automatic: true }}}); await flush()
  expect(request).toHaveBeenCalledTimes(1)
  expect(request.mock.calls[0][0]).toEqual(expect.objectContaining({ url: '/execution/50/step/1/evidence', method: 'post', data: expect.any(FormData) }))
  expect(w.vm.stepIndex).toBe(0); expect(w.vm.autoFailed).toBe(true)
})
it('blocks automatic progression while paused or handling a reason and stops repeated submissions after failure', async() => {
  const record = fixture(); record.content.steps[0].detection = { enabled: true }; request.mockResolvedValueOnce({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  w.vm.execution.status = 1; await w.vm.autoConfirm({ executionId: '50', stepId: '41' })
  w.vm.execution.status = 0; w.vm.reasonOpen = true; await w.vm.autoConfirm({ executionId: '50', stepId: '41' }); expect(request).not.toHaveBeenCalled()
  w.vm.reasonOpen = false; request.mockRejectedValueOnce(new Error('network'))
  await w.vm.autoConfirm({ executionId: '50', stepId: '41' }); await w.vm.autoConfirm({ executionId: '50', stepId: '41' }); await flush()
  expect(request).toHaveBeenCalledTimes(1); expect(w.text()).toContain('提交失败，请刷新状态重试')
})
it('groups work actions in the footer and completes only after all steps are confirmed', async() => {
  const w = page(ExecutionPanel, { executionId: '50' }); await flush()
  expect(w.find('.execution-heading').text()).toContain('执行版本 V1')
  expect(w.find('.execution-heading').text()).not.toContain('刷新状态')
  expect(w.find('.operation-controls').text()).toContain('刷新状态')
  expect(w.find('.operation-controls').text()).toContain('异常暂停')
  expect(w.find('.operation-controls').findAll('button').wrappers.some(b => b.text() === '中止任务')).toBe(true)
  const done = fixture(); done.steps.forEach(s => { s.confirmed_at = '2026-10-22T10:00:00' }); w.vm.accept(done); await flush()
  expect(w.find('.operation-controls').text()).toContain('完成作业')
  expect(w.find('.operation-controls').text()).not.toContain('确认本步骤')
  await w.findAll('button').wrappers.find(b => b.text() === '完成作业').trigger('click'); await flush()
  expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/execution/50/complete' }))
})
it('renders historical content without operation buttons', async() => {
  const w = page(ExecutionPanel, { executionId: '50', readonly: true }); await flush()
  expect(w.text()).toContain('检查外观'); expect(w.text()).not.toContain('确认本步骤'); expect(w.text()).not.toContain('中止任务')
  request.mockClear(); await w.vm.submit('confirm'); expect(request).not.toHaveBeenCalled()
})
it('allows root to abort another operator execution without confirming their steps', async() => {
  const record = fixture(); record.can_operate = false; request.mockResolvedValue({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush()
  expect(w.text()).toContain('中止任务'); expect(w.text()).not.toContain('确认本步骤'); expect(w.text()).not.toContain('完成作业')
  await w.findAll('button').wrappers.find(b => b.text() === '中止任务').trigger('click'); await flush()
  expect(w.vm.pendingAction).toBe('abort'); expect(w.vm.reasonOpen).toBe(true)
})
it('queries records using product, names, date range and status', async() => {
  request.mockResolvedValue({ data: { items: [], total: 0 }})
  const w = page(ExecutionRecords); await flush(); w.vm.product = 'P001'; w.vm.station = '工位甲'; w.vm.project = '产品甲'; w.vm.operator = '张三'; w.vm.status = 2; w.vm.dates = ['2026-10-01', '2026-10-17']; w.vm.page = 3
  await w.vm.load(true)
  expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/execution', params: expect.objectContaining({ page: 1, product_code: 'P001', station_name: '工位甲', project_name: '产品甲', operator_name: '张三', status: 2, from: '2026-10-01', to: '2026-10-17' }) }))
})
it('loads images through execution authorization instead of current task version', async() => {
  const create = URL.createObjectURL; const revoke = URL.revokeObjectURL
  URL.createObjectURL = jest.fn().mockReturnValue('blob:execution'); URL.revokeObjectURL = jest.fn()
  request.mockResolvedValue(new Blob(['image']))
  const w = page(ProtectedImage, { executionId: '50', fileId: '12', taskId: '9' }); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50/image/12', responseType: 'blob' })); expect(w.vm.url).toBe('blob:execution')
  w.destroy()
  const onsite = page(ProtectedImage, { executionId: '50', evidencePosition: 1 }); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50/step/1/evidence', responseType: 'blob' }))
  onsite.destroy(); restoreUrls(create, revoke)
})
it('loads saved onsite photos in records through the evidence context', async() => {
  const record = fixture(); record.status = 2; record.steps[0].evidence = { image_width: 100, image_height: 100, captured_at: '2026-10-23T10:00:00', automatic: true, detections: [] }
  request.mockResolvedValue({ data: record })
  const w = page(ExecutionPanel, { executionId: '50', readonly: true }); await flush()
  expect(w.find('.operation-live').exists()).toBe(false)
  expect(w.text()).toContain('现场留存照片')
  const photo = w.find('.execution-evidence annotatedimage-stub')
  expect(photo.exists()).toBe(true); expect(photo.attributes('execution-id')).toBe('50'); expect(photo.attributes('evidence-position')).toBe('1')
})
