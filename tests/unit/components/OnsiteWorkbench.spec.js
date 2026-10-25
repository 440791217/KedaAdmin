import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import Workbench from '@/views/onsite/workbench/index.vue'
import request from '@/utils/request'
import * as executionVoice from '@/shared/execution/voice-events'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI)
const flush = async() => { for (let i = 0; i < 30; i++) await Promise.resolve(); await Vue.nextTick() }
const task = { id: '9', project_id: '1', subproject_id: '2', name: '检查产品', project_name: '产品甲', subproject_name: '分部甲', status: 1, revision_id: '7', revision_no: 1, onsite_available: true }
let w
const message = { success: jest.fn(), warning: jest.fn() }
beforeEach(() => {
  request.mockReset(); request.mockImplementation(c => {
    if (c.url === '/execution') return Promise.resolve({ data: { items: [], total: 0, can_start: true }})
    if (c.url === '/resource/station') return Promise.resolve({ data: { items: [{ id: '3', name: '工位甲', code: 'STN-A' }] }})
    if (c.url === '/resource/station/3') return Promise.resolve({ data: { id: '3', name: '工位甲', ip_address: '192.0.2.3' }})
    if (c.url.endsWith('/task')) return Promise.resolve({ data: { items: [task, { ...task, id: '10', revision_id: null, onsite_available: false }] }})
    return Promise.resolve({ data: { id: '7', revision_no: 1, steps: [{ id: '1', title: '第一步', instruction: '检查外观', attachments: [] }, { id: '2', title: '第二步', instruction: '检查标签', attachments: [] }] }})
  })
  w = mount(Workbench, { localVue, mocks: { $message: message, $store: { getters: { user_id: '2' }}}, stubs: { LiveDetection: true, ExecutionPanel: true, AnnotatedImage: true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }})
})
afterEach(() => {
  w.destroy()
  jest.restoreAllMocks()
})
it('selects station and shows readiness without exposing content editing', async() => {
  await flush(); w.vm.stationId = '3'; await w.vm.selectStation(); await flush()
  expect(w.text()).toContain('192.0.2.3'); expect(w.text()).toContain('内容尚未发布')
  expect(w.text()).toContain('进入作业'); expect(w.text()).toContain('暂无指导'); expect(w.text()).not.toContain('查看指导')
  expect(w.text()).not.toContain('编辑'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ limit: 100 }) }))
})
it('opens published steps through task permission and navigates between steps', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await flush()
  expect(w.text()).toContain('检查外观'); expect(w.vm.stepIndex).toBe(0)
  expect(w.find('.guide-heading').text()).not.toContain('专注模式')
  expect(w.find('.operation-controls').text()).toContain('返回工位')
  expect(w.find('.operation-controls').text()).toContain('专注模式')
  expect(w.find('.operation-controls').text()).toContain('刷新状态')
  const next = w.findAll('button').wrappers.find(b => b.text() === '下一步'); await next.trigger('click'); await flush()
  expect(w.text()).toContain('检查标签'); expect(w.text()).toContain('已到最后一步')
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/2/task/9/preview' }))
  expect(request.mock.calls.some(([c]) => c.url.startsWith('/sop/'))).toBe(false)
})

it('shows the live camera in the guide before starting and lets the user switch to references', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await flush()
  expect(w.vm.executionId).toBe('')
  expect(w.find('livedetection-stub').exists()).toBe(true)
  expect(w.find('livedetection-stub').attributes('stationid')).toBe('3')
  const camera = w.find('livedetection-stub').element
  const reference = w.findAll('button').wrappers.find(button => button.text() === '查看参考图')
  await reference.trigger('click'); await flush()
  expect(w.find('livedetection-stub').element).toBe(camera)
  expect(w.find('livedetection-stub').props('previewActive')).toBe(false)
  expect(w.find('.operation-live').isVisible()).toBe(false)
  const live = w.findAll('button').wrappers.find(button => button.text() === '返回实时画面')
  await live.trigger('click'); await flush()
  expect(w.find('livedetection-stub').exists()).toBe(true)
  expect(w.find('livedetection-stub').element).toBe(camera)
  expect(w.find('.operation-live').isVisible()).toBe(true)
})
it('refuses unpublished tasks and rechecks tasks moved away from station', async() => {
  await flush(); w.vm.stationId = '3'; await w.vm.openTask({ ...task, revision_id: null, onsite_available: false }); expect(w.vm.task).toBe(null)
  request.mockResolvedValueOnce({ data: { items: [] }}); await w.vm.openTask(task)
  expect(w.vm.task).toBe(null); expect(w.vm.failed).toContain('已移出当前工位')
})

