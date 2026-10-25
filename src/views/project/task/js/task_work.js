import { fetchSopVersion, fetchSopVersions, fetchSop, copySopDraft } from '@/api/sop'
import { fetchTasks, saveTask, fetchResource, fetchTaskOwners, prepareTaskContent, previewTask } from '@/api/resource'
import { fetchProjectStations } from '@/api/project'
import { createBusinessCode } from '@/utils/business_code'
import SopAuthoring from '@/views/sop/editor/index.vue'
const formOf = row => ({ station_id: null, owner_user_id: null, sop_id: null, revision_id: null, description: '', ...row })
export default {
  name: 'SopTaskWork',
  components: { SopAuthoring },
  computed: {
    versionKey() { return this.editorSopId + ':' + this.editorRevisionId },
    draftVersion() { return this.versionOptions.find(item => Number(item.status) === 0) },
    currentVersionLabel() { const item = this.versionOptions.find(item => item.key === this.versionKey); return item ? item.label : '尚未编写内容' },
    canCopyVersion() { return this.canEdit && !this.editMode && !this.draftVersion && this.previewRevision && Number(this.previewRevision.status) !== 0 && this.selected && this.editorSopId === this.selected.content_sop_id },
    taskContext() { const t = this.selected || {}; return { project_id: this.projectId, subproject_id: this.subprojectId, task_id: t.id, task_version: t.version, task_content: '1', station_id: t.station_id || '', station_name: t.station_name, owner_name: t.owner_name, name: t.name, image_mode: this.imageMode } },
    editorKey() { return [this.editMode, this.editorSopId, this.editorRevisionId, this.selected && this.selected.version].join(':') },
    projectId() { return this.$route.params.projectId },
    subprojectId() { return this.$route.params.subprojectId },
    taskId() { return this.$route.params.taskId || '' },
    canEdit() { return this.canManage && this.form.status !== 2 },
    dirty() { return this.baseline !== null && JSON.stringify(this.payload()) !== this.baseline }
  },
  data() { return { versionOptions: [], versionLoading: false, versionFailed: false, settingsOpen: false, editMode: false, modeOverride: null, contentReady: false, editorSopId: '', editorRevisionId: '', previewRevision: null, imageMode: 'task', configOpen: true, advancedOpen: [], ready: false, loading: false, failed: false, loadMessage: '', busy: false, canManage: false, form: {}, selected: null, baseline: null, afterSaveEdit: false, contentCode: '', items: [], owners: [], stations: [], station: null, originalStationId: null, stationLoading: false, stationFailed: false, sequence: 0, stationSequence: 0 } },
  created() { this.load() },
  beforeDestroy() { ++this.sequence; ++this.stationSequence },
  watch: { '$route.fullPath'() { this.modeOverride = null; this.load() } },
  async beforeRouteLeave(to, from, next) { next(await this.mayLeave()) },
  async beforeRouteUpdate(to, from, next) { next(await this.mayLeave()) },
  methods: {
    async refreshVersions() {
      const seq = this.sequence; const task = this.selected
      if (!task) return
      this.versionLoading = true; this.versionFailed = false
      const options = []
      const add = (revision, sopId) => {
        const key = String(sopId) + ':' + revision.id
        if (options.some(item => item.key === key)) return
        const active = String(task.sop_id) === String(sopId) && String(task.revision_id) === String(revision.id)
        const status = Number(revision.status)
        const title = revision.revision_no ? 'V' + revision.revision_no : '版本'
        options.push({ ...revision, sopId: String(sopId), key, label: title + ' · ' + (active ? '当前生效' : status === 0 ? '草稿（未发布）' : status === 2 ? '已停用 · 只读' : '历史版本 · 只读') })
      }
      try {
        if (task.content_sop_id) {
          const { data } = await fetchSopVersions(task.content_sop_id)
          if (seq !== this.sequence || this.selected !== task) return
          data.forEach(item => add(item, task.content_sop_id))
        }
      } catch (error) { if (seq === this.sequence) this.versionFailed = true } finally {
        if (seq === this.sequence && this.selected === task) {
          if (task.revision_id) add({ id: task.revision_id, revision_no: task.revision_no, status: 1 }, task.sop_id)
          if (task.content_draft_id) add({ id: task.content_draft_id, revision_no: task.content_draft_no, status: 0 }, task.content_sop_id)
          this.versionOptions = options; this.versionLoading = false
        }
      }
    },
    async switchVersion(key) {
      if (key === this.versionKey || this.busy || this.loading || !(await this.resolveEditor())) return
      const option = this.versionOptions.find(item => item.key === key)
      if (!option) return
      const seq = this.sequence
      this.busy = true
      try {
        const active = option.sopId === String(this.selected.sop_id) && String(option.id) === String(this.selected.revision_id)
        const { data } = active ? await previewTask(this.projectId, this.subprojectId, this.selected.id) : await fetchSopVersion(option.sopId, option.id)
        if (seq !== this.sequence) return
        this.editMode = false; this.modeOverride = false; this.previewRevision = data
        this.editorSopId = option.sopId; this.editorRevisionId = String(option.id); this.imageMode = active ? 'task' : 'source'
      } catch (error) { /* Request reports failure; preserve the displayed version. */ } finally { this.busy = false }
    },
    async copyVersion() {
      if (!this.canCopyVersion || this.busy || !(await this.resolveEditor())) return
      try { await this.$confirm('将此版本复制为新草稿？当前生效版和进行中的作业保持原版本。', '复制为草稿', { type: 'warning' }) } catch (error) { return }
      const sopId = this.editorSopId; const revisionId = this.editorRevisionId
      this.busy = true
      try {
        const { data: document } = await fetchSop(sopId)
        const { data } = await copySopDraft(sopId, revisionId, document.version)
        this.selected = { ...this.selected, content_draft_id: String(data.id), content_draft_no: data.revision_no }
        this.editorRevisionId = String(data.id); this.previewRevision = null; this.imageMode = 'source'; this.editMode = true; this.modeOverride = true
        await this.refreshVersions()
        this.$message.success('已复制为新草稿')
      } catch (error) { /* Server rejects stale versions or an existing draft. */ } finally { this.busy = false }
    },
    async mayLeave() {
      if (this.busy || this.loading) return false
      if (!(await this.resolveEditor())) return false
      if (!this.dirty) return true
      try { await this.$confirm('任务配置尚未保存，放弃修改并离开？', '未保存修改', { type: 'warning' }); return true } catch (e) { return false }
    },
    async reload() { if (await this.mayLeave()) this.load() },
    async load() {
      const seq = ++this.sequence; ++this.stationSequence
      this.contentReady = false; this.versionOptions = []; this.versionFailed = false; this.versionLoading = false
      this.stationLoading = false; this.stationFailed = false; this.loading = true; this.failed = false; this.ready = false; this.canManage = false; this.baseline = null; this.form = {}; this.selected = null
      try {
        const { data } = await fetchTasks(this.projectId, this.subprojectId)
        if (seq !== this.sequence) return
        this.items = data.items; this.canManage = data.can_manage
        const row = this.taskId ? data.items.find(t => t.id === this.taskId) : null
        if (this.taskId && !row) throw new Error('任务不存在或不属于当前子项目')
        if (!this.taskId && !this.canManage) throw new Error('当前子项目不允许新建任务')
        this.selected = row
        this.form = row ? formOf(row) : { code: createBusinessCode('TSK'), name: '', station_id: null, owner_user_id: null, sop_id: null, revision_id: null, sort_order: this.items.length, status: 0, description: '' }
        this.originalStationId = row ? row.station_id : null; this.station = null
        if (this.canEdit && !row) {
          await Promise.allSettled([this.searchOwners(''), this.searchStations('')])
          if (this.form.station_id) { await this.stationChanged() }
          if (row && !this.owners.some(u => u.id === row.owner_user_id)) this.owners.push({ id: row.owner_user_id, real_name: row.owner_name || '', username: '' })
        } else if (row) {
          this.owners = [{ id: row.owner_user_id, real_name: row.owner_name || '', username: '' }]
          this.stations = row.station_id ? [{ id: row.station_id, name: row.station_name || row.station_id }] : []
        }
        if (seq !== this.sequence) return
        this.baseline = JSON.stringify(this.payload()); this.ready = true; this.configOpen = !this.taskId
        if (row) {
          const wantsEdit = this.modeOverride === null ? this.$route.query.mode === 'edit' : this.modeOverride
          if (wantsEdit && this.canEdit) await this.prepareEditor()
          else { await this.loadView(); await this.refreshVersions() }
        }
      } catch (e) { if (seq === this.sequence) { this.failed = true; this.loadMessage = e.message || '任务加载失败，请重试'; this.selected = null; this.form = {} } } finally { if (seq === this.sequence) this.loading = false }
      if (seq === this.sequence && this.ready && this.afterSaveEdit) { this.afterSaveEdit = false; this.editContent() }
    },
    async searchOwners(keyword) { const { data } = await fetchTaskOwners(this.projectId, this.subprojectId, keyword); this.owners = data },
    async searchStations(keyword) {
      const projectId = this.projectId; const sequence = this.sequence
      const { data } = await fetchProjectStations(projectId, { keyword, available: true })
      if (sequence === this.sequence && projectId === this.projectId) this.stations = data.items
    },
    async stationChanged() {
      const seq = ++this.stationSequence; this.station = null; this.stationFailed = false; this.stationLoading = !!this.form.station_id
      try { if (this.form.station_id) { const { data } = await fetchResource('station', this.form.station_id); if (seq === this.stationSequence) this.station = data } } catch (e) { if (seq === this.stationSequence) this.stationFailed = true } finally { if (seq === this.stationSequence) this.stationLoading = false }
    },
    payload() {
      const out = {}; ['id', 'code', 'name', 'station_id', 'owner_user_id', 'sort_order', 'description', 'sop_id', 'revision_id', 'version'].forEach(k => { if (this.form[k] !== undefined) out[k] = this.form[k] })
      out.station_id = out.station_id || null; out.sop_id = out.sop_id || null; out.revision_id = out.revision_id || null; return out
    },
    async save(editAfter = false) {
      if (typeof editAfter !== 'boolean') editAfter = false
      if (this.busy || !this.canEdit) return
      if (!this.form.name.trim() || !this.form.owner_user_id) return this.$message.warning('请填写任务名称和负责人')
      if (!this.form.station_id) return this.$message.warning('请选择工位')
      if (this.stationLoading || this.stationFailed) return this.$message.warning('请等待工位设备加载成功后再保存')
      this.busy = true
      try {
        if (this.form.id && this.form.station_id !== this.originalStationId) await this.$confirm('确认切换任务工位？系统会重新校验硬件要求，请复核新工位画面及标注。', '切换工位', { type: 'warning' })
        const { data } = await saveTask(this.projectId, this.subprojectId, this.payload())
        this.selected = data; this.form = formOf(data); this.originalStationId = data.station_id; this.baseline = JSON.stringify(this.payload()); this.afterSaveEdit = false; this.settingsOpen = false; if (editAfter) this.modeOverride = true
        this.$message.success('任务已保存'); this.busy = false
        if (!this.taskId) await this.$router.replace({ path: this.taskPath(data.id), query: editAfter ? { mode: 'edit' } : {}}); else await this.load()
      } catch (e) { this.afterSaveEdit = false } finally { this.busy = false }
    },
    async resolveEditor() {
      const editor = this.$refs.authoring
      if (!editor) return true
      if (editor.busy) return false
      return editor.resolvePending()
    },
    async openSettings() {
      if (this.busy || !(await this.resolveEditor())) return
      if (this.canEdit) { await Promise.allSettled([this.searchOwners(''), this.searchStations('')]); await this.stationChanged(); if (!this.owners.some(u => u.id === this.form.owner_user_id)) this.owners.push({ id: this.form.owner_user_id, real_name: this.selected.owner_name || '', username: '' }) }
      this.settingsOpen = true
    },
    async closeSettings() {
      if (this.busy) return
      if (this.dirty) {
        try { await this.$confirm('放弃尚未保存的任务设置？', '关闭设置', { type: 'warning' }) } catch (e) { return }
        this.form = formOf(this.selected); this.baseline = JSON.stringify(this.payload())
      }
      this.settingsOpen = false
    },
    async loadView() {
      this.editMode = false
      this.previewRevision = { id: '', title: this.form.name, status: 0, revision_no: 0, version: 0, steps: [] }
      this.editorSopId = ''; this.editorRevisionId = ''; this.imageMode = 'task'
      if (this.selected.revision_id) {
        const { data } = await previewTask(this.projectId, this.subprojectId, this.selected.id)
        this.previewRevision = data; this.editorSopId = this.selected.sop_id; this.editorRevisionId = this.selected.revision_id
      } else if (this.canEdit && this.selected.content_draft_id) {
        const { data } = await fetchSopVersion(this.selected.content_sop_id, this.selected.content_draft_id)
        this.previewRevision = data; this.editorSopId = this.selected.content_sop_id; this.editorRevisionId = this.selected.content_draft_id; this.imageMode = 'source'
      }
      this.contentReady = true
    },
    async prepareEditor() {
      if (!this.contentCode) this.contentCode = createBusinessCode('SOP')
      const { data } = await prepareTaskContent(this.projectId, this.subprojectId, this.form.id, { code: this.contentCode, version: this.form.version })
      this.selected = data.task; this.form = formOf(data.task); this.baseline = JSON.stringify(this.payload())
      this.editorSopId = data.sop_id; this.editorRevisionId = data.revision_id; this.previewRevision = null; this.editMode = true; this.imageMode = 'source'; this.contentReady = true
      await this.refreshVersions()
    },
    async editContent() {
      if (this.busy || !this.canEdit || !(await this.resolveEditor())) return
      if (!this.form.id || this.dirty) { await this.save(true); return }
      this.busy = true
      try { this.modeOverride = true; await this.prepareEditor() } catch (e) { /* keep current workspace on failure */ } finally { this.busy = false }
    },
    async enterView() {
      if (this.busy || !(await this.resolveEditor())) return
      if (this.$route.query.mode === 'edit') { this.modeOverride = false; await this.$router.replace({ path: this.taskPath(this.taskId), query: { mode: 'view' }}); return }
      this.busy = true
      try { this.modeOverride = false; await this.loadView() } catch (e) { /* request reports */ } finally { this.busy = false }
    },
    async published() { this.modeOverride = false; if (this.$route.query.mode === 'edit') await this.$router.replace({ path: this.taskPath(this.taskId), query: { mode: 'view' }}); else await this.load() },
    taskPath(id) { return `/project/${this.projectId}/subproject/${this.subprojectId}/task/${id}` },
    back() { this.$router.push(`/project/${this.projectId}/subproject/${this.subprojectId}`) }
  }
}
