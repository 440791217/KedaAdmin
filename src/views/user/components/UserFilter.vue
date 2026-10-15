
<template>
  <div class="filter-container">
    <el-input
      v-model="query.username"
      placeholder="登录账号"
      clearable
      class="filter-username"
      @keyup.enter.native="$emit('search')"
    />

    <el-input
      v-model="query.real_name"
      placeholder="真实姓名"
      clearable
      class="filter-standard"
      @keyup.enter.native="$emit('search')"
    />

    <el-input
      v-model="query.card_number"
      placeholder="工卡/RFID"
      clearable
      class="filter-card"
      @keyup.enter.native="$emit('search')"
    />

    <el-select
      v-model="query.shift_group"
      placeholder="所属班组"
      clearable
      class="filter-standard"
    >
      <el-option
        v-for="item in shiftGroups"
        :key="item"
        :label="item"
        :value="item"
      />
    </el-select>

    <el-select
      v-model="query.status"
      placeholder="账号状态"
      clearable
      class="filter-status"
    >
      <el-option label="正常" :value="1" />
      <el-option label="禁用" :value="0" />
      <el-option label="离职" :value="2" />
    </el-select>

    <el-button
      type="primary"
      icon="el-icon-search"
      @click="$emit('search')"
    >
      查询
    </el-button>

    <el-button
      type="success"
      icon="el-icon-plus"
      @click="$emit('create')"
    >
      新建用户
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'UserFilter',

  props: {
    query: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      shiftGroups: [
        '一班组',
        '二班组',
        '三班组',
        '维修班组'
      ]
    }
  }
}
</script>

<style lang="scss" scoped src="../styles/user-filter.scss"></style>
