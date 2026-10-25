import { classNameZh } from './detection-classes'

const short = value => { const text = String(value || '待选择'); return text.length > 8 ? text.slice(0, 7) + '…' : text }
export function compactRegionLabel(region, index = 0) {
  const target = region.detect_type === 'ocr' ? '文字 ' + short(region.expected_text) : short(classNameZh(region.class_name))
  const quantity = region.detect_type === 'count' ? `=${region.expected_count == null ? '?' : region.expected_count}个` : region.detect_type === 'object' ? '≥1个' : region.detect_type === 'status' ? short(region.expected_state) : ''
  return `${String(index + 1).padStart(2, '0')} ${target}${quantity ? ' · ' + quantity : ''} · ≥${region.confidence == null ? '?' : region.confidence}%${region.enabled === false ? ' · 暂停' : ''}`
}

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))

export function layoutRegionLabels(regions, width, height, fontSize) {
  const placed = []
  const gap = fontSize * 0.35
  regions.forEach((region, index) => {
    const text = compactRegionLabel(region, index)
    const units = [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 1 : 0.58), 0)
    const w = Math.min(width, (units + 1.5) * fontSize)
    const h = Math.min(height, fontSize * 1.9)
    const left = region.x * width; const top = region.y * height
    const clamp = (x, y) => ({ x: Math.max(0, Math.min(width - w, x)), y: Math.max(0, Math.min(height - h, y)), width: w, height: h })
    const preferred = clamp(left, top >= h + gap ? top - h - gap : top + gap)
    const candidates = [preferred, clamp(left, (region.y + region.height) * height + gap), clamp((region.x + region.width) * width + gap, top), clamp(left - w - gap, top)]
    for (let row = 1; row <= regions.length; row++) candidates.push(clamp(preferred.x, preferred.y - row * (h + gap)), clamp(preferred.x, preferred.y + row * (h + gap)))
    const score = candidate => placed.reduce((sum, previous) => sum + overlap(candidate, previous) * 1000, 0) + Math.abs(candidate.y - preferred.y) + Math.abs(candidate.x - preferred.x)
    const best = candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best, preferred)
    placed.push({ ...best, id: region.id, text, displaced: Math.abs(best.x - preferred.x) + Math.abs(best.y - preferred.y) > fontSize })
  })
  return placed
}
