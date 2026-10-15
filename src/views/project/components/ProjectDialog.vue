
<template>
  <el-dialog
    :title="isCreate ? '新建项目' : '编辑项目'"
    :visible="visible"
    width="550px"
    @update:visible="$emit('update:visible', $event)"
    @open="initForm"
    @close="handleClose"
  >
    <el-form
      ref="dataForm"
      :model="tempForm"
      :rules="rules"
      label-position="left"
      label-width="100px"
    >
      <el-form-item
        label="项目编号"
        prop="project_id"
      >
        <el-input
          v-model="tempForm.project_id"
          placeholder="如: PRJ-2026-A101"
        />
      </el-form-item>

      <el-form-item
        label="项目名称"
        prop="project_name"
      >
        <el-input
          v-model="tempForm.project_name"
          placeholder="请输入项目名称"
        />
      </el-form-item>

      <el-form-item
        label="负责人工号"
        prop="job_num"
      >
        <el-input
          v-model="tempForm.job_num"
          placeholder="请输入负责人工号"
        />
      </el-form-item>

      <el-form-item
        label="管理者姓名"
        prop="manager_name"
      >
        <el-input
          v-model="tempForm.manager_name"
          placeholder="请输入管理者姓名"
        />
      </el-form-item>

      <el-form-item
        label="项目状态"
        prop="status"
      >
        <el-radio-group v-model="tempForm.status">
          <el-radio-button :label="1">
            进行中
          </el-radio-button>

          <el-radio-button :label="0">
            已暂停
          </el-radio-button>

          <el-radio-button :label="2">
            已归档
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        label="项目描述"
        prop="description"
      >
        <el-input
          v-model="tempForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入项目描述"
        />
      </el-form-item>
    </el-form>

    <div
      slot="footer"
      class="dialog-footer"
    >
      <el-button
        :disabled="submitting"
        @click="$emit('update:visible', false)"
      >
        取消
      </el-button>

      <el-button
        type="primary"
        :loading="submitting"
        @click="submitForm"
      >
        {{ isCreate ? '确认创建' : '保存修改' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  createProject as createProjectApi,
  updateProject as updateProjectApi
} from '@/api/project'

import {
  createDefaultProjectForm,
  projectRules,
  createProjectPayload
} from '../project_form'

export default {
  name: 'ProjectDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },

    project: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      tempForm: createDefaultProjectForm(),
      rules: projectRules,
      submitting: false
    }
  },

  computed: {
    isCreate() {
      return !this.project
    }
  },

  methods: {
    initForm() {
      this.tempForm = {
        ...createDefaultProjectForm(),
        ...(this.project || {})
      }

      this.$nextTick(() => {
        if (this.$refs.dataForm) {
          this.$refs.dataForm.clearValidate()
        }
      })
    },

    handleClose() {
      this.tempForm = createDefaultProjectForm()
      this.submitting = false
    },

    submitForm() {
      if (this.submitting) {
        return
      }

      this.$refs.dataForm.validate(async valid => {
        if (!valid) {
          return
        }

        this.submitting = true
        const operation = this.isCreate ? 'create' : 'update'

        try {
          const payload = createProjectPayload(this.tempForm)

          if (operation === 'create') {
            await createProjectApi(payload)
            this.$message.success('项目创建成功')
          } else {
            await updateProjectApi(this.project.id, payload)
            this.$message.success('项目修改成功')
          }

          this.$emit('success', operation)
          this.$emit('update:visible', false)
        } catch (error) {
          console.error('项目保存失败:', error)
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>
