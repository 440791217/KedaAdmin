<template>
  <el-dialog
    :title="step ? '编辑步骤' : '新增步骤'"
    :visible="visible"
    width="650px"
    :close-on-click-modal="false"
    :show-close="!busy"
    :close-on-press-escape="!busy"
    @open="init"
    @update:visible="close"
  ><el-form
    ref="form"
    :model="form"
    label-width="100px"
    :disabled="busy"
  ><el-form-item
    label="步骤名称"
    prop="title"
    :rules="[{ required: true, whitespace: true, message: '请输入步骤名称' }]"
  ><el-input v-model="form.title" maxlength="128" /></el-form-item><el-form-item
    label="操作说明"
    prop="instruction"
    :rules="[{ required: true, whitespace: true, message: '请输入操作说明' }]"
  ><el-input v-model="form.instruction" type="textarea" :rows="5" maxlength="10000" /></el-form-item><el-form-item
    label="注意事项"
  ><el-input v-model="form.precautions" type="textarea" maxlength="5000" /></el-form-item><el-form-item
    label="检查要求"
  ><el-input v-model="form.check_requirements" type="textarea" maxlength="5000" /></el-form-item><el-form-item
    label="参考时长"
  ><el-input-number
    v-model="form.expected_duration_seconds"
    :min="0"
    :max="99999999.99"
    :precision="2"
  />
    秒（可留空）</el-form-item></el-form><span
    slot="footer"
  ><el-button :disabled="busy" @click="close(false)">取消</el-button><el-button type="primary" :loading="busy" @click="save">保存步骤</el-button></span></el-dialog>
</template>
<script src="../js/step_form.js" />
