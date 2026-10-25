import { RollingRate, observeVideoFrames } from '@/utils/frame-rate-meter'
import { startPreviewFrames } from '@/utils/preview-frames'

it('measures video over two seconds and decays to zero when no frames arrive', () => {
  const rate = new RollingRate(2, 0)
  for (let at = 40; at <= 2000; at += 40) rate.record(at)
  expect(rate.value(2000)).toBe(25)
  expect(rate.value(3000)).toBe(12.5)
  expect(rate.value(4000)).toBe(0)
})

it('measures low-rate detections over five seconds including successful empty results', () => {
  const rate = new RollingRate(5, 0)
  for (let at = 500; at <= 5000; at += 500) rate.record(at)
  expect(rate.value(5000)).toBe(2)
  expect(rate.value(7500)).toBe(1)
  expect(new RollingRate(5, 0).value(100)).toBeNull()
})

it('counts actual presented frames, excludes duplicate counters and cancels observation', () => {
  let callback
  const record = jest.fn()
  const video = {
    readyState: 4, paused: false,
    requestVideoFrameCallback: jest.fn(cb => { callback = cb; return 1 }),
    cancelVideoFrameCallback: jest.fn()
  }
  const stop = observeVideoFrames(video, record)
  callback(0, { presentedFrames: 10 })
  callback(40, { presentedFrames: 11 })
  callback(80, { presentedFrames: 11 })
  callback(120, { presentedFrames: 14 })
  expect(record.mock.calls.map(call => call[1])).toEqual([1, 1, 3])
  video.paused = true
  callback(160, { presentedFrames: 15 })
  expect(record).toHaveBeenCalledTimes(3)
  stop()
  callback(200, { presentedFrames: 16 })
  expect(record).toHaveBeenCalledTimes(3)
  expect(video.cancelVideoFrameCallback).toHaveBeenCalled()
})

it('counts only new canvas paints even when the render cap exceeds the source rate', () => {
  let callback
  const painted = jest.fn()
  const video = {
    readyState: 4, videoWidth: 640, videoHeight: 360,
    requestVideoFrameCallback: jest.fn(cb => { callback = cb; return 1 }),
    cancelVideoFrameCallback: jest.fn()
  }
  const canvas = { getContext: () => ({ clearRect() {}, drawImage() {} }) }
  const stop = startPreviewFrames(video, canvas, 70, false, painted)
  for (let frame = 0; frame < 25; frame++) callback(frame * 40, { presentedFrames: frame })
  callback(1000, { presentedFrames: 24 })
  expect(painted).toHaveBeenCalledTimes(25)
  stop()
})
