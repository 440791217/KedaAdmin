import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import Guide from '@/shared/execution/components/OperationGuide.vue'
import { voice } from '@/shared/execution/voice-events'
jest.mock('@/utils/request', () => jest.fn())

let wrapper, now, speak, cancel, originalSpeech, originalUtterance
const create = (props = {}) => shallowMount(Guide, { propsData: {
  executing: true, voiceAlertsEnabled: true, executionStatus: 0, imageContext: { executionId: '42' },
  steps: [{ id: 's1', title: '杯子', expected_duration_seconds: 30, voice_enabled: 1, attachments: [] }, { id: 's2', title: '手机', expected_duration_seconds: 30, voice_enabled: 1, attachments: [] }],
  confirmed: [true, false], evidenceSteps: [{ confirmed_at: 'done', elapsed_ms: 1000 }, { elapsed_ms: 29000, timing_running: true }], ...props
}, stubs: { 'el-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' }, 'el-dialog': true }})
beforeEach(() => {
  voice.cancelScope('execution:42')
  voice.spoken.clear()
  jest.useFakeTimers(); now = 0; jest.spyOn(performance, 'now').mockImplementation(() => now)
  originalSpeech = window.speechSynthesis; originalUtterance = window.SpeechSynthesisUtterance
  speak = jest.fn(); cancel = jest.fn()
  window.speechSynthesis = { speak, cancel }
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text } }
  sessionStorage.clear()
})
afterEach(() => {
  if (wrapper) wrapper.destroy()
  window.speechSynthesis = originalSpeech; window.SpeechSynthesisUtterance = originalUtterance
  jest.restoreAllMocks(); jest.useRealTimers(); sessionStorage.clear()
})
const tick = async(milliseconds) => { now += milliseconds; jest.advanceTimersByTime(milliseconds); await Vue.nextTick() }

it('announces the executing step at its deadline even when another step is being viewed, once across refreshes', async() => {
  wrapper = create({ stepIndex: 0 })
  await tick(500); expect(speak).not.toHaveBeenCalled()
  await tick(500); expect(speak).toHaveBeenCalledTimes(1)
  const voice = speak.mock.calls[0][0]
  expect(voice.text).toContain('手机'); expect(voice.lang).toBe('zh-CN')
  voice.onstart(); voice.onend(); await tick(10000); expect(speak).toHaveBeenCalledTimes(1)
  wrapper.destroy(); wrapper = create({ evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 40000, timing_running: true }] })
  await tick(1000); expect(speak).toHaveBeenCalledTimes(1)
})

it('waits through a pause and announces only after the resumed step reaches its limit', async() => {
  wrapper = create({ executionStatus: 1, evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 29000, timing_running: false }] })
  await tick(10000); expect(speak).not.toHaveBeenCalled()
  await wrapper.setProps({ executionStatus: 0, evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 29000, timing_running: true }] })
  await tick(1000); expect(speak).toHaveBeenCalledTimes(1)
})

it.each([
  { voiceAlertsEnabled: false }, { recordsMode: true }, { executionStatus: 2 },
  { steps: [{}, { id: 's2', expected_duration_seconds: 0, voice_enabled: 1 }] },
  { steps: [{}, { id: 's2', expected_duration_seconds: 30, voice_enabled: 0 }] }
])('does not announce for inactive viewers, records, unlimited or muted steps: %p', async props => {
  wrapper = create(props); await tick(5000); expect(speak).not.toHaveBeenCalled()
})

it('shows a recoverable playback error without retrying every clock tick', async() => {
  wrapper = create(); await tick(1000)
  speak.mock.calls[0][0].onerror({ error: 'not-allowed' }); await Vue.nextTick()
  expect(wrapper.text()).toContain('到时语音未播放')
  await tick(2000); expect(speak).toHaveBeenCalledTimes(1)
  await wrapper.findAll('button').wrappers.find(button => button.text() === '重播提醒').trigger('click')
  expect(speak).toHaveBeenCalledTimes(2)
})

it('reads the configured instruction once for the active step and stops it on interruption', async() => {
  wrapper = create({
    steps: [{}, { id: 's2', voice_enabled: true, voice_text: '按指示放置手机', expected_duration_seconds: 30 }],
    evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 0, timing_running: true }]
  })
  await tick(250)
  expect(speak).toHaveBeenCalledTimes(1)
  const instruction = speak.mock.calls[0][0]
  expect(instruction.text).toBe('按指示放置手机')
  instruction.onstart()
  await tick(1000)
  expect(speak).toHaveBeenCalledTimes(1)
  await wrapper.setProps({ voiceAlertsEnabled: false })
  await tick(250)
  expect(cancel).toHaveBeenCalled()
  await wrapper.setProps({ voiceAlertsEnabled: true })
  await tick(250)
  expect(speak).toHaveBeenCalledTimes(1)
})

it('shows a retry action when the browser silently fails to start instruction speech', async() => {
  wrapper = create({
    steps: [{}, { id: 's2', voice_enabled: 1, voice_text: '放置手机', expected_duration_seconds: 30 }],
    evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 0, timing_running: true }]
  })
  await tick(250)
  await tick(5000)
  expect(wrapper.text()).toContain('步骤语音未播放')
  await tick(1000)
  expect(speak).toHaveBeenCalledTimes(1)
  await wrapper.findAll('button').wrappers.find(button => button.text() === '重播语音').trigger('click')
  expect(speak).toHaveBeenCalledTimes(2)
})

it('prioritizes the deadline reminder over the instruction and detects silent playback failure', async() => {
  wrapper = create({
    steps: [{}, { id: 's2', voice_enabled: 1, voice_text: '放置手机', expected_duration_seconds: 30 }]
  })
  await tick(250)
  speak.mock.calls[0][0].onstart()
  await tick(750)
  expect(speak).toHaveBeenCalledTimes(2)
  expect(speak.mock.calls[1][0].text).toContain('作业时间已到')
  await tick(5000)
  expect(wrapper.text()).toContain('到时语音未播放')
  expect(speak).toHaveBeenCalledTimes(2)
})

it.each([
  { voiceAlertsEnabled: false },
  { recordsMode: true },
  { executionStatus: 1 },
  { executionStatus: 2 }
])('does not read configured instructions outside active execution: %p', async props => {
  wrapper = create({
    steps: [{}, { id: 's2', voice_enabled: 1, voice_text: '放置手机', expected_duration_seconds: 30 }],
    evidenceSteps: [{ confirmed_at: 'done' }, { elapsed_ms: 0, timing_running: true }],
    ...props
  })
  await tick(1000)
  expect(speak).not.toHaveBeenCalled()
})
