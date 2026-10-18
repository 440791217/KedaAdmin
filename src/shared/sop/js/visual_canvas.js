const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x))
export default {
  name: 'VisualCanvas',
  props: {
    src: { type: String, default: '' },
    width: { type: Number, default: 1000 },
    height: { type: Number, default: 600 },
    items: { type: Array, default: () => [] },
    selectedId: { type: String, default: '' },
    tool: { type: String, default: 'select' },
    readonly: Boolean
  },
  data() {
    return { gesture: null, drawing: null, corners: ['nw', 'ne', 'sw', 'se'] }
  },
  computed: {
    fontSize() {
      return Math.max(this.width / 50, 12)
    },
    lineWidth() {
      return Math.max(this.width / 400, 1)
    },
    handle() {
      return this.width / 70
    }
  },
  mounted() {
    window.addEventListener('pointermove', this.move)
    window.addEventListener('pointerup', this.end)
    window.addEventListener('pointercancel', this.cancel)
  },
  beforeDestroy() {
    window.removeEventListener('pointermove', this.move)
    window.removeEventListener('pointerup', this.end)
    window.removeEventListener('pointercancel', this.cancel)
  },
  methods: {
    point(e) {
      const r = this.$refs.svg.getBoundingClientRect()
      return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }
    },
    arrowHead(item) {
      const x = item.x2 * this.width
      const y = item.y2 * this.height
      const angle = Math.atan2(y - item.y * this.height, x - item.x * this.width)
      const size = this.fontSize
      return [
        [x, y],
        [x - size * Math.cos(angle - 0.5), y - size * Math.sin(angle - 0.5)],
        [x - size * Math.cos(angle + 0.5), y - size * Math.sin(angle + 0.5)]
      ]
        .map((p) => p.join(','))
        .join(' ')
    },
    start(e, item, corner) {
      if (e.button !== 0) return
      if (this.readonly) { if (item) this.$emit('select', item.id); return }
      if (this.tool === 'select' && item) {
        this.$emit('select', item.id)
        this.$emit('checkpoint')
        this.gesture = { a: this.point(e), original: { ...item }, corner }
        return
      }
      if (this.tool !== 'select') {
        const p = this.point(e)
        this.drawing = { a: p, b: p }
      } else this.$emit('select', '')
    },
    move(e) {
      if (this.readonly) return this.cancel()
      if (this.drawing) {
        this.drawing.b = this.point(e)
        return
      }
      if (!this.gesture) return
      const g = this.gesture
      const p = this.point(e)
      const o = g.original
      const item = { ...o }
      if (g.corner) {
        const left = g.corner.includes('w') ? clamp(p.x, 0, o.x + o.width - 0.005) : o.x
        const top = g.corner.includes('n') ? clamp(p.y, 0, o.y + o.height - 0.005) : o.y
        const right = g.corner.includes('e') ? clamp(p.x, o.x + 0.005, 1) : o.x + o.width
        const bottom = g.corner.includes('s') ? clamp(p.y, o.y + 0.005, 1) : o.y + o.height
        Object.assign(item, { x: left, y: top, width: right - left, height: bottom - top })
      } else {
        const minX = o.kind === 'arrow' ? Math.min(o.x, o.x2) : o.x
        const minY = o.kind === 'arrow' ? Math.min(o.y, o.y2) : o.y
        const maxX = o.kind === 'arrow' ? Math.max(o.x, o.x2) : o.x + o.width
        const maxY = o.kind === 'arrow' ? Math.max(o.y, o.y2) : o.y + o.height
        const dx = clamp(p.x - g.a.x, -minX, 1 - maxX)
        const dy = clamp(p.y - g.a.y, -minY, 1 - maxY)
        item.x += dx
        item.y += dy
        if (o.kind === 'arrow') {
          item.x2 += dx
          item.y2 += dy
        }
      }
      this.$emit('update', item)
    },
    end(e) {
      if (this.drawing) {
        const { a, b } = this.drawing
        if (this.tool !== 'arrow' && (Math.abs(a.x - b.x) < 0.005 || Math.abs(a.y - b.y) < 0.005)) return this.cancel()
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.01) {
          this.$emit(
            'create',
            this.tool === 'arrow'
              ? { kind: 'arrow', x: a.x, y: a.y, x2: b.x, y2: b.y }
              : {
                kind: this.tool,
                x: Math.min(a.x, b.x),
                y: Math.min(a.y, b.y),
                width: Math.max(0.005, Math.abs(a.x - b.x)),
                height: Math.max(0.005, Math.abs(a.y - b.y))
              }
          )
        }
      }
      this.cancel()
    },
    cancel() {
      this.drawing = null
      this.gesture = null
    }
  }
}
