
<template>
  <el-table
    v-loading="loading"
    :data="list"
    border
    fit
    highlight-current-row
    class="user-table"
  >
    <el-table-column
      label="序号"
      width="70"
      align="center"
    >
      <template slot-scope="scope">
        {{ (page - 1) * limit + scope.$index + 1 }}
      </template>
    </el-table-column>

    <el-table-column
      label="用户"
      min-width="190"
    >
      <template slot-scope="scope">
        <div class="user-info">
          <el-avatar
            :size="42"
            :src="scope.row.avatar_url"
            icon="el-icon-user-solid"
          />

          <div class="user-info-text">
            <div class="real-name">
              {{ scope.row.real_name }}
            </div>

            <div class="username">
              {{ scope.row.username }}
            </div>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="工卡/RFID"
      width="170"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          v-if="scope.row.card_number"
          type="warning"
          effect="light"
        >
          {{ scope.row.card_number }}
        </el-tag>

        <span v-else class="empty-text">
          未绑定
        </span>
      </template>
    </el-table-column>

    <el-table-column
      label="所属班组"
      width="130"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          v-if="scope.row.shift_group"
          type="info"
          effect="plain"
        >
          {{ scope.row.shift_group }}
        </el-tag>

        <span v-else class="empty-text">
          未设置
        </span>
      </template>
    </el-table-column>

    <el-table-column
      prop="phone"
      label="联系电话"
      width="140"
      align="center"
    >
      <template slot-scope="scope">
        {{ scope.row.phone || '-' }}
      </template>
    </el-table-column>

    <el-table-column
      label="账号状态"
      width="100"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          :type="statusType(scope.row.status)"
          size="small"
        >
          {{ statusText(scope.row.status) }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column
      label="创建时间"
      width="125"
      align="center"
    >
      <template slot-scope="scope">
        <div class="time-column-wrap">
          <span class="time-date">
            {{ scope.row.created_at | parseTime('{y}-{m}-{d}') }}
          </span>

          <span class="time-clock">
            {{ scope.row.created_at | parseTime('{h}:{i}:{s}') }}
          </span>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="最近修改"
      width="125"
      align="center"
    >
      <template slot-scope="scope">
        <div class="time-column-wrap">
          <span class="time-date">
            {{ scope.row.updated_at | parseTime('{y}-{m}-{d}') }}
          </span>

          <span class="time-clock">
            {{ scope.row.updated_at | parseTime('{h}:{i}:{s}') }}
          </span>
        </div>
      </template>
    </el-table-column>

    <el-table-column
      label="操作"
      width="150"
      align="center"
      fixed="right"
    >
      <template slot-scope="scope">
        <div class="operation-wrapper">
          <el-button
            type="primary"
            size="mini"
            icon="el-icon-edit-outline"
            class="op-btn"
            @click="$emit('edit', scope.row)"
          >
            查看/编辑
          </el-button>

          <el-button
            v-if="scope.row.status === 1"
            type="warning"
            size="mini"
            icon="el-icon-lock"
            class="op-btn"
            @click="$emit('status-change', scope.row, 0)"
          >
            禁用
          </el-button>

          <el-button
            v-else-if="scope.row.status === 0"
            type="success"
            size="mini"
            icon="el-icon-unlock"
            class="op-btn"
            @click="$emit('status-change', scope.row, 1)"
          >
            启用
          </el-button>

          <el-button
            type="danger"
            size="mini"
            icon="el-icon-delete"
            class="op-btn"
            @click="$emit('delete', scope.row)"
          >
            删除
          </el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
export default {
  name: 'UserTable',

  props: {
    list: {
      type: Array,
      required: true
    },

    loading: {
      type: Boolean,
      default: false
    },

    page: {
      type: Number,
      default: 1
    },

    limit: {
      type: Number,
      default: 10
    }
  },

  methods: {
    statusType(status) {
      const types = {
        0: 'danger',
        1: 'success',
        2: 'info'
      }

      return types[status] || 'info'
    },

    statusText(status) {
      const texts = {
        0: '禁用',
        1: '正常',
        2: '离职'
      }

      return texts[status] || '未知'
    }
  }
}
</script>

<style lang="scss" scoped src="../styles/user-table.scss"></style>