it('allows preview but blocks start for published tasks whose project has not started', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await flush()
  const blocked = { ...task, project_status: 0, onsite_available: false, onsite_unavailable_reasons: ['项目尚未开始，请先开始项目'] }
  await w.setData({ items: [blocked] }); await flush()
  expect(w.text()).toContain('项目尚未开始，请先开始项目')
  const open = w.findAll('button').wrappers.find(button => button.text() === '预览指导')
  expect(open.attributes('disabled')).toBeUndefined()
  request.mockResolvedValueOnce({ data: { items: [blocked] }})
  await w.vm.openTask(blocked)
  expect(w.vm.task).toBeTruthy()
  expect(w.text()).toContain('仅预览')
  request.mockClear(); await w.setData({ productCode: 'P-blocked' }); await w.vm.start()
  expect(request).not.toHaveBeenCalled()
})
it('ignores a late preview response after returning to task list', async() => {
  w.vm.stationId = '3'; await flush()
  let resolve; request.mockImplementation(c => c.url.endsWith('/task') ? Promise.resolve({ data: { items: [task] }}) : new Promise(r => { resolve = r }))
  const pending = w.vm.openTask(task); await flush(); w.vm.back(); resolve({ data: { steps: [] }}); await pending
  expect(w.vm.revision).toBe(null); expect(w.vm.task).toBe(null)
})

it('distinguishes an outdated backend response from incomplete task configuration', async() => {
  await flush()
  expect(w.vm.unavailable({ ...task, onsite_available: undefined })).toContain('后端接口版本不匹配')
  expect(w.vm.unavailable({ ...task, onsite_available: false, onsite_unavailable_reasons: ['工位不可用'] })).toBe('工位不可用')
  expect(w.vm.unavailable({ ...task, revision_id: null, onsite_available: false })).toContain('内容尚未发布')
})

