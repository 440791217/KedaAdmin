import Vue from 'vue'
import { VoiceService } from '@/utils/voice-service'

const status = text => ({ text, priority: 100, replace: true, channel: 'status' })

export const voiceEvents = {
  'execution.started': status('作业开始'),
  'execution.paused': status('作业已暂停'),
  'execution.resumed': status('作业已恢复'),
  'execution.aborted': status('作业已中止'),
  'execution.completed': status('作业完成，请扫描下一件'),
  'execution.stepsCompleted': status('步骤已全部完成，请完成作业'),
  'step.entered': { text: context => context.text, priority: 20, persist: true },
  'step.timeout': { text: context => context.text, priority: 60, persist: true }
}

let enabled = true
try {
  enabled = localStorage.getItem('sop-job-voice') !== 'off'
} catch (error) { /* Voice defaults to enabled when storage is unavailable. */ }

export const voiceState = Vue.observable({ enabled, error: '' })
export const voice = new VoiceService(voiceEvents)
let lastStatus = null

export function setJobVoice(enabled) {
  voiceState.enabled = enabled
  voiceState.error = ''
  if (!enabled) voice.cancelChannel('status')
  try {
    localStorage.setItem('sop-job-voice', enabled ? 'on' : 'off')
  } catch (error) { /* The current page still keeps the selected setting. */ }
}

export function announceExecution(event, context, retry = false) {
  if (!voiceState.enabled) return
  voiceState.error = ''
  lastStatus = { event, context }
  return voice.announce(event, {
    ...context,
    retry,
    onError: error => { voiceState.error = error }
  })
}

export function retryExecutionVoice() {
  if (lastStatus) announceExecution(lastStatus.event, lastStatus.context, true)
}
