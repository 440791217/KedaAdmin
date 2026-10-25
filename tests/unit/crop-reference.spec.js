import { cropBounds, cropReference } from '@/utils/crop-reference'

it('crops normalized coordinates with bounded context and rejects invalid regions', () => {
  const bounds = cropBounds({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }, 1000, 500)
  expect(bounds).toEqual(expect.objectContaining({ x: 85, y: 90, width: 330, height: 220 }))
  expect(bounds.region.x).toBeCloseTo(15 / 330)
  expect(cropBounds({ x: 0, y: 0, width: 1, height: 1 }, 1000, 500)).toEqual(expect.objectContaining({ x: 0, y: 0, width: 1000, height: 500 }))
  expect(() => cropBounds({ x: 0, y: 0, width: 0, height: 1 }, 1000, 500)).toThrow()
  expect(() => cropBounds({ x: 2, y: 0, width: 1, height: 1 }, 1000, 500)).toThrow()
})

it('sends only cropped pixels and closes the decoded bitmap', async() => {
  const originalBitmap = global.createImageBitmap
  const originalContext = HTMLCanvasElement.prototype.getContext
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  const image = { width: 1000, height: 500, close: jest.fn() }
  const drawImage = jest.fn()
  global.createImageBitmap = jest.fn().mockResolvedValue(image)
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage }))
  HTMLCanvasElement.prototype.toBlob = jest.fn(callback => callback(new Blob(['cropped'])))
  try {
    const output = await cropReference(new Blob(['original']), { x: 0.1, y: 0.2, width: 0.3, height: 0.4 })
    expect(output.blob.size).toBe(7)
    expect(drawImage).toHaveBeenCalledWith(image, 85, 90, 330, 220, 0, 0, 330, 220)
    expect(image.close).toHaveBeenCalled()
  } finally {
    global.createImageBitmap = originalBitmap
    HTMLCanvasElement.prototype.getContext = originalContext
    HTMLCanvasElement.prototype.toBlob = originalToBlob
  }
})
