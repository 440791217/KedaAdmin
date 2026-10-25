export function cropBounds(region, width, height) {
  if (![region.x, region.y, region.width, region.height].every(Number.isFinite) || region.width <= 0 || region.height <= 0 || width <= 0 || height <= 0) throw new Error('检测区域无效，请重新画框')
  const left = Math.max(0, Math.min(width, region.x * width))
  const top = Math.max(0, Math.min(height, region.y * height))
  const right = Math.max(0, Math.min(width, (region.x + region.width) * width))
  const bottom = Math.max(0, Math.min(height, (region.y + region.height) * height))
  if (right <= left || bottom <= top) throw new Error('检测区域不在图片内，请重新画框')
  // Preserve 5% context around the selected region, bounded by the source image.
  const x = Math.max(0, Math.floor(left - (right - left) * 0.05 + 1e-8))
  const y = Math.max(0, Math.floor(top - (bottom - top) * 0.05 + 1e-8))
  const cropWidth = Math.min(width, Math.ceil(right + (right - left) * 0.05 - 1e-8)) - x
  const cropHeight = Math.min(height, Math.ceil(bottom + (bottom - top) * 0.05 - 1e-8)) - y
  return { x, y, width: cropWidth, height: cropHeight, region: { x: (left - x) / cropWidth, y: (top - y) / cropHeight, width: (right - left) / cropWidth, height: (bottom - top) / cropHeight }}
}

export async function cropReference(blob, region, signal) {
  const check = () => { if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError') }
  let image, objectURL
  try {
    check()
    if (typeof createImageBitmap === 'function') image = await createImageBitmap(blob)
    else {
      objectURL = URL.createObjectURL(blob)
      image = await new Promise((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('参考图片解码失败，请重新加载图片'))
        element.src = objectURL
      })
    }
    check()
    const bounds = cropBounds(region, image.naturalWidth || image.width, image.naturalHeight || image.height)
    const scale = Math.min(1, 1280 / Math.max(bounds.width, bounds.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bounds.width * scale)); canvas.height = Math.max(1, Math.round(bounds.height * scale))
    canvas.getContext('2d').drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, canvas.width, canvas.height)
    const cropped = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
    check()
    if (!cropped) throw new Error('区域图片生成失败，请重试')
    return { blob: cropped, region: bounds.region }
  } finally {
    if (image && image.close) image.close()
    if (objectURL) URL.revokeObjectURL(objectURL)
  }
}
