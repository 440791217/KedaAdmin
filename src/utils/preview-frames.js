// Limit frontend painting only. RTSP/WebRTC reception and camera settings are unchanged.
export function startPreviewFrames(video, canvas, fps, followSource = false, onPaint = null) {
  if (!video || !canvas || (!fps && !followSource)) return () => {}
  const interval = fps > 0 ? 1000 / fps : 0
  let stopped = false; let handle; let lastPaint = -Infinity; let lastFrame
  const native = !followSource && typeof video.requestVideoFrameCallback === 'function'
  const schedule = () => { handle = native ? video.requestVideoFrameCallback(paint) : requestAnimationFrame(paint) }
  const paint = (now, metadata) => {
    if (stopped) return
    const quality = !metadata && video.getVideoPlaybackQuality && video.getVideoPlaybackQuality()
    const frame = metadata ? metadata.presentedFrames : quality ? quality.totalVideoFrames - (quality.droppedVideoFrames || 0) : video.currentTime
    if (!document.hidden && video.readyState >= 2 && video.videoWidth && frame !== lastFrame && now - lastPaint >= interval) {
      const width = canvas.clientWidth || video.clientWidth || video.videoWidth; const height = canvas.clientHeight || video.clientHeight || video.videoHeight
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      const ctx = canvas.getContext('2d'); const scale = Math.min(width / video.videoWidth, height / video.videoHeight)
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(video, (width - video.videoWidth * scale) / 2, (height - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale)
      if (onPaint && (metadata || quality)) onPaint(now)
      lastPaint = interval && Number.isFinite(lastPaint) ? now - (now - lastPaint) % interval : now; lastFrame = frame
    }
    schedule()
  }
  if (followSource) paint(performance.now()); else schedule()
  return () => { stopped = true; if (native) video.cancelVideoFrameCallback(handle); else cancelAnimationFrame(handle) }
}
