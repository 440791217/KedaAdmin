// Current steps have one image. Arrays are read only for older saved versions.
export function stepImage(step) {
  if (!step) return null
  if (Object.prototype.hasOwnProperty.call(step, 'image')) return step.image || null
  const legacy = step.attachments || []
  return step.detection
    ? legacy.find(image => String(image.id) === String(step.detection.attachment_id)) || null
    : legacy[0] || null
}
