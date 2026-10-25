import { startPreviewFrames } from '@/utils/preview-frames'

it('samples new frames at the configured rate, never duplicates frames, and cancels on close', () => {
  let callback
  const video = { readyState: 4, videoWidth: 1920, videoHeight: 1080, clientWidth: 640, clientHeight: 360, requestVideoFrameCallback: jest.fn(cb => { callback = cb; return 1 }), cancelVideoFrameCallback: jest.fn() }
  const ctx = { clearRect: jest.fn(), drawImage: jest.fn() }
  const canvas = { getContext: () => ctx }
  const stop = startPreviewFrames(video, canvas, 10)
  for (let i = 0; i < 60; i++) callback(i * 1000 / 60, { presentedFrames: i })
  expect(ctx.drawImage.mock.calls.length).toBeGreaterThanOrEqual(9)
  expect(ctx.drawImage.mock.calls.length).toBeLessThanOrEqual(10)
  callback(1500, { presentedFrames: 100 })
  const count = ctx.drawImage.mock.calls.length
  callback(1700, { presentedFrames: 100 })
  expect(ctx.drawImage).toHaveBeenCalledTimes(count)
  stop(); callback(2000, { presentedFrames: 101 })
  expect(ctx.drawImage).toHaveBeenCalledTimes(count)
  expect(video.cancelVideoFrameCallback).toHaveBeenCalled()
})

it('keeps native playback when refresh rate follows the source', () => {
  const video = { requestVideoFrameCallback: jest.fn() }
  startPreviewFrames(video, {}, 0)()
  expect(video.requestVideoFrameCallback).not.toHaveBeenCalled()
})
