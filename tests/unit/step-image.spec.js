import { stepImage } from '@/utils/step-image'

it('uses the single current image and never falls back to hidden legacy images after removal', () => {
  const old = { id: 'old' }
  const current = { id: 'current' }
  expect(stepImage({ image: current, attachments: [old] })).toBe(current)
  expect(stepImage({ image: null, attachments: [old] })).toBeNull()
  expect(stepImage({ detection: { attachment_id: null }, attachments: [old] })).toBeNull()
})

it('can read an older snapshot without changing its contents', () => {
  const old = { id: 'old' }
  const selected = { id: 'selected' }
  expect(stepImage({ attachments: [old, selected], detection: { attachment_id: 'selected' }})).toBe(selected)
  expect(stepImage({ attachments: [old] })).toBe(old)
})
