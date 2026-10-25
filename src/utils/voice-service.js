// All browser speech access lives here. Callers supply events, not utterances.
export class VoiceService {
  constructor(events = {}) {
    this.events = events
    this.queue = []
    this.current = null
    this.pending = new Set()
    this.spoken = new Set()
  }

  announce(event, context = {}) {
    const definition = this.events[event]
    if (!definition || context.enabled === false) return null
    const text = String(typeof definition.text === 'function' ? definition.text(context) : definition.text || '').trim()
    if (!text) return null

    const key = context.key || [context.scopeId, event, context.operationId].join(':')
    if (!context.retry && (this.pending.has(key) || this.wasSpoken(key, definition.persist))) return null
    const job = {
      ...definition,
      ...context,
      key,
      text,
      event,
      started: false,
      priority: definition.priority || 0
    }
    if (definition.replace) {
      this.cancelScope(context.scopeId)
    } else if (this.current && job.priority > this.current.priority) {
      this.cancelJob(this.current)
    }
    this.pending.add(key)
    this.queue.push(job)
    this.queue.sort((a, b) => b.priority - a.priority)
    this.playNext()
    return { cancel: () => this.cancelJob(job) }
  }

  wasSpoken(key, persist) {
    if (this.spoken.has(key)) return true
    try {
      return !!persist && sessionStorage.getItem(key) === 'spoken'
    } catch (error) {
      return false
    }
  }

  playNext() {
    if (this.current || !this.queue.length) return
    const job = this.queue.shift()
    this.current = job
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      this.finish(job, '浏览器不支持语音提示')
      return
    }
    const utterance = new window.SpeechSynthesisUtterance(job.text)
    job.utterance = utterance
    utterance.lang = 'zh-CN'
    utterance.onstart = () => {
      if (this.current !== job) return
      clearTimeout(job.watchdog)
      job.started = true
      this.spoken.add(job.key)
      if (this.spoken.size > 512) this.spoken.delete(this.spoken.values().next().value)
      if (job.persist) {
        try {
          sessionStorage.setItem(job.key, 'spoken')
        } catch (error) { /* In-memory deduplication remains available. */ }
      }
      if (job.onStart) job.onStart()
    }
    utterance.onend = () => this.finish(job)
    utterance.onerror = () => this.finish(job, '语音未播放，请检查浏览器声音权限', true)
    job.watchdog = setTimeout(() => {
      if (this.current === job && !job.started) {
        this.finish(job, '语音未播放，请检查浏览器声音权限', true)
      }
    }, 5000)
    try {
      if (window.speechSynthesis.resume) window.speechSynthesis.resume()
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      this.finish(job, '语音未播放，请检查浏览器声音权限', true)
    }
  }

  finish(job, error, cancel = false) {
    if (this.current !== job) return
    this.detach(job)
    this.current = null
    this.pending.delete(job.key)
    if (cancel && window.speechSynthesis) window.speechSynthesis.cancel()
    if (error && job.onError) job.onError(error)
    this.playNext()
  }

  detach(job) {
    clearTimeout(job.watchdog)
    if (job.utterance) {
      job.utterance.onstart = null
      job.utterance.onend = null
      job.utterance.onerror = null
    }
  }

  cancelJob(job) {
    this.queue = this.queue.filter(item => item !== job)
    this.pending.delete(job.key)
    if (this.current === job) {
      this.detach(job)
      this.current = null
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
    if (job.onCancel) job.onCancel(job.started)
  }

  cancelScope(scopeId) {
    const jobs = [...this.queue, ...(this.current ? [this.current] : [])]
    jobs.filter(job => job.scopeId === scopeId).forEach(job => this.cancelJob(job))
    this.playNext()
  }

  cancelChannel(channel) {
    const jobs = [...this.queue, ...(this.current ? [this.current] : [])]
    jobs.filter(job => job.channel === channel).forEach(job => this.cancelJob(job))
    this.playNext()
  }
}
