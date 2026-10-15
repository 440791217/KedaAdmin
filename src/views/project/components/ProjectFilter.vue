
<template>
  <div class="filter-container">
    <el-input
      v-model="query.project_id"
      placeholder="项目编号"
      clearable
      class="filter-item"
      style="width: 140px; margin-right: 10px;"
      @keyup.enter.native="$emit('search')"
    />

    <el-input
      v-model="query.project_name"
      placeholder="项目名"
      clearable
      class="filter-item"
      style="width: 180px; margin-right: 10px;"
      @keyup.enter.native="$emit('search')"
    />

    <el-input
      v-model="query.manager_name"
      placeholder="管理者姓名"
      clearable
      class="filter-item"
      style="width: 130px; margin-right: 10px;"
      @keyup.enter.native="$emit('search')"
    />

    <el-input
      v-model="query.job_num"
      placeholder="工号"
      clearable
      class="filter-item"
      style="width: 120px; margin-right: 10px;"
      @keyup.enter.native="$emit('search')"
    />

    <el-select
      v-model="query.status"
      placeholder="项目状态"
      clearable
      class="filter-item"
      style="width: 120px; margin-right: 10px;"
    >
      <el-option
        label="进行中"
        :value="1"
      />

      <el-option
        label="已暂停"
        :value="0"
      />

      <el-option
        label="已归档"
        :value="2"
      />
    </el-select>

    <el-button
      type="primary"
      icon="el-icon-search"
      class="filter-item"
      @click="$emit('search')"
    >
      查询
    </el-button>

    <el-button
      type="success"
      icon="el-icon-plus"
      class="filter-item"
      @click="$emit('create')"
    >
      新建项目
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'ProjectFilter',

  props: {
    query: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
</style>
