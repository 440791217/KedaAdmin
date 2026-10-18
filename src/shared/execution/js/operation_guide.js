import AnnotatedImage from '@/shared/sop/components/AnnotatedImage.vue'
export default {
  name: 'OperationGuide',
  components: { AnnotatedImage },
  props: {
    steps: { type: Array, default: () => [] }, stepIndex: { type: Number, default: 0 },
    imageContext: { type: Object, default: () => ({}) }, confirmed: { type: Array, default: () => [] },
    executing: Boolean, stationName: { type: String, default: '' }
  },
  data() { return { imageIndex: 0, expanded: false, stageWidth: 0, stageHeight: 0, imageWidth: 16, imageHeight: 9 } },
  computed: {
    step() { return this.steps[this.stepIndex] || null },
    images() { return this.step && this.step.attachments ? this.step.attachments : [] },
    image() { return this.images[this.imageIndex] || null },
    imageIdentity() { return [this.imageContext.executionId, this.imageContext.taskId, this.step && this.step.id, this.image && this.image.id].join(':') },
    imageStyle() {
      if (!this.stageWidth || !this.stageHeight) return { width: '100%' }
      const width = this.image && this.image.visual ? this.image.visual.image_width : this.imageWidth
      const height = this.image && this.image.visual ? this.image.visual.image_height : this.imageHeight
      return { width: Math.max(1, Math.min(this.stageWidth - 32, (this.stageHeight - 32) * width / height)) + 'px' }
    },
    completedCount() { return this.confirmed.filter(Boolean).length }
  },
  mounted() {
    this.measure()
    if (typeof ResizeObserver !== 'undefined') { this.stageObserver = new ResizeObserver(this.measure); this.stageObserver.observe(this.$refs.stage) }
    window.addEventListener('resize', this.measure)
  },
  beforeDestroy() { if (this.stageObserver) this.stageObserver.disconnect(); window.removeEventListener('resize', this.measure) },
  watch: { imageIndex() { this.imageWidth = 16; this.imageHeight = 9 }, stepIndex() { this.imageIndex = 0; this.expanded = false }, steps() { this.imageIndex = 0; this.expanded = false } },
  methods: {
    measure() { if (this.$refs.stage) { this.stageWidth = this.$refs.stage.clientWidth; this.stageHeight = this.$refs.stage.clientHeight } },
    imageLoaded(size) { this.imageWidth = size.width; this.imageHeight = size.height; this.measure() },
    select(index) { this.$emit('select', index) },
    stepState(index) { return this.confirmed[index] ? '已确认' : index === this.stepIndex ? (this.executing ? '当前步骤' : '正在查看') : (this.executing ? '待操作' : '操作步骤') }
  }
}
