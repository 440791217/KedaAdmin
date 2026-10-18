import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import ExecutionPanel from '@/shared/execution/components/ExecutionPanel.vue'
import ExecutionRecords from '@/views/onsite/records/index.vue'
import ProtectedImage from '@/shared/sop/components/ProtectedImage.vue'
import request from '@/utils/request'
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
  const complete = w.findAll('button').wrappers.find(b => b.text() === '完成作业'); expect(complete.attributes('disabled')).toBe('disabled')
})
it('requires a pause reason and keeps paused executions from confirming', async() => {
  const w = page(ExecutionPanel, { executionId: '50' }); await flush(); request.mockClear()
  await w.vm.action('pause'); expect(w.vm.reasonOpen).toBe(true); await w.vm.submitReason(); expect(request).not.toHaveBeenCalled()
  const paused = fixture(); paused.status = 1; paused.version = 1; request.mockResolvedValueOnce({ data: paused }); w.vm.reason = '来料异常'; await w.vm.submitReason(); await flush()
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: '/execution/50/pause', data: { version: 0, reason: '来料异常' }})); expect(w.vm.canConfirm).toBe(false)
})
it('renders historical content without operation buttons', async() => {
  const w = page(ExecutionPanel, { executionId: '50', readonly: true }); await flush()
  expect(w.text()).toContain('检查外观'); expect(w.text()).not.toContain('确认本步骤'); expect(w.text()).not.toContain('中止作业')
  request.mockClear(); await w.vm.submit('confirm'); expect(request).not.toHaveBeenCalled()
})
it('allows root to abort another operator execution without confirming their steps', async() => {
  const record = fixture(); record.can_operate = false; request.mockResolvedValue({ data: record })
  const w = page(ExecutionPanel, { executionId: '50' }); await flush()
  expect(w.text()).toContain('中止作业'); expect(w.text()).not.toContain('确认本步骤'); expect(w.text()).not.toContain('完成作业')
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
  w.destroy(); restoreUrls(create, revoke)
})
