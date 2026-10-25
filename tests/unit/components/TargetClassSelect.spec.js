import { shallowMount } from '@vue/test-utils'
import Select from '@/views/sop/editor/components/TargetClassSelect.vue'
import { createDetectionClient } from '@/utils/detection-service'
import { cropReference } from '@/utils/crop-reference'
jest.mock('@/utils/detection-service', () => ({ createDetectionClient: jest.fn() }))
jest.mock('@/utils/crop-reference', () => ({ cropReference: jest.fn() }))
const flush = async() => { for (let i = 0; i < 15; i++) await Promise.resolve() }
let wrapper, models
const originalFetch = global.fetch
beforeEach(() => {
  cropReference.mockImplementation(async(blob, region) => ({ blob: new Blob(['cropped'], { type: 'image/jpeg' }), region }))
  models = jest.fn().mockResolvedValue({ models: [
    { id: 'yolov8n', status: 'ready', classes: [{ id: 67, name: 'cell phone' }, { id: 41, name: 'cup' }] },
    { id: 'other', status: 'ready', classes: [{ id: 2, name: 'cup' }] },
    { id: 'missing', status: 'unavailable', classes: [{ id: 0, name: 'unavailable-class' }] }
  ] })
  createDetectionClient.mockReturnValue({ models })
  wrapper = shallowMount(Select, { propsData: { value: '旧类别' }, stubs: ['el-select', 'el-option', 'el-button', 'el-dialog'] })
})
afterEach(() => { wrapper.destroy(); global.fetch = originalFetch })
it('offers only real classes from ready models, merging equal names without replacing old values', async() => {
  await flush()
  expect(wrapper.vm.options).toEqual([{ name: 'cell phone', models: ['yolov8n'] }, { name: 'cup', models: ['yolov8n', 'other'] }])
  expect(wrapper.emitted('input')).toBeUndefined()
  expect(wrapper.html()).toContain('历史配置')
  wrapper.find('el-select-stub').vm.$emit('change', 'cell phone')
  expect(wrapper.emitted('input')[0]).toEqual(['cell phone'])
})
it('shows connection failure and allows retry without discarding the selected class', async() => {
  await flush(); models.mockRejectedValueOnce(new Error('检测服务未启动'))
  await wrapper.vm.load()
  expect(wrapper.vm.error).toBe('检测服务未启动')
  expect(wrapper.vm.options).toEqual([])
  expect(wrapper.props('value')).toBe('旧类别')
  await wrapper.vm.load()
  expect(wrapper.vm.error).toBe('')
  expect(wrapper.vm.options).toHaveLength(2)
})

it('recommends only objects inside the drawn region and waits for explicit selection', async() => {
  await flush()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async() => new Blob(['jpeg'], { type: 'image/jpeg' }) })
  const predict = jest.fn((blob, metadata) => Promise.resolve({ context: metadata, image_width: 1000, image_height: 1000, detections: [
    { class_name: 'cell phone', confidence: 0.92, bbox_xyxy: [120, 120, 250, 250] },
    { class_name: 'cup', confidence: 0.99, bbox_xyxy: [700, 700, 900, 900] }
  ] }))
  createDetectionClient.mockReturnValue({ models, predict })
  await wrapper.setProps({ referenceSrc: 'blob:reference', region: { x: 0.1, y: 0.1, width: 0.3, height: 0.3 } })
  await wrapper.vm.recommend(); await flush()
  expect(wrapper.vm.suggestions).toEqual([{ name: 'cell phone', confidence: 0.92 }])
  expect(cropReference).toHaveBeenCalled()
  expect(predict.mock.calls[0][0].size).toBe(7)
  expect(wrapper.vm.recommendOpen).toBe(true)
  expect(wrapper.emitted('input')).toBeUndefined()
  const candidate = wrapper.findAll('el-button-stub').wrappers.find(button => button.text().includes('cell phone'))
  candidate.vm.$emit('click')
  expect(wrapper.emitted('input')[0]).toEqual(['cell phone'])
  expect(wrapper.vm.recommendOpen).toBe(false)
})

it('discards recommendations returned after switching the annotation region', async() => {
  await flush()
  let finish
  global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async() => new Blob(['jpeg']) })
  const predict = jest.fn(() => new Promise(resolve => { finish = resolve }))
  createDetectionClient.mockReturnValue({ models, predict })
  await wrapper.setProps({ referenceSrc: 'blob:reference', region: { x: 0, y: 0, width: 1, height: 1 } })
  const pending = wrapper.vm.recommend(); await flush()
  await wrapper.setProps({ region: { x: 0.5, y: 0.5, width: 0.2, height: 0.2 } })
  const metadata = predict.mock.calls[0][1]
  finish({ context: metadata, image_width: 1000, image_height: 1000, detections: [{ class_name: 'cup', confidence: 0.9, bbox_xyxy: [0, 0, 200, 200] }] })
  await pending
  expect(wrapper.vm.suggestions).toEqual([])
  expect(wrapper.emitted('input')).toBeUndefined()
})

it('still opens the candidate dialog with a clear explanation when no objects match', async() => {
  await flush()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async() => new Blob(['jpeg']) })
  createDetectionClient.mockReturnValue({ models, predict: async(blob, metadata) => ({ context: metadata, image_width: 1000, image_height: 1000, detections: [] }) })
  await wrapper.setProps({ referenceSrc: 'blob:reference', region: { x: 0, y: 0, width: 1, height: 1 } })
  await wrapper.vm.recommend()
  expect(wrapper.vm.recommendOpen).toBe(true)
  expect(wrapper.vm.recommendMessage).toContain('未识别到可用目标')
})
