import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import Workbench from '@/views/onsite/workbench/index.vue'
import request from '@/utils/request'
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
  w = mount(Workbench, { localVue, mocks: { $message: message }, stubs: { ExecutionPanel: true, AnnotatedImage: true, 'el-select': { template: '<div><slot /></div>' }, 'el-option': true }})
})
afterEach(() => w.destroy())
it('selects station and shows readiness without exposing content editing', async() => {
  await flush(); w.vm.stationId = '3'; await w.vm.selectStation(); await flush()
  expect(w.text()).toContain('192.0.2.3'); expect(w.text()).toContain('内容尚未发布')
  expect(w.text()).not.toContain('编辑'); expect(request).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ limit: 100 }) }))
})
it('opens published steps through task permission and navigates between steps', async() => {
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await flush()
  expect(w.text()).toContain('检查外观'); expect(w.vm.stepIndex).toBe(0)
  const next = w.findAll('button').wrappers.find(b => b.text() === '下一步'); await next.trigger('click'); await flush()
  expect(w.text()).toContain('检查标签'); expect(w.text()).toContain('已到最后一步')
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/project/1/subproject/2/task/9/preview' }))
  expect(request.mock.calls.some(([c]) => c.url.startsWith('/sop/'))).toBe(false)
})
it('refuses unpublished tasks and rechecks tasks moved away from station', async() => {
  await flush(); w.vm.stationId = '3'; await w.vm.openTask({ ...task, onsite_available: false }); expect(w.vm.task).toBe(null)
  request.mockResolvedValueOnce({ data: { items: [] }}); await w.vm.openTask(task)
  expect(w.vm.task).toBe(null); expect(w.vm.failed).toContain('已移出当前工位')
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
  w.vm.stationId = '3'; await w.vm.selectStation(); await w.vm.openTask(task); await w.setData({ productCode: 'P-001' })
  request.mockRejectedValueOnce(new Error('timeout')); await w.vm.start()
  const key = w.vm.startKey; expect(key).toBeTruthy(); expect(w.vm.productCode).toBe('P-001')
  request.mockResolvedValueOnce({ data: { id: '50', status: 0, product_code: 'P-001' }})
  await w.vm.start(); expect(w.vm.executionId).toBe('50')
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
  expect(w.text()).toContain('P-001'); expect(w.text()).toContain('查看／继续作业')
  request.mockClear(); await w.setData({ task, revision: { id: '7', steps: [] }, productCode: 'P-002' }); await w.vm.start(); expect(request).not.toHaveBeenCalled()
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
