import { classNameZh } from '@/utils/detection-classes'
// Region coordinates are normalized to the fixed camera view, independent of resolution.
export function evaluateRegions(visual, result) {
  const regions = ((visual && visual.detection_regions) || []).filter(region => region.enabled !== false)
  return regions.map(region => {
    const supported = ['object', 'count'].includes(region.detect_type)
    const matches = supported && result ? result.detections.filter(item => {
      if (String(item.class_name).trim().toLowerCase() !== String(region.class_name).trim().toLowerCase()) return false
      if (!Number.isFinite(item.confidence) || !Number.isFinite(Number(region.confidence)) || item.confidence < Number(region.confidence) / 100) return false
      const box = item.bbox_xyxy
      if (!Array.isArray(box) || box.length !== 4 || !box.every(Number.isFinite) || box[2] <= box[0] || box[3] <= box[1]) return false
      const x = (box[0] + box[2]) / 2 / result.image_width
      const y = (box[1] + box[3]) / 2 / result.image_height
      return x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height
    }) : []
    const matched = !!result && supported && (region.detect_type === 'count' ? matches.length === region.expected_count : matches.length > 0)
    const target = classNameZh(region.class_name) || region.name || '目标'
    let message = region.detect_type === 'count' ? `等待 ${target} × ${region.expected_count}` : `请将 ${target} 放入此区域`
    if (!supported) message = '当前模型不支持此检测类型'
    else if (matched) message = '当前画面条件满足'
    else if (result && region.detect_type === 'count') message = `${target} 数量 ${matches.length} / ${region.expected_count}`
    return { region, matches, matched, message }
  })
}

export function relevantDetections(states, result) {
  if (!result) return []
  return result.detections.filter(item => states.some(state => state.matches.includes(item)))
}

export function detectionBoxes(visual, result) {
  const states = evaluateRegions(visual, result)
  return relevantDetections(states, result).map(item => ({ ...item, color: states.find(state => state.matches.includes(item)).region.color || '#409EFF' }))
}

// Both live video and saved photographs use the same filtering, colors and label style.
export function drawDetectionBoxes(canvas, result, visual) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!result || !(result.image_width > 0) || !(result.image_height > 0)) return
  const scale = Math.min(canvas.width / result.image_width, canvas.height / result.image_height)
  const dx = (canvas.width - result.image_width * scale) / 2
  const dy = (canvas.height - result.image_height * scale) / 2
  ctx.lineWidth = 1.5; ctx.font = '12px sans-serif'; ctx.textBaseline = 'middle'
  detectionBoxes(visual, result).forEach(item => {
    const [x1, y1, x2, y2] = item.bbox_xyxy
    const x = dx + x1 * scale; const y = dy + y1 * scale
    ctx.strokeStyle = item.color
    ctx.strokeRect(x, y, (x2 - x1) * scale, (y2 - y1) * scale)
    const text = classNameZh(item.class_name) + ' ' + Math.round(item.confidence * 100) + '%'
    const width = ctx.measureText(text).width + 12
    const labelX = Math.max(0, Math.min(x, canvas.width - width))
    const labelY = y >= 24 ? y - 24 : y + 3
    ctx.fillStyle = '#fffffff0'; ctx.fillRect(labelX, labelY, width, 20)
    ctx.fillStyle = item.color; ctx.fillRect(labelX, labelY, 2, 20)
    ctx.fillStyle = '#303d4d'; ctx.fillText(text, labelX + 7, labelY + 10)
  })
}
