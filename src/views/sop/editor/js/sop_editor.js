import ProtectedImage from '@/shared/sop/components/ProtectedImage.vue'
import StepForm from '@/views/sop/editor/components/StepForm.vue'
import {
  fetchSop,
  fetchSopVersion,
  saveSopVersion,
  addSopStep,
  editSopStep,
  deleteSopStep,
  sortSopSteps,
  uploadSopImage,
  removeSopImage,
  publishSopVersion
} from '@/api/sop'
const fields = (revision) => ({
  title: revision.title || '',
  applicable_scope: revision.applicable_scope || '',
  purpose: revision.purpose || '',
  precautions: revision.precautions || '',
  revision_note: revision.revision_note || ''
})
export default {
  name: 'SopEditor',
  components: { ProtectedImage, StepForm },
  data() {
    return {
      document: null,
      revision: null,
      header: {},
      baseline: '',
      loading: false,
      failed: false,
      busy: false,
      sequence: 0,
      stepDialog: false,
      selectedStep: null
    }
  },
  computed: {
    sopId() {
      return this.$route.params.sopId
    },
    revisionId() {
      return this.$route.params.revisionId
    },
    editable() {
      return !!this.document && this.document.can_edit && !!this.revision && this.revision.status === 0
    },
    dirty() {
      return !!this.revision && JSON.stringify(this.header) !== this.baseline
    }
  },
  created() {
    this.load()
  },
  beforeDestroy() {
    ++this.sequence
  },
  beforeRouteLeave(to, from, next) {
    if (this.busy) {
      this.$message.error('正在保存，请稍候')
      return next(false)
    }
    if (!this.dirty) return next()
    this.$confirm('有未保存的草稿资料，确认离开？', '未保存修改', { type: 'warning' })
      .then(() => next())
      .catch(() => next(false))
  },
  beforeRouteUpdate(to, from, next) {
    if (this.busy) {
      this.$message.error('正在保存，请稍候')
      return next(false)
    }
    if (!this.dirty) {
      next()
      this.$nextTick(() => this.load())
      return
    }
    this.$confirm('有未保存修改，确认切换？', '未保存修改')
      .then(() => {
        next()
        this.$nextTick(() => this.load())
      })
      .catch(() => next(false))
  },
  methods: {
    accept(revision) {
      this.revision = revision
      this.header = fields(revision)
      this.baseline = JSON.stringify(this.header)
    },
    async load() {
      const seq = ++this.sequence
      const id = this.sopId
      const rid = this.revisionId
      this.loading = true
      this.failed = false
      try {
        const [d, v] = await Promise.all([fetchSop(id), fetchSopVersion(id, rid)])
        if (seq === this.sequence) {
          this.document = d.data
          this.accept(v.data)
        }
      } catch (error) {
        if (seq === this.sequence) {
          this.document = null
          this.revision = null
          this.failed = true
        }
      } finally {
        if (seq === this.sequence) this.loading = false
      }
    },
    async reload() {
      if (this.dirty) {
        try {
          await this.$confirm('刷新将放弃未保存的资料，继续？', '刷新确认')
        } catch (error) {
          return
        }
      }
      await this.load()
    },
    async saveHeader() {
      if (this.busy || !this.editable) return
      this.busy = true
      try {
        if (!(await this.$refs.header.validate().catch(() => false))) return
        const { data } = await saveSopVersion(this.sopId, this.revisionId, {
          ...this.header,
          version: this.revision.version
        })
        this.accept(data)
        this.$message.success('草稿已保存')
      } catch (error) {
        if (error.code === 409) await this.load()
      } finally {
        this.busy = false
      }
    },
    openStep(step) {
      this.selectedStep = step
      this.stepDialog = true
    },
    async saveStep(form) {
      if (this.busy || this.dirty || !this.editable) return
      this.busy = true
      try {
        const response = this.selectedStep
          ? await editSopStep(this.sopId, this.revisionId, this.selectedStep.id, {
            ...form,
            version: this.selectedStep.version,
            revision_version: this.revision.version
          })
          : await addSopStep(this.sopId, this.revisionId, { ...form, version: this.revision.version })
        this.accept(response.data)
        this.stepDialog = false
        this.$message.success('步骤已保存')
      } catch (error) {
        if (error.code === 409) {
          this.stepDialog = false
          await this.load()
        }
      } finally {
        this.busy = false
      }
    },
    async perform(operation, success) {
      if (this.busy || this.dirty || !this.editable) return
      this.busy = true
      try {
        const { data } = await operation()
        this.accept(data)
        this.$message.success(success)
      } catch (error) {
        if (error.code === 409) await this.load()
      } finally {
        this.busy = false
      }
    },
    async removeStep(step) {
      try {
        await this.$confirm(`删除步骤“${step.title}”？`, '删除确认', { type: 'warning' })
      } catch (error) {
        return
      }
      await this.perform(
        () => deleteSopStep(this.sopId, this.revisionId, step.id, step.version, this.revision.version),
        '步骤已删除'
      )
    },
    async move(index, direction) {
      const ids = this.revision.steps.map((step) => step.id)
      const target = index + direction
      if (target < 0 || target >= ids.length) return
      ;[ids[index], ids[target]] = [ids[target], ids[index]]
      await this.perform(
        () => sortSopSteps(this.sopId, this.revisionId, ids, this.revision.version),
        '顺序已保存'
      )
    },
    async upload(step, request) {
      if (this.busy || this.dirty || !this.editable) {
        if (request.onError) request.onError(new Error('请先完成当前编辑'))
        return
      }
      if (request.file.size > 5 * 1024 * 1024) {
        this.$message.error('图片不能超过5MiB')
        if (request.onError) request.onError(new Error('图片过大'))
        return
      }
      this.busy = true
      try {
        const { data } = await uploadSopImage(
          this.sopId,
          this.revisionId,
          step.id,
          request.file,
          this.revision.version
        )
        this.accept(data)
        if (request.onSuccess) request.onSuccess(data)
        this.$message.success('图片已保存')
      } catch (error) {
        if (request.onError) request.onError(error)
        if (error.code === 409) await this.load()
      } finally {
        this.busy = false
      }
    },
    async removeImage(step, image) {
      try {
        await this.$confirm('移除此草稿的图片引用？已发布版本不受影响。', '移除图片')
      } catch (error) {
        return
      }
      await this.perform(
        () => removeSopImage(this.sopId, this.revisionId, step.id, image.id, this.revision.version),
        '图片已移除'
      )
    },
    async publish() {
      if (this.busy || this.dirty || !this.editable) return
      try {
        await this.$confirm('确认发布此版本？发布后图文内容不可修改。', '发布确认', { type: 'warning' })
      } catch (error) {
        return
      }
      await this.perform(
        () => publishSopVersion(this.sopId, this.revisionId, this.revision.version),
        '版本已发布'
      )
    }
  }
}
