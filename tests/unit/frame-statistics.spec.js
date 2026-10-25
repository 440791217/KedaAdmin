import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import frameStatistics from '@/shared/execution/js/frame_statistics'
import { applyStatistics, publishStatistics, statisticsDefaults } from '@/utils/frame-statistics-settings'

jest.mock('@/utils/request', () => jest.fn().mockResolvedValue({ data: {}}))

it('applies new windows without restarting the video observer and cleans up on exit', async() => {
  jest.useFakeTimers()
  let now = 0
  const clock = jest.spyOn(performance, 'now').mockImplementation(() => now)
  const wrapper = shallowMount({
    mixins: [frameStatistics],
    data: () => ({ connected: true }),
    render: h => h('span')
  })
  const video = {
    requestVideoFrameCallback: jest.fn(() => 1),
    cancelVideoFrameCallback: jest.fn()
  }
  try {
    wrapper.vm.startFrameMeasurement(video, false)
    for (let frame = 1; frame <= 50; frame++) wrapper.vm.recordPaintedFrame(frame * 40)
    now = 2000
    jest.advanceTimersByTime(1000)
    expect(wrapper.vm.measuredVideoFps).toBe(25)
    publishStatistics({ video_window_seconds: 3, detection_window_seconds: 8, update_interval_seconds: 2 })
    await Vue.nextTick()
    expect(wrapper.vm.measuredVideoFps).toBeNull()
    expect(wrapper.vm._videoRate.windowMs).toBe(3000)
    expect(wrapper.vm._detectionRate.windowMs).toBe(8000)
    expect(video.requestVideoFrameCallback).toHaveBeenCalledTimes(1)
    expect(video.cancelVideoFrameCallback).not.toHaveBeenCalled()
    wrapper.destroy()
    expect(video.cancelVideoFrameCallback).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  } finally {
    if (!wrapper.vm._isDestroyed) wrapper.destroy()
    applyStatistics(statisticsDefaults)
    clock.mockRestore()
    jest.useRealTimers()
  }
})
