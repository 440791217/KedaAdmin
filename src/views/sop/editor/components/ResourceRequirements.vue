<template>
  <div>
    <el-form-item
      label="作业位置 / 环境要求"
    ><el-input
      :value="value.workplace_requirements"
      type="textarea"
      maxlength="2000"
      :disabled="disabled"
      @input="environment"
    /></el-form-item>
    <div>
      <strong>工具与设备要求</strong>
      <div
        v-for="(item, index) in value.items"
        :key="item.model_id"
        class="requirement"
      >
        <span>{{ item.name }} {{ item.specification }}（{{ item.unit }}）</span><el-input-number
          :value="item.quantity"
          :min="1"
          :max="9999"
          :disabled="disabled"
          @change="change(index, 'quantity', $event)"
        /><el-input
          :value="item.description"
          placeholder="用途或特殊要求"
          maxlength="2000"
          :disabled="disabled"
          @input="change(index, 'description', $event)"
        /><el-button
          v-if="!disabled"
          type="text"
          @click="remove(index)"
        >移除</el-button>
      </div>
      <el-select
        v-if="!disabled"
        v-model="selected"
        remote
        filterable
        :remote-method="search"
        :loading="loading"
        :placeholder="stationId ? '搜索当前工位硬件并添加要求' : '搜索规格并添加要求'"
        @visible-change="opened"
        @change="add"
      ><el-option
        v-for="m in options"
        :key="m.id"
        :value="m.id"
        :label="m.name + ' ' + (m.specification || '')"
        :disabled="value.items.some((i) => i.model_id === m.id)"
      /></el-select>
      <p class="requirement-note">
        {{ stationId ? '选项来自当前工位的可用硬件，按规格保存要求，便于备用工位替换。' : '要求随SOP版本冻结；不需要工具设备的步骤可留空。' }}
      </p>
    </div>
  </div>
</template>
<script src="../js/resource_requirements.js" />
<style scoped>
.requirement {
  display: grid;
  gap: 8px;
  margin: 12px 0;
  padding: 12px;
  background: #f5f7fa;
}
.requirement-note {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
.el-select {
  width: 100%;
}
</style>
