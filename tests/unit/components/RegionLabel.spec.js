import { mount } from '@vue/test-utils'
import RegionLabel from '@/shared/sop/components/RegionLabel.vue'
import Canvas from '@/shared/sop/components/VisualCanvas.vue'

const region = { id: 'r', kind: 'rect', name: '检测杯子', detect_type: 'object', class_name: 'cup', confidence: 75, enabled: true, x: 0.9, y: 0, width: 0.1, height: 0.2, color: '#409EFF' }

it('shows Chinese targets, minimum quantity and confidence on the editor canvas', () => {
  const w = mount(Canvas, { propsData: { src: 'blob:photo', width: 2560, height: 1440, items: [region] }})
  expect(w.find('.region-label text').text()).toBe('01 杯子 · ≥1个 · ≥75%')
  expect(w.find('.region-label').text()).toContain('置信度 ≥ 75%')
  const label = w.find(RegionLabel)
  expect(label.vm.x + label.vm.labelWidth).toBeLessThanOrEqual(2560)
  expect(label.vm.y).toBeGreaterThanOrEqual(0)
  w.destroy()
})

it('shows an exact count and retains requirements alongside live status', () => {
  const w = mount(RegionLabel, { propsData: { region: { ...region, detect_type: 'count', expected_count: 2 }, width: 1280, height: 720, fontSize: 16, message: '当前画面条件满足' }})
  expect(w.find('text').text()).toContain('=2个')
  expect(w.text()).toContain('置信度 ≥ 75%')
  expect(w.text()).toContain('当前画面条件满足')
  w.destroy()
})
