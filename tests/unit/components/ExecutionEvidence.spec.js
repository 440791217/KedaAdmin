import { shallowMount } from '@vue/test-utils'
import Evidence from '@/shared/execution/components/ExecutionEvidence.vue'
import { detectionBoxes } from '@/shared/execution/js/live_regions'
jest.mock('@/utils/request', () => jest.fn())

it('filters saved predictions against the execution snapshot and preserves its annotation color', async() => {
  const cup = { class_name: 'cup', confidence: 0.86, bbox_xyxy: [20, 20, 60, 60] }
  const visual = { guide_items: [], detection_regions: [{ id: 'r1', color: '#E6A23C', enabled: true, detect_type: 'object', class_name: 'cup', confidence: 75, x: 0, y: 0, width: 0.7, height: 0.7 }] }
  const photo = { image_width: 100, image_height: 100, detections: [cup, { ...cup, class_name: 'person' }, { ...cup, confidence: 0.7 }, { ...cup, bbox_xyxy: [80, 80, 90, 90] }] }
  const w = shallowMount(Evidence, { propsData: { executionId: '1', position: 1, step: { image: { id: 'i1', visual }}, photo }, stubs: { 'el-checkbox': true }})
  expect(detectionBoxes(w.vm.visual, w.vm.result)).toEqual([{ ...cup, color: '#E6A23C' }])
  expect(w.find({ name: 'DetectionBoxes' }).exists()).toBe(false)
  w.find({ name: 'AnnotatedImage' }).vm.$emit('loaded', { width: 100, height: 100 }); await w.vm.$nextTick()
  expect(w.find({ name: 'DetectionBoxes' }).exists()).toBe(true)
  expect(w.find({ name: 'LiveGuidanceOverlay' }).exists()).toBe(false)
  await w.setData({ showRegions: true })
  expect(w.find({ name: 'LiveGuidanceOverlay' }).exists()).toBe(true)
  await w.setProps({ position: 2 }); await w.vm.$nextTick()
  expect(w.vm.showRegions).toBe(false)
  expect(w.find({ name: 'DetectionBoxes' }).exists()).toBe(false)
  w.destroy()
})
