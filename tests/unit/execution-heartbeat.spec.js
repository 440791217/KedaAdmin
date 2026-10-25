import { ExecutionHeartbeat } from '@/utils/execution-heartbeat'
import { updateExecutionClock } from '@/api/execution'
jest.mock('@/api/execution', () => ({ updateExecutionClock: jest.fn() }))
let now, heartbeat, update, interrupted
const flush = async() => { for (let i = 0; i < 25; i++) await Promise.resolve() }
beforeEach(() => {
  jest.useFakeTimers(); now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  update = jest.fn(); interrupted = jest.fn()
  updateExecutionClock.mockReset(); updateExecutionClock.mockImplementation((id, body) => Promise.resolve({ data: { position: 1, timing_running: body.action !== 'release', elapsed_ms: body.elapsed_ms, heartbeat_sequence: body.sequence }}))
  heartbeat = new ExecutionHeartbeat('50', 1, update, interrupted)
})
afterEach(() => { heartbeat.stop(false); jest.restoreAllMocks(); jest.useRealTimers() })

it('reports real elapsed milliseconds every five seconds and serializes sequences', async() => {
  await heartbeat.start(); now = 5200; jest.advanceTimersByTime(5000); await flush()
  expect(updateExecutionClock.mock.calls[1][1]).toEqual(expect.objectContaining({ action: 'heartbeat', sequence: 1, elapsed_ms: 5200 }))
  now = 5700; await heartbeat.flush()
  expect(updateExecutionClock.mock.calls[2][1]).toEqual(expect.objectContaining({ sequence: 2, elapsed_ms: 500 }))
  expect(interrupted).not.toHaveBeenCalled()
})
it('saves the final partial interval when leaving and sends no later heartbeat', async() => {
  await heartbeat.start(); now = 2300; heartbeat.stop(); await flush()
  expect(updateExecutionClock.mock.calls[1][1]).toEqual(expect.objectContaining({ action: 'release', elapsed_ms: 2300, sequence: 1 }))
  now = 20000; jest.advanceTimersByTime(20000); await flush()
  expect(updateExecutionClock).toHaveBeenCalledTimes(2)
})
it('does not charge a long suspended interval and requires a fresh session after interruption', async() => {
  await heartbeat.start(); now = 17000
  await expect(heartbeat.flush()).rejects.toThrow('中断')
  expect(updateExecutionClock).toHaveBeenCalledTimes(1); expect(interrupted).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(30000); await flush(); expect(updateExecutionClock).toHaveBeenCalledTimes(1)
})
it('stops after a failed save rather than continuing to spend time offline', async() => {
  await heartbeat.start(); updateExecutionClock.mockRejectedValueOnce(new Error('offline')); now = 5000
  await expect(heartbeat.flush()).rejects.toThrow('offline')
  expect(heartbeat.closed).toBe(true); expect(interrupted).toHaveBeenCalledTimes(1)
  now = 30000; jest.advanceTimersByTime(30000); await flush(); expect(updateExecutionClock).toHaveBeenCalledTimes(2)
})
it('releases a claim that completes after the page has closed', async() => {
  let finish
  updateExecutionClock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const starting = heartbeat.start(); heartbeat.stop()
  finish({ data: { position: 1, timing_running: true }}); await starting
  expect(updateExecutionClock.mock.calls[1][1].action).toBe('release')
  expect(update).not.toHaveBeenCalled()
})
