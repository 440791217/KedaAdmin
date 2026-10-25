import { updateExecutionClock } from '@/api/execution'

export class ExecutionHeartbeat {
  constructor(id, position, update, interrupted) {
    this.id = id; this.position = position; this.update = update; this.interrupted = interrupted
    this.session = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'clock_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    this.sequence = 0; this.closed = false; this.ready = false; this.queue = Promise.resolve()
  }
  async start() {
    try {
      const { data } = await updateExecutionClock(this.id, { action: 'claim', position: this.position, session_id: this.session, sequence: 0, elapsed_ms: 0 })
      if (!data.timing_running) throw new Error('执行会话未连接，请继续作业')
      this.sample = performance.now(); this.ready = true
      if (this.closed) { await this.send('release', this.sample); return }
      this.update(data); this.schedule()
    } catch (error) { if (!this.closed) this.fail(error); throw error }
  }
  schedule() { clearTimeout(this.timer); if (!this.closed) this.timer = setTimeout(() => { this.flush().then(() => this.schedule()).catch(() => {}) }, 5000) }
  fail(error) { this.closed = true; this.ready = false; clearTimeout(this.timer); this.interrupted(error) }
  async send(action, captured) {
    const elapsed = Math.max(0, Math.round(captured - this.sample))
    if (elapsed >= 15000) throw new Error('执行心跳已中断，请继续作业')
    const sequence = this.sequence + 1
    const { data } = await updateExecutionClock(this.id, { action, position: this.position, session_id: this.session, sequence, elapsed_ms: elapsed })
    this.sample = captured; this.sequence = sequence
    if (action !== 'release' && !data.timing_running) throw new Error('执行会话已中断，请继续作业')
    if (!this.closed) this.update(data)
    return data
  }
  flush() {
    this.queue = this.queue.then(async() => {
      if (this.closed || !this.ready) throw new Error('执行会话未连接，请继续作业')
      try { return await this.send('heartbeat', performance.now()) } catch (error) { this.fail(error); throw error }
    })
    return this.queue
  }
  stop(release = true) {
    if (this.closed) return
    this.closed = true; clearTimeout(this.timer)
    const captured = performance.now()
    if (release && this.ready) this.queue.catch(() => {}).then(() => this.send('release', captured)).catch(() => {})
  }
}
