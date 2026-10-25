import { classNameZh } from './detection-classes'

export function regionRequirements(region) {
  const lines = []
  if (region.detect_type === 'ocr') lines.push(`文字：${region.expected_text || '待填写'}`)
  else {
    lines.push(`目标：${classNameZh(region.class_name) || '待选择'}`)
    if (region.detect_type === 'status') lines.push(`状态：${region.expected_state || '待填写'}`)
    else lines.push(region.detect_type === 'count' ? `数量 = ${region.expected_count == null ? '待填写' : region.expected_count}` : '数量 ≥ 1')
  }
  lines.push(`置信度 ≥ ${region.confidence == null ? '待填写' : region.confidence}%`)
  if (region.enabled === false) lines.push('已暂停检测')
  return lines
}
