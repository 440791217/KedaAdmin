import { compactRegionLabel, layoutRegionLabels } from '@/utils/region-label-layout'

const region = { id: 'a', x: 0.2, y: 0.3, width: 0.2, height: 0.2, detect_type: 'object', class_name: 'cup', confidence: 75 }

it('uses one short line with target number and exact count when configured', () => {
  expect(compactRegionLabel(region)).toBe('01 杯子 · ≥1个 · ≥75%')
  expect(compactRegionLabel({ ...region, detect_type: 'count', expected_count: 2 }, 2)).toBe('03 杯子 · =2个 · ≥75%')
})

it('stages nearby target labels without overlap and keeps them within the image', () => {
  const labels = layoutRegionLabels([region, { ...region, id: 'b', x: 0.21 }, { ...region, id: 'c', x: 0.22 }], 800, 450, 12)
  labels.forEach((label, index) => {
    expect(label.text.startsWith(String(index + 1).padStart(2, '0'))).toBe(true)
    expect(label.height).toBeLessThan(25)
    expect(label.x).toBeGreaterThanOrEqual(0)
    expect(label.y).toBeGreaterThanOrEqual(0)
    expect(label.x + label.width).toBeLessThanOrEqual(800)
    expect(label.y + label.height).toBeLessThanOrEqual(450)
    labels.slice(0, index).forEach(other => {
      const horizontal = Math.min(label.x + label.width, other.x + other.width) - Math.max(label.x, other.x)
      const vertical = Math.min(label.y + label.height, other.y + other.height) - Math.max(label.y, other.y)
      expect(horizontal <= 0 || vertical <= 0).toBe(true)
    })
  })
})
