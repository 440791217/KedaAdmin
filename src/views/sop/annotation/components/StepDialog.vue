
<template>
  <el-dialog
    :title="isCreate ? '新增SOP步骤' : '编辑SOP步骤'"
    :visible="visible"
    custom-class="sop-step-dialog"
    width="640px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <el-form
      ref="stepForm"
      :model="form"
      :rules="stepRules"
      label-width="90px"
    >
      <el-form-item
        label="步骤名称"
        prop="name"
      >
        <el-input
          v-model="form.name"
          maxlength="50"
          show-word-limit
          placeholder="请输入步骤名称"
        />
      </el-form-item>

      <el-form-item
        label="步骤描述"
        prop="desc"
      >
        <el-input
          v-model="form.desc"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请输入步骤描述"
        />
      </el-form-item>
      <el-form-item label="等待时间" prop="waitTime">
        <el-input-number v-model="form.waitTime" :min="0" :max="3600" :precision="1" :step="1" />
        <span class="step-unit">秒</span>
        <div class="step-form-hint">进入步骤后等待指定时间再开始检测，0表示立即检测。</div>
      </el-form-item>

      <el-form-item label="语音提示">
        <el-switch v-model="form.voiceEnabled" active-text="启用" />
      </el-form-item>
      <el-form-item v-if="form.voiceEnabled" label="提示内容" prop="voiceText">
        <el-input v-model="form.voiceText" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入进入步骤时播报的内容" />
        <el-button type="text" icon="el-icon-video-play" :disabled="!form.voiceText.trim()" @click="previewVoice">试听语音</el-button>
      </el-form-item>

      <el-form-item label="文字引导" prop="textGuide">
        <el-input v-model="form.textGuide" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入操作方法、注意事项等引导文字（选填）" />
      </el-form-item>

      <el-form-item label="图片引导">
        <el-upload action="#" accept="image/png,image/jpeg,image/webp" :auto-upload="false" :show-file-list="false" :on-change="handleImageChange" :disabled="imageLoading">
          <el-button size="small" :loading="imageLoading">{{ form.imageGuide ? '更换图片' : '选择图片' }}</el-button>
        </el-upload>
        <div class="step-form-hint">支持 JPG、PNG、WebP，最大5MB。</div>
        <div v-if="form.imageGuide" class="step-guide-image">
          <el-image :src="form.imageGuide" fit="contain" :preview-src-list="[form.imageGuide]" />
          <el-button type="text" @click="removeImage">移除图片</el-button>
        </div>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">
        取消
      </el-button>

      <el-button
        type="primary"
        @click="submitForm"
      >
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  createDefaultStep,
  stepRules
} from '../js/step'

export default {
  name: 'StepDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },

    step: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      form: createDefaultStep(),
      imageLoading: false,
      imageReadId: 0,
      stepRules
    }
  },

  computed: {
    isCreate() {
      return !this.step
    }
  },

  watch: {
    visible(value) {
      if (value) {
        this.initForm()
      }
    }
  },

  methods: {
    initForm() {
      if (this.step) {
        this.form = createDefaultStep({
          ...this.step
        })
      } else {
        this.form = createDefaultStep()
      }

      this.$nextTick(() => {
        if (this.$refs.stepForm) {
          this.$refs.stepForm.clearValidate()
        }
      })
    },

    handleClose() {
      this.imageReadId++
      this.imageLoading = false
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      this.$emit('update:visible', false)
    },

    removeImage() {
      this.imageReadId++
      this.imageLoading = false
      this.form.imageGuide = ''
    },

    handleImageChange(file) {
      const raw = file.raw
      if (!raw || !['image/jpeg', 'image/png', 'image/webp'].includes(raw.type) || raw.size > 5 * 1024 * 1024) {
        this.$message.warning('请选择不超过5MB的JPG、PNG或WebP图片')
        return
      }
      const readId = ++this.imageReadId
      const reader = new FileReader()
      this.imageLoading = true
      reader.onload = () => {
        if (readId !== this.imageReadId) return
        this.form.imageGuide = reader.result
        this.imageLoading = false
      }
      reader.onerror = () => {
        if (readId !== this.imageReadId) return
        this.imageLoading = false
        this.$message.error('图片读取失败，请重新选择')
      }
      reader.readAsDataURL(raw)
    },

    previewVoice() {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        this.$message.warning('当前浏览器不支持语音试听')
        return
      }
      window.speechSynthesis.cancel()
      const utterance = new window.SpeechSynthesisUtterance(this.form.voiceText.trim())
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
    },

    submitForm() {
      if (this.imageLoading) {
        this.$message.warning('请等待图片读取完成')
        return
      }
      if (this.form.voiceEnabled && !this.form.voiceText.trim()) {
        this.$message.warning('请输入语音提示内容')
        return
      }
      this.$refs.stepForm.validate(valid => {
        if (!valid) {
          return
        }

        this.$emit('save', {
          id: this.form.id,
          name: this.form.name.trim(),
          desc: this.form.desc.trim(),
          waitTime: this.form.waitTime,
          voiceEnabled: this.form.voiceEnabled,
          voiceText: this.form.voiceText.trim(),
          imageGuide: this.form.imageGuide,
          textGuide: this.form.textGuide.trim()
        })
      })
    }
  }
}
</script>