it('preserves the same start request key on a failed response and opens the recovered execution', async() => {
  const announce = jest.spyOn(executionVoice, 'announceExecution').mockImplementation(() => {})
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await w.setData({ productCode: 'P-001' })
  request.mockRejectedValueOnce(new Error('timeout')); await w.vm.start()
  expect(announce).not.toHaveBeenCalled()
  const key = w.vm.startKey; expect(key).toBeTruthy(); expect(w.vm.productCode).toBe('P-001')
  request.mockResolvedValueOnce({ data: { id: '50', status: 0, product_code: 'P-001' }})
  await w.vm.start(); expect(w.vm.executionId).toBe('50')
  expect(announce).toHaveBeenCalledWith('execution.started', {
    scopeId: 'execution:50',
    operationId: key
  })
  const calls = request.mock.calls.filter(([c]) => c.method === 'post')
  expect(calls).toHaveLength(2); expect(calls[0][0].data.request_key).toBe(calls[1][0].data.request_key)
})
it('finds an unfinished execution after selecting the workstation and blocks another start', async() => {
  await flush(); request.mockImplementation(c => {
    if (c.url === '/execution') return Promise.resolve({ data: { items: [{ id: '50', product_code: 'P-001', operator_name: '张三', status: 1 }], can_start: true }})
    if (c.url.endsWith('/task')) return Promise.resolve({ data: { items: [task] }})
    return Promise.resolve({ data: { id: '3', name: '工位甲' }})
  })
  w.vm.stationId = '3'; await w.vm.selectStation(); await flush()
  expect(w.text()).toContain('P-001'); expect(w.text()).toContain('查看作业')
  request.mockClear(); await w.setData({ task, revision: { id: '7', steps: [] }, productCode: 'P-002' }); await w.vm.start(); expect(request).not.toHaveBeenCalled()
})
it('returns to the same task with the current publication and an empty barcode after completion', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task)
  const pool = w.vm.cameraPool; const close = jest.spyOn(pool, 'close')
  await w.setData({ executionId: '50', activeExecution: { id: '50' }, productCode: 'P-001', startKey: 'old-key', stepIndex: 1 })
  const fresh = { ...task, revision_id: '8', revision_no: 2 }
  request.mockImplementation(c => {
    if (c.url === '/execution') return Promise.resolve({ data: { items: [], can_start: true }})
    if (c.url === '/resource/station/3') return Promise.resolve({ data: { id: '3', name: '工位甲' }})
    if (c.url.endsWith('/task')) return Promise.resolve({ data: { items: [fresh] }})
    return Promise.resolve({ data: { id: '8', revision_no: 2, steps: [{ id: '1', title: '新步骤', attachments: [] }] }})
  })
  await w.vm.executionChanged({ id: '50', task_id: '9', status: 2 }); await flush()
  expect(w.vm.cameraPool).toBe(pool); expect(close).not.toHaveBeenCalled()
  expect(w.vm.executionId).toBe(''); expect(w.vm.activeExecution).toBeNull()
  expect(w.vm.productCode).toBe(''); expect(w.vm.startKey).toBe(''); expect(w.vm.stepIndex).toBe(0)
  expect(w.vm.task.id).toBe('9'); expect(w.vm.revision.id).toBe('8'); expect(w.text()).toContain('等待扫码')
  expect(request.mock.calls.some(([c]) => c.method === 'post')).toBe(false)
  await w.setData({ productCode: 'P-002' }); request.mockResolvedValueOnce({ data: { id: '51', status: 0 }})
  await w.vm.start()
  const nextStart = request.mock.calls.find(([c]) => c.method === 'post')[0]
  expect(nextStart.data).toEqual(expect.objectContaining({ product_code: 'P-002', revision_id: '8' }))
  expect(nextStart.data.request_key).not.toBe('old-key'); expect(w.vm.executionId).toBe('51')
})
it('recovers the same task after completing a resumed execution without a preview task', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.setData({ executionId: '50', task: null, revision: null })
  await w.vm.executionChanged({ id: '50', task_id: '9', status: 2 }); await flush()
  expect(w.vm.executionId).toBe(''); expect(w.vm.task.id).toBe('9'); expect(w.vm.productCode).toBe('')
})
it('ignores stale completion events and does not leave a paused execution', async() => {
  await w.setData({ executionId: '51' }); request.mockClear()
  await w.vm.executionChanged({ id: '50', task_id: '9', status: 2 })
  expect(w.vm.executionId).toBe('51'); expect(request).not.toHaveBeenCalled()
  await w.vm.executionChanged({ id: '51', task_id: '9', status: 1 })
  expect(w.vm.executionId).toBe('51'); expect(w.vm.activeExecution.status).toBe(1)
})

it('loads station and tasks with Vue Router 3.0 replace returning void', async() => {
  const replace = jest.fn()
  const routed = mount(Workbench, { localVue, mocks: { $route: { path: '/onsite/workbench', query: { station: '3' }}, $router: { replace }, $message: message }, stubs: { ExecutionPanel: true, AnnotatedImage: true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }})
  try {
    await flush()
    expect(replace).toHaveBeenCalledWith(expect.objectContaining({ query: { station: '3' }}), expect.any(Function), expect.any(Function))
    expect(routed.vm.station.name).toBe('工位甲'); expect(routed.vm.items).toHaveLength(2); expect(routed.text()).toContain('检查产品'); expect(routed.vm.failed).toBe('')
    await routed.setData({ stationId: '' }); await routed.vm.selectStation(); expect(routed.vm.items).toEqual([]); expect(routed.vm.station).toBe(null)
  } finally { routed.destroy() }
})

it('offers focus mode for guidance and exits with Escape without changing task progress', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await flush()
  const focus = w.findAll('button').wrappers.find(button => button.text() === '专注模式'); expect(focus).toBeTruthy(); await focus.trigger('click')
  expect(w.classes()).toContain('workbench-focused'); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await flush()
  expect(w.classes()).not.toContain('workbench-focused'); expect(w.vm.task.id).toBe(task.id)
})

