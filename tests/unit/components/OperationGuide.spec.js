import Vue from 'vue'
import ElementUI from 'element-ui'
import { mount, createLocalVue } from '@vue/test-utils'
import Guide from '@/shared/execution/components/OperationGuide.vue'
jest.mock('@/utils/request', () => jest.fn())
const localVue = createLocalVue(); localVue.use(ElementUI)
const steps = [
  { id: '1', title: '定位产品', instruction: '将产品放入定位区域', precautions: '避免遮挡标识', check_requirements: '确认方向正确', attachments: [{ id: '11', file_id: '101', caption: '正面区域' }, { id: '12', file_id: '102', caption: '侧面区域' }] },
  { id: '2', title: '核对标签', instruction: '核对产品条码', attachments: [{ id: '13', file_id: '103' }] }
]
let wrappers
function page(propsData) { const w = mount(Guide, { localVue, propsData: { steps, ...propsData }, stubs: { AnnotatedImage: { props: ['fileId', 'executionId', 'taskId'], template: '<div class="test-image" :data-file="fileId" :data-execution="executionId" />' }}}); wrappers.push(w); return w }
beforeEach(() => { wrappers = [] })
afterEach(() => { wrappers.forEach(w => w.destroy()); document.body.innerHTML = ''; jest.restoreAllMocks(); jest.useRealTimers() })
it('separates the step flow, large image stage and text guidance with a truthful image source', () => {
  const w = page({ stationName: '工位甲', imageContext: { taskId: '9' }})
  expect(w.find('.operation-flow').exists()).toBe(true); expect(w.find('.operation-image-stage').exists()).toBe(true)
  expect(w.find('.operation-instructions').text()).toContain('将产品放入定位区域'); expect(w.text()).toContain('避免遮挡标识'); expect(w.text()).toContain('非实时画面')
  expect(w.find('.test-image').attributes('data-file')).toBe('101')
})
it('switches reference images and resets the selection when the step changes', async() => {
  const w = page({ imageContext: { executionId: '50' }})
  await w.findAll('.operation-image-options button').at(1).trigger('click'); expect(w.find('.test-image').attributes('data-file')).toBe('102')
  await w.setProps({ stepIndex: 1 }); await Vue.nextTick()
  expect(w.find('.test-image').attributes('data-file')).toBe('103'); expect(w.find('.test-image').attributes('data-execution')).toBe('50'); expect(w.find('.operation-instructions').text()).toContain('核对产品条码')
})
it('emits navigation separately from confirmation and shows confirmed workflow steps', async() => {
  const w = page({ executing: true, confirmed: [true, false] })
  expect(w.find('.operation-flow button').classes()).toContain('confirmed')
  await w.findAll('.operation-flow button').at(1).trigger('click'); expect(w.emitted('select')[0]).toEqual([1]); expect(w.emitted('confirm')).toBeUndefined()
})
it('provides an empty image state for text-only steps', () => {
  const w = page({ steps: [{ id: '1', title: '检查', instruction: '阅读操作说明', attachments: [] }] })
  expect(w.text()).toContain('当前步骤暂无参考图片'); expect(w.find('.test-image').exists()).toBe(false); expect(w.text()).toContain('阅读操作说明')
})

it('groups the selected step parameters and all enabled region requirements beneath its instructions', () => {
  const w = page({ steps: [{ id: '1', title: '检查手机', instruction: '放入区域', expected_duration_seconds: 30, detection: { enabled: true, attachment_id: 'a' }, image: { id: 'a', file_id: '1', visual: { detection_regions: [{ id: 'r', enabled: true, detect_type: 'count', class_name: 'cup', confidence: 75, expected_count: 2 }, { id: 'off', enabled: false, class_name: 'person' }] }}}] })
  expect(w.find('.instruction-parameters').text()).toContain('30 秒')
  expect(w.find('.instruction-parameters').text()).toContain('自动检测')
  expect(w.findAll('.instruction-target')).toHaveLength(1)
  expect(w.find('.instruction-detection').text()).toContain('数量 = 2')
  expect(w.find('.instruction-detection').text()).toContain('置信度 ≥ 75%')
})

it('shows completion progress and keeps the running countdown on the executing step while browsing', async() => {
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const w = page({ executing: true, executionStatus: 0, confirmed: [true, false], steps: [{ ...steps[0] }, { ...steps[1], expected_duration_seconds: 30 }], evidenceSteps: [{ confirmed_at: '2026-10-24T10:00:12', elapsed_ms: 12000, timing_running: false }, { elapsed_ms: 8000, timing_running: true }] })
  expect(w.find('.flow-progress').text()).toBe('已完成 1/2')
  expect(w.find('.timing-done').text()).toBe('已完成 · 用时 00:12')
  expect(w.find('.timing-running').text()).toBe('剩余 00:22')
  now = 4000; jest.advanceTimersByTime(1000); await Vue.nextTick()
  expect(w.find('.timing-running').text()).toBe('剩余 00:18')
  await w.setProps({ stepIndex: 1 })
  expect(w.find('.timing-running').text()).toBe('剩余 00:18')
})

