import Draggable from 'vuedraggable'
import { publishTaskStandard, fetchTaskImage } from '@/api/resource'
import CameraSource from '@/views/sop/editor/components/CameraSource.vue'
import ResourceRequirements from '@/views/sop/editor/components/ResourceRequirements.vue'
import editor from '@/views/sop/editor/js/sop_editor'
import VisualCanvas from '@/shared/sop/components/VisualCanvas.vue'
import { fetchSopImage, saveSopAuthoring, saveSopVersion, sortSopSteps } from '@/api/sop'
const inherited = { ...editor }
delete inherited.beforeRouteLeave
delete inherited.beforeRouteUpdate
const clone = (value) => JSON.parse(JSON.stringify(value))
const stepFields = (step) => ({
  title: step.title || '',
  instruction: step.instruction || '',
  precautions: step.precautions || '',
  check_requirements: step.check_requirements || '',
  expected_duration_seconds: step.expected_duration_seconds == null ? null : step.expected_duration_seconds,
  detection_wait_seconds: Number(step.detection_wait_seconds || 0),
  voice_enabled: !!Number(step.voice_enabled || 0),
  voice_text: step.voice_text || ''
})
export default {
  name: 'SopAuthoring',
  extends: inherited,
  props: {
    embedded: Boolean,
    viewOnly: Boolean,
    contentSopId: { type: String, default: '' },
    contentRevisionId: { type: String, default: '' },
    taskContext: { type: Object, default: null },
    previewRevision: { type: Object, default: null }
  },
  components: { Draggable, VisualCanvas, ResourceRequirements, CameraSource },
  data() {
    return {
      cameraDialog: false,
      currentStepId: '',
      currentImageId: '',
      work: null,
      workBaseline: '',
      selectedId: '',
      tool: 'select',
      markMode: 'guide',
      inspector: 'step',
      imageUrl: '',
      imageLoading: false,
      imageFailed: false,
      imageSequence: 0,
      history: [],
      zoom: 1,
      detailsDialog: false,
      stale: false,
      speech: null,
      showGuides: true,
      showDetection: true,
      tools: [
        { value: 'select', label: '选择' },
        { value: 'rect', label: '矩形' },
        { value: 'arrow', label: '箭头' },
        { value: 'text', label: '文字' }
      ]
    }
  },
  computed: {
    taskInfo() { return this.taskContext || this.$route.query },
    sopId() { return this.contentSopId || this.$route.params.sopId },
    revisionId() { return this.contentRevisionId || this.$route.params.revisionId },
    editable() { return !this.viewOnly && editor.computed.editable.call(this) },
    activeStep() {
      return this.revision && this.revision.steps.find((s) => s.id === this.currentStepId)
    },
    activeImage() {
      return this.activeStep && this.activeStep.attachments.find((a) => a.id === this.currentImageId)
    },
    visual() {
      return this.work && this.work.visuals[this.currentImageId]
    },
    items() {
      return this.visual ? [...this.visual.guide_items, ...this.visual.detection_regions] : []
    },
    visibleItems() { return this.items.filter(item => item.detect_type ? this.showDetection : this.showGuides) },
    selected() {
      return this.items.find((i) => i.id === this.selectedId)
    },
    workDirty() {
      return !!this.work && JSON.stringify(this.work) !== this.workBaseline
    },
    dirty() {
      return editor.computed.dirty.call(this) || this.workDirty
    }
  },
  beforeDestroy() {
    ++this.imageSequence
    this.releaseImage()
    this.stopSpeech()
  },
  beforeRouteLeave(to, from, next) {
    if (this.busy) return next(false)
    this.resolvePending().then((ok) => next(ok ? undefined : false))
  },
  beforeRouteUpdate(to, from, next) {
    if (this.busy) return next(false)
    this.resolvePending().then((ok) => {
      if (!ok) return next(false)
      next()
      this.$nextTick(() => this.load())
    })
  },
  methods: {
    async openCamera() {
      if (this.busy || this.stale || !this.editable || !this.activeStep || !this.taskInfo.station_id) return
      if (await this.resolvePending()) this.cameraDialog = true
    },
    async useCameraImage(request) {
      if (this.busy || this.stale || !this.editable || !this.activeStep || this.dirty) {
        this.$message.error('请先保存当前修改后再添加摄像头照片')
        request.onError(new Error('当前步骤不可上传'))
        return
      }
      await this.upload(this.activeStep, request)
    },
    async load() {
      if (this.embedded && this.viewOnly) {
        this.loading = false; this.failed = false
        this.document = { name: this.taskInfo.name || 'SOP任务', code: '', can_edit: false, can_publish: false }
        this.accept(clone(this.previewRevision || { id: '', title: this.taskInfo.name || '', status: 0, revision_no: 0, version: 0, steps: [] }))
        return
      }
      await editor.methods.load.call(this)
    },
    async reorderSteps(steps) {
      if (this.busy || this.dirty || this.stale || !this.editable) return
      const ids = steps.map(step => step.id)
      const current = this.revision.steps.map(step => step.id)
      if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some(id => !current.includes(id)) || ids.every((id, i) => id === current[i])) return
      // Keep the loaded order unchanged until the server commits the new version.
      this.busy = true
      try {
        const { data } = await sortSopSteps(this.sopId, this.revisionId, ids, this.revision.version)
        this.accept(data); this.$message.success('步骤顺序已保存')
      } catch (e) { if (e.code === 409) this.stale = true } finally { this.busy = false }
    },
    async publishAndUse() {
      const q = this.taskInfo
      if (this.busy || this.dirty || !this.editable || !q.task_id || q.task_version == null || q.task_version === '' || !Number.isInteger(Number(q.task_version))) return
      try { await this.$confirm('发布当前任务内容？系统会校验任务权限和工位硬件，失败时保留草稿。', '发布任务内容', { type: 'warning' }) } catch (e) { return }
      this.busy = true
      try {
        await publishTaskStandard(q.project_id, q.subproject_id, q.task_id, { sop_id: this.sopId, revision_id: this.revisionId, revision_version: this.revision.version, task_version: Number(q.task_version) })
        this.$message.success('任务内容已发布')
        this.busy = false
        if (this.embedded) this.$emit('published')
        else await this.$router.push(`/project/${q.project_id}/subproject/${q.subproject_id}/task/${q.task_id}`)
      } catch (e) { /* server keeps both draft and task unchanged on failure */ } finally { this.busy = false }
    },
    accept(revision) {
      editor.methods.accept.call(this, revision)
      this.stale = false
      this.setupStep(this.currentStepId)
    },
    setupStep(id) {
      const step = this.revision.steps.find((s) => s.id === id) || this.revision.steps[0]
      this.currentStepId = step ? step.id : ''
      this.history = []
      this.selectedId = ''
      this.work = null
      if (!step) {
        this.currentImageId = ''
        this.releaseImage()
        return
      }
      const visuals = {}
      step.attachments.forEach((a) => {
        visuals[a.id] = {
          attachment_id: a.id,
          schema_version: 1,
          image_width: 0,
          image_height: 0,
          guide_items: [],
          detection_regions: [],
          ...clone(a.visual || {})
        }
      })
      this.work = { step: stepFields(step), visuals, resources: { workplace_requirements: step.workplace_requirements || '', items: clone(step.resource_requirements || []) }}
      this.workBaseline = JSON.stringify(this.work)
      const image = step.attachments.find((a) => a.id === this.currentImageId) || step.attachments[0]
      this.currentImageId = image ? image.id : ''
      this.loadImage()
    },
    async resolvePending() {
      if (!this.dirty) return true
      try {
        await this.$confirm('当前制作内容尚未保存。保存后继续，或放弃本次修改。', '未保存修改', {
          confirmButtonText: '保存并继续',
          cancelButtonText: '放弃修改',
          distinguishCancelAndClose: true,
          closeOnClickModal: false
        })
        await this.saveAll()
        return !this.dirty
      } catch (action) {
        if (action === 'cancel') {
          this.accept(this.revision)
          return true
        }
        return false
      }
    },
    async selectStep(id) {
      if (id === this.currentStepId || this.busy) return
      if (await this.resolvePending()) this.setupStep(id)
    },
    async selectImage(id) {
      if (id === this.currentImageId || this.busy) return
      if (await this.resolvePending()) {
        this.currentImageId = id
        this.selectedId = ''
        this.loadImage()
      }
    },
    releaseImage() {
      if (this.imageUrl) URL.revokeObjectURL(this.imageUrl)
      this.imageUrl = ''
    },
    async loadImage() {
      const seq = ++this.imageSequence
      this.releaseImage()
      this.imageFailed = false
      this.zoom = 1
      if (!this.activeImage) {
        this.imageLoading = false
        return
      }
      this.imageLoading = true
      try {
        const blob = this.embedded && this.viewOnly && this.taskInfo.image_mode === 'task' ? await fetchTaskImage(this.taskInfo.project_id, this.taskInfo.subproject_id, this.taskInfo.task_id, this.activeImage.file_id) : await fetchSopImage(this.sopId, this.revisionId, this.activeImage.file_id)
        if (seq === this.imageSequence) this.imageUrl = URL.createObjectURL(blob)
      } catch (error) {
        if (seq === this.imageSequence) this.imageFailed = true
      } finally {
        if (seq === this.imageSequence) this.imageLoading = false
      }
    },
    dimensions(size) {
      if (!this.visual) return
      if (!this.visual.image_width) {
        this.visual.image_width = size.width
        this.visual.image_height = size.height
        const baseline = JSON.parse(this.workBaseline)
        baseline.visuals[this.currentImageId].image_width = size.width
        baseline.visuals[this.currentImageId].image_height = size.height
        this.workBaseline = JSON.stringify(baseline)
      }
    },
    checkpoint() {
      if (!this.editable) return
      this.history.push(JSON.stringify(this.work))
      if (this.history.length > 30) this.history.shift()
    },
    undo() {
      if (this.history.length) {
        this.work = JSON.parse(this.history.pop())
        this.selectedId = ''
      }
    },
    createMark(shape) {
      if (!this.editable || !this.visual) return
      if (this.items.length >= 100) {
        this.$message.error('每张图片最多100个标注项')
        return
      }
      this.checkpoint()
      const bytes = new Uint8Array(8)
      window.crypto.getRandomValues(bytes)
      const item = {
        id: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''),
        name: this.markMode === 'detect' ? '检测区域' : '操作指引',
        color: this.markMode === 'detect' ? '#E6A23C' : '#409EFF',
        ...shape
      }
      if (shape.kind === 'text') item.text = '文字说明'
      if (this.markMode === 'detect') {
        Object.assign(item, {
          kind: 'rect',
          enabled: true,
          detect_type: 'object',
          class_name: '目标',
          confidence: 75,
          expected_count: 1,
          expected_text: '',
          expected_state: ''
        })
      }
      this.visual[this.markMode === 'detect' ? 'detection_regions' : 'guide_items'].push(item)
      this.selectedId = item.id
      this.inspector = 'region'
      this.tool = 'select'
    },
    updateMark(item) {
      if (!this.editable || !this.visual) return
      for (const key of ['guide_items', 'detection_regions']) {
        const i = this.visual[key].findIndex((x) => x.id === item.id)
        if (i >= 0) this.$set(this.visual[key], i, item)
      }
    },
    property(key, value) {
      this.checkpoint()
      this.updateMark({ ...this.selected, [key]: value })
    },
    deleteMark(id) {
      if (!this.editable || this.busy || !this.visual) return
      this.checkpoint()
      for (const key of ['guide_items', 'detection_regions']) { this.visual[key] = this.visual[key].filter((i) => i.id !== id) }
      this.selectedId = ''
    },
    chooseTool(tool) {
      this.tool = this.markMode === 'detect' && tool !== 'select' ? 'rect' : tool
    },
    async saveHeader() {
      return this.saveAll()
    },
    async saveAll() {
      if (this.busy || !this.editable || this.stale) return
      if (
        !this.header.title.trim() ||
        (this.work && (!this.work.step.title.trim() || !this.work.step.instruction.trim()))
      ) {
        this.$message.error('请填写版本标题、步骤名称和操作说明')
        return
      }
      if (this.work && this.work.step.voice_enabled && !this.work.step.voice_text.trim()) {
        this.$message.error('启用语音时请填写提示内容')
        return
      }
      this.busy = true
      try {
        const response = this.activeStep
          ? await saveSopAuthoring(this.sopId, this.revisionId, this.activeStep.id, {
            step: {
              ...this.work.step,
              version: this.activeStep.version,
              revision_version: this.revision.version
            },
            visuals: Object.values(this.work.visuals).filter((v) => v.image_width > 0),
            revision: { ...this.header, version: this.revision.version },
            resources: this.work.resources
          })
          : await saveSopVersion(this.sopId, this.revisionId, {
            ...this.header,
            version: this.revision.version
          })
        this.accept(response.data)
        this.$message.success('制作内容已保存')
      } catch (error) {
        if (error.code === 409) this.stale = true
      } finally {
        this.busy = false
      }
    },
    async saveStep(form) {
      const adding = !this.selectedStep
      await editor.methods.saveStep.call(this, form)
      if (adding && !this.stepDialog && this.revision.steps.length) { this.setupStep(this.revision.steps[this.revision.steps.length - 1].id) }
    },
    async upload(step, request) {
      const previous = new Set(step.attachments.map(a => a.id))
      await editor.methods.upload.call(this, step, request)
      const added = this.activeStep && this.activeStep.attachments.find(a => !previous.has(a.id))
      if (added) {
        this.currentImageId = added.id
        this.loadImage()
      }
    },
    async newStep() {
      if (!this.busy && (await this.resolvePending())) this.openStep(null)
    },
    async preview() {
      if (!this.busy && (await this.resolvePending())) { this.$router.push({ path: `/sop/${this.sopId}/version/${this.revisionId}/preview`, query: this.$route.query }) }
    },
    stopSpeech() {
      if (this.speech && window.speechSynthesis) window.speechSynthesis.cancel()
      this.speech = null
    },
    previewVoice() {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { return this.$message.error('浏览器暂不支持语音试听') }
      this.stopSpeech()
      const speech = new window.SpeechSynthesisUtterance(this.work.step.voice_text)
      speech.lang = 'zh-CN'
      this.speech = speech
      window.speechSynthesis.speak(speech)
    }
  }
}
