// Rolling event rates use monotonic time; configured FPS is never a sample.
export class RollingRate {
  constructor(windowSeconds, now = performance.now()) {
    this.windowMs = windowSeconds * 1000
    this.started = now
    this.samples = []
  }

  record(now = performance.now(), count = 1) {
    if (count > 0) this.samples.push({ now, count })
    this.prune(now)
  }

  prune(now) {
    const cutoff = now - this.windowMs
    while (this.samples.length && this.samples[0].now <= cutoff) this.samples.shift()
  }

  value(now = performance.now()) {
    this.prune(now)
    const elapsed = Math.min(this.windowMs, now - this.started)
    if (elapsed < 500) return null
    return this.samples.reduce((sum, sample) => sum + sample.count, 0) * 1000 / elapsed
  }
}

export function observeVideoFrames(video, record, active = () => true) {
  let stopped = false
  let handle
  let previous
  const native = typeof video.requestVideoFrameCallback === 'function'
  const qualityCount = () => {
    if (!video.getVideoPlaybackQuality) return null
    const quality = video.getVideoPlaybackQuality()
    return quality.totalVideoFrames - (quality.droppedVideoFrames || 0)
  }
  previous = native ? null : qualityCount()
  const tick = (now, metadata) => {
    if (stopped) return
    const count = native ? metadata.presentedFrames : qualityCount()
    if (active() && !document.hidden && video.readyState >= 2 && !video.paused && count != null) {
      const delta = previous == null ? 1 : Math.max(0, count - previous)
      if (delta) record(now, delta)
    }
    previous = count
    handle = native ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
  }
  handle = native ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
  return () => {
    stopped = true
    if (native) video.cancelVideoFrameCallback(handle)
    else cancelAnimationFrame(handle)
  }
}