it('freezes paused timers and shows overtime and unlimited elapsed time distinctly', async() => {
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const w = page({ executing: true, executionStatus: 1, steps: [{ ...steps[0], expected_duration_seconds: 30 }], evidenceSteps: [{ elapsed_ms: 8000, timing_running: false }] })
  now = 60000; jest.advanceTimersByTime(1000); await Vue.nextTick()
  expect(w.find('.timing-paused').text()).toBe('已暂停 · 剩余 00:22')
  await w.setProps({ executionStatus: 0, evidenceSteps: [{ elapsed_ms: 35000, timing_running: true }] })
  expect(w.find('.timing-over').text()).toBe('超时 00:05')
  await w.setProps({ steps: [{ ...steps[0], expected_duration_seconds: 0 }], evidenceSteps: [{ elapsed_ms: 8000, timing_running: true }] })
  expect(w.find('.timing-running').text()).toBe('用时 00:08')
})

it('uses persisted remaining time and never interpolates beyond one heartbeat interval', async() => {
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const w = page({ executing: true, executionStatus: 0, timingAdvanceLimit: 5000, steps: [{ ...steps[0], expected_duration_seconds: 30 }], evidenceSteps: [{ elapsed_ms: 8000, remaining_ms: 17000, timing_running: true }] })
  expect(w.find('.timing-running').text()).toBe('剩余 00:17')
  now = 20000; jest.advanceTimersByTime(1000); await Vue.nextTick()
  expect(w.find('.timing-running').text()).toBe('剩余 00:12')
  await w.setProps({ timingInterrupted: true, timingAdvanceLimit: 0, evidenceSteps: [{ elapsed_ms: 8000, remaining_ms: 17000, timing_running: false }] })
  expect(w.find('.timing-paused').text()).toBe('已中断 · 剩余 00:17')
})

it('counts every second independently of saving and ignores repeated copies of the same timing data', async() => {
  jest.useFakeTimers(); let now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  const row = { position: 1, elapsed_ms: 0, remaining_ms: 30000, timing_running: true }
  const w = page({ executing: true, executionStatus: 0, steps: [{ ...steps[0], expected_duration_seconds: 30 }], evidenceSteps: [{ ...row }] })
  for (let second = 1; second <= 7; second++) {
    now = second * 1000; jest.advanceTimersByTime(1000); await Vue.nextTick()
    await w.setProps({ evidenceSteps: [{ ...row }] })
    expect(w.find('.timing-running').text()).toBe('剩余 00:' + String(30 - second).padStart(2, '0'))
  }
  await w.setProps({ evidenceSteps: [{ ...row, elapsed_ms: 7000, remaining_ms: 23000 }] })
  expect(w.find('.timing-running').text()).toBe('剩余 00:23')
  now = 8000; jest.advanceTimersByTime(1000); await Vue.nextTick()
  expect(w.find('.timing-running').text()).toBe('剩余 00:22')
})
it('places the live detection verdict next to the reference action in the heading', async() => {
  const w = mount(Guide, { localVue, propsData: { steps, detectionStatus: { code: 'ng', text: '已满足 1/2' }}, slots: { live: '<div class="test-live-frame" />' }, stubs: { AnnotatedImage: true }}); wrappers.push(w)
  const heading = w.find('.operation-live .operation-panel-heading')
  expect(heading.find('.detection-verdict.is-ng').text()).toContain('NG')
  expect(heading.text()).toContain('已满足 1/2')
  expect(heading.text()).toContain('查看参考图')
  expect(w.find('.test-live-frame .detection-verdict').exists()).toBe(false)
  await w.setProps({ detectionStatus: { code: 'ok', text: '全部满足' }})
  expect(heading.find('.detection-verdict.is-ok').text()).toContain('OK')
})
it('shows onsite evidence in records and offers references separately even when an empty live slot exists', async() => {
  const w = mount(Guide, { localVue, propsData: { steps, recordsMode: true, liveEnabled: false, imageContext: { executionId: '50' }, evidenceSteps: [{}] }, scopedSlots: { live: () => undefined }, stubs: { AnnotatedImage: true }}); wrappers.push(w)
  expect(w.find('.operation-live').exists()).toBe(false)
  expect(w.text()).toContain('未留存现场照片')
  await w.findAll('button').wrappers.find(b => b.text() === '查看参考图').trigger('click')
  expect(w.find('.operation-image-stage').isVisible()).toBe(true)
  await w.findAll('button').wrappers.find(b => b.text() === '返回现场照片').trigger('click')
  expect(w.text()).toContain('未留存现场照片')
})
