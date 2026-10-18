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
afterEach(() => { wrappers.forEach(w => w.destroy()); document.body.innerHTML = '' })
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
