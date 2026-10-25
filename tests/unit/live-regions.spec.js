import { mount } from '@vue/test-utils'
import Overlay from '@/shared/execution/components/LiveGuidanceOverlay.vue'
import { evaluateRegions, relevantDetections, detectionBoxes } from '@/shared/execution/js/live_regions'

const region = { id: 'r1', name: '手机区域', enabled: true, detect_type: 'object', class_name: 'cell phone', confidence: 70, x: 0.1, y: 0.2, width: 0.3, height: 0.4 }
const visual = { guide_items: [{ id: 'g1', kind: 'arrow', x: 0, y: 0, x2: 0.1, y2: 0.2 }], detection_regions: [region] }
const phone = { class_name: 'cell phone', confidence: 0.9, bbox_xyxy: [100, 200, 200, 300] }
const result = detections => ({ image_width: 1000, image_height: 1000, detections })

it('shows guidance and yellow waiting regions without any prediction, then updates with the step', async() => {
  const states = evaluateRegions(visual, null)
  const wrapper = mount(Overlay, { propsData: { visual, states, width: 1000, height: 1000 }})
  expect(wrapper.find('[data-region="r1"]').attributes('stroke')).toBe('#ffc34d')
  expect(wrapper.find('[data-region="r1"] rect').attributes('stroke-dasharray')).not.toBe('')
  expect(wrapper.find('[data-region="r1"] rect').attributes('x')).toBe('100')
  expect(wrapper.text()).toContain('请将 手机 放入此区域')
  expect(wrapper.find('line').exists()).toBe(true)
  await wrapper.setProps({ visual: { guide_items: [], detection_regions: [] }, states: [] })
  expect(wrapper.find('[data-region="r1"]').exists()).toBe(false)
  wrapper.destroy()
})

it('accepts only the selected class above threshold with its center inside the region', () => {
  const objects = [phone, { ...phone, class_name: 'person' }, { ...phone, confidence: 0.6 }, { ...phone, confidence: NaN }, { ...phone, confidence: undefined }, { ...phone, bbox_xyxy: [200, 300, 100, 200] }, { ...phone, bbox_xyxy: [700, 700, 900, 900] }]
  const response = result(objects)
  const states = evaluateRegions(visual, response)
  expect(states[0].matched).toBe(true)
  expect(relevantDetections(states, response)).toEqual([phone])
})

it('counts only region matches and does not declare OCR or state checks successful', () => {
  const settings = { detection_regions: [{ ...region, detect_type: 'count', expected_count: 2 }, { ...region, id: 'ocr', detect_type: 'ocr' }] }
  const states = evaluateRegions(settings, result([phone]))
  expect(states[0].matched).toBe(false)
  expect(states[0].message).toContain('1 / 2')
  expect(states[1].matched).toBe(false)
  expect(states[1].message).toContain('不支持')
  expect(evaluateRegions(settings, result([phone, { ...phone }]))[0].matched).toBe(true)
})

it('uses saved region colors, deduplicates overlapping regions and never shows unrelated results', () => {
  const configured = { detection_regions: [{ ...region, color: '#E6A23C' }, { ...region, id: 'r2', color: '#409EFF' }] }
  const response = result([phone, { ...phone, class_name: 'person' }, { ...phone, confidence: 0.69 }, { ...phone, bbox_xyxy: [700, 700, 900, 900] }])
  expect(detectionBoxes(configured, response)).toEqual([{ ...phone, color: '#E6A23C' }])
  expect(detectionBoxes(null, response)).toEqual([])
  expect(detectionBoxes({ detection_regions: [{ ...region, enabled: false }] }, response)).toEqual([])
})

it('ignores disabled regions and restores waiting state after clearing a prediction', async() => {
  expect(evaluateRegions({ detection_regions: [{ ...region, enabled: false }] }, result([phone]))).toEqual([])
  const wrapper = mount(Overlay, { propsData: { visual, states: evaluateRegions(visual, result([phone])) }})
  expect(wrapper.find('[data-region="r1"]').attributes('data-matched')).toBe('true')
  await wrapper.setProps({ states: evaluateRegions(visual, null) })
  expect(wrapper.find('[data-region="r1"]').attributes('stroke')).toBe('#ffc34d')
  wrapper.destroy()
})
