import { VoiceService } from '@/utils/voice-service'
import { voiceEvents } from '@/shared/execution/voice-events'

let service
let originalSpeech
let originalUtterance
let speak
let cancel

beforeEach(() => {
  jest.useFakeTimers()
  sessionStorage.clear()
  originalSpeech = window.speechSynthesis
  originalUtterance = window.SpeechSynthesisUtterance
  speak = jest.fn()
  cancel = jest.fn()
  window.speechSynthesis = { speak, cancel, resume: jest.fn() }
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
    }
  }
  service = new VoiceService(voiceEvents)
})

afterEach(() => {
  service.cancelScope('execution:1')
  window.speechSynthesis = originalSpeech
  window.SpeechSynthesisUtterance = originalUtterance
  jest.useRealTimers()
})

const context = operationId => ({ scopeId: 'execution:1', operationId })

it('queues the first instruction after the start prompt', () => {
  service.announce('execution.started', context('start'))
  service.announce('step.entered', { ...context('step1'), text: '放置杯子' })
  expect(speak).toHaveBeenCalledTimes(1)
  speak.mock.calls[0][0].onstart()
  speak.mock.calls[0][0].onend()
  expect(speak.mock.calls[1][0].text).toBe('放置杯子')
})

it('deduplicates one operation but allows a later pause', () => {
  service.announce('execution.paused', context('v1'))
  service.announce('execution.paused', context('v1'))
  expect(speak).toHaveBeenCalledTimes(1)
  speak.mock.calls[0][0].onstart()
  speak.mock.calls[0][0].onend()
  service.announce('execution.paused', context('v1'))
  expect(speak).toHaveBeenCalledTimes(1)
  service.announce('execution.paused', context('v3'))
  expect(speak).toHaveBeenCalledTimes(2)
})

it('cancels stale instructions and timeout reminders on a terminal event', () => {
  service.announce('step.entered', { ...context('s1'), text: '旧步骤' })
  service.announce('step.timeout', { ...context('t1'), text: '已超时' })
  service.announce('execution.completed', context('v4'))
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(speak.mock.calls[2][0].text).toBe('作业完成，请扫描下一件')
  speak.mock.calls[2][0].onend()
  expect(speak).toHaveBeenCalledTimes(3)
})

it('reports silent failure once and supports an explicit retry', () => {
  const onError = jest.fn()
  service.announce('execution.started', { ...context('start'), onError })
  jest.advanceTimersByTime(5000)
  expect(onError).toHaveBeenCalledTimes(1)
  expect(cancel).toHaveBeenCalledTimes(1)
  service.announce('execution.started', { ...context('start'), retry: true })
  expect(speak).toHaveBeenCalledTimes(2)
})

it('does not time out an instruction while it waits in the status queue', () => {
  service.announce('execution.started', context('start'))
  speak.mock.calls[0][0].onstart()
  const onError = jest.fn()
  service.announce('step.entered', { ...context('s1'), text: '放置杯子', onError })
  jest.advanceTimersByTime(6000)
  expect(onError).not.toHaveBeenCalled()
  speak.mock.calls[0][0].onend()
  expect(speak).toHaveBeenCalledTimes(2)
})

it('supports scope cancellation, disabled events and unknown future events', () => {
  service.announce('unknown', context('future'))
  service.announce('execution.started', { ...context('start'), enabled: false })
  expect(speak).not.toHaveBeenCalled()
  service.announce('execution.started', context('start'))
  const old = speak.mock.calls[0][0]
  service.cancelScope('execution:1')
  expect(old.onend).toBeNull()
  expect(service.current).toBeNull()
  jest.advanceTimersByTime(6000)
  expect(service.queue).toHaveLength(0)
})
