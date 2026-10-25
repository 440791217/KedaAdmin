import Vue from 'vue'
import request from '@/utils/request'

export const statisticsDefaults = {
  video_window_seconds: 2,
  detection_window_seconds: 5,
  update_interval_seconds: 1
}

export const statisticsSettings = Vue.observable({ ...statisticsDefaults })
const signalKey = 'camera-statistics-version'
let subscribers = 0
let poll
let pending
let generation = 0

export function applyStatistics(data) {
  Object.keys(statisticsDefaults).forEach(key => {
    const value = Number(data[key])
    statisticsSettings[key] = value > 0 && Number.isFinite(value) ? value : statisticsDefaults[key]
  })
}

function refresh() {
  if (pending) return pending
  const requestedGeneration = generation
  pending = request({ url: '/resource/frame-rates', method: 'get' })
    .then(({ data }) => {
      if (data && requestedGeneration === generation) applyStatistics(data)
    })
    .catch(() => { /* Keep the last valid settings while offline. */ })
    .finally(() => { pending = null })
  return pending
}

const storageChanged = event => {
  if (event.key !== signalKey) return
  ++generation
  if (pending) pending.finally(refresh)
  else refresh()
}

export function publishStatistics(data) {
  ++generation
  applyStatistics(data)
  try {
    localStorage.setItem(signalKey, String(Date.now()))
  } catch (error) { /* Polling still synchronizes other open clients. */ }
}

export function subscribeStatistics() {
  if (++subscribers === 1) {
    refresh()
    poll = setInterval(refresh, 30000)
    window.addEventListener('storage', storageChanged)
  }
  return () => {
    if (--subscribers === 0) {
      clearInterval(poll)
      window.removeEventListener('storage', storageChanged)
    }
  }
}