it('shows why a published subproject cannot start and leaves its barcode disabled', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation()
  const blocked = { ...task, subproject_status: 0, onsite_available: false }
  expect(w.vm.unavailable(blocked)).toContain('子项目尚未开始')
  request.mockResolvedValueOnce({ data: { items: [blocked] }})
  await w.vm.openTask(blocked); await flush()
  expect(w.text()).toContain('子项目尚未开始')
  expect(w.find('input[maxlength="128"]').attributes('disabled')).toBe('disabled')
  const start = w.findAll('button').wrappers.find(b => b.text() === '扫码开工')
  expect(start.attributes('disabled')).toBe('disabled')
  request.mockClear(); await w.setData({ productCode: 'P-blocked' }); await w.vm.start()
  expect(request).not.toHaveBeenCalled()
})
it('distinguishes ready, read-only, occupied, cancelled and unpublished task entries', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation()
  expect(w.vm.taskEntry(task).label).toBe('进入作业')
  await w.setData({ canStart: false }); expect(w.vm.taskEntry(task).label).toBe('预览指导')
  await w.setData({ canStart: true, activeExecution: { id: '50', task_id: 'other', task_name: '其他检查', status: 0 }})
  expect(w.vm.taskEntry(task).reason).toContain('其他检查')
  expect(w.vm.taskEntry(task).label).toBe('预览指导')
  await w.setData({ activeExecution: null })
  const cancelled = { ...task, status: 2, onsite_available: false }
  expect(w.vm.taskEntry(cancelled).label).toBe('预览指导'); expect(w.vm.canPreview(cancelled)).toBe(true)
  expect(w.vm.taskEntry({ ...task, revision_id: null }).disabled).toBe(true)
  await w.setData({ executionFailed: true }); expect(w.vm.taskEntry(task).label).toBe('预览指导')
  expect(w.vm.taskEntry(task).reason).toContain('加载失败')
})

it('labels only the current operators unfinished execution as continuable and never resumes a pause automatically', async() => {
  await w.setData({ canStart: true, activeExecution: { id: '50', task_id: '9', operator_id: '2', status: 0, product_code: 'P1' }})
  expect(w.vm.taskEntry(task).label).toBe('继续作业')
  await w.setData({ activeExecution: { id: '50', task_id: '9', operator_id: '2', status: 1, product_code: 'P1' }})
  expect(w.vm.taskEntry(task).label).toBe('查看暂停作业')
  expect(w.vm.executionEntryLabel({ ...w.vm.activeExecution, operator_id: '3' })).toBe('查看作业')
  expect(w.vm.executionEntryLabel({ ...w.vm.activeExecution, can_operate: false })).toBe('查看作业')
})

it('rechecks an entry and opens its original execution snapshot without loading the newest publication', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); request.mockClear()
  const running = { id: '50', task_id: '9', operator_id: '2', status: 0, revision_no: 1, product_code: 'P1' }
  const detail = { ...running, can_operate: true, content: { id: 'old', revision_no: 1, steps: [] }}
  request.mockImplementation(c => c.url === '/execution' ? Promise.resolve({ data: { items: [running], can_start: true }}) : Promise.resolve({ data: detail }))
  await w.vm.enterTask({ ...task, revision_no: 2, revision_id: 'new' }); await flush()
  expect(w.vm.executionId).toBe('50'); expect(w.vm.activeExecution.content.id).toBe('old')
  expect(w.find('executionpanel-stub').props('initialExecution')).toEqual(detail)
  expect(request.mock.calls.some(([c]) => c.url.endsWith('/preview'))).toBe(false)
  expect(request.mock.calls.some(([c]) => c.method === 'put' || c.method === 'post')).toBe(false)
})

it('does not open an execution that ended after the task card was rendered', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation()
  await w.setData({ activeExecution: { id: '50', task_id: '9', status: 0 }})
  request.mockResolvedValueOnce({ data: { id: '50', task_id: '9', status: 2 }})
  await w.vm.openActive(); expect(w.vm.executionId).toBe(''); expect(w.vm.activeExecution).toBeNull()
  expect(w.vm.failed).toContain('已结束')
})

it('ignores a late execution response after leaving the task list', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation()
  await w.setData({ activeExecution: { id: '50', task_id: '9', status: 0 }})
  let finish; request.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const pending = w.vm.openActive(); await flush(); w.vm.back(); finish({ data: { id: '50', task_id: '9', status: 0 }}); await pending
  expect(w.vm.executionId).toBe(''); expect(w.vm.task).toBeNull()
})
