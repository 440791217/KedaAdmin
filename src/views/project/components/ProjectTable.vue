
<template>
  <el-table
    v-loading="loading"
    :data="list"
    border
    fit
    highlight-current-row
    style="width: 100%;"
    @sort-change="$emit('sort-change', $event)"
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
      label="项目编号"
      width="150"
      align="center"
    >
      <template slot-scope="scope">
        <span class="project-id">
          {{ scope.row.project_id }}
        </span>
      </template>
    </el-table-column>

    <el-table-column
      label="项目名称"
      min-width="200"
    >
      <template slot-scope="scope">
        <span class="project-name">
          {{ scope.row.project_name }}
        </span>
      </template>
    </el-table-column>

    <el-table-column
      label="负责人工号"
      width="110"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          type="warning"
          size="medium"
          effect="light"
        >
          {{ scope.row.job_num }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column
      prop="manager_name"
      label="管理者"
      width="110"
      align="center"
    />

    <el-table-column
      label="分总成数量"
      width="110"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          type="info"
          effect="plain"
        >
          {{ scope.row.sub_assembly_count }} 个
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column
      label="状态"
      width="90"
      align="center"
    >
      <template slot-scope="scope">
        <el-tag
          :type="getStatusType(scope.row.status)"
          size="small"
          effect="dark"
        >
          {{ getStatusText(scope.row.status) }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column
      label="项目描述"
      prop="description"
      min-width="180"
      show-overflow-tooltip
    >
      <template slot-scope="scope">
        {{ scope.row.description || '-' }}
      </template>
    </el-table-column>

    <el-table-column
      label="创建时间"
      prop="created_at"
      width="160"
      align="center"
      sortable="custom"
    >
      <template slot-scope="scope">
        {{ scope.row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}
      </template>
    </el-table-column>

    <el-table-column
      label="最近修改时间"
      prop="updated_at"
      width="160"
      align="center"
      sortable="custom"
    >
      <template slot-scope="scope">
        {{ scope.row.updated_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}
      </template>
    </el-table-column>

    <el-table-column
      label="操作"
      width="130"
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
  name: 'ProjectTable',

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
      default: 20
    }
  },

  methods: {
    getStatusType(status) {
      const statusMap = {
        1: 'success',
        0: 'warning',
        2: 'info'
      }

      return statusMap[status] || 'info'
    },

    getStatusText(status) {
      const statusMap = {
        1: '进行中',
        0: '已暂停',
        2: '已归档'
      }

      return statusMap[status] || '未知'
    }
  }
}
</script>

<style scoped>
.project-id {
  font-family: monospace;
  font-weight: bold;
  color: #1890ff;
}

.project-name {
  font-weight: bold;
  color: #303133;
}

.operation-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.op-btn {
  width: 100px;
  margin-left: 0 !important;
}
</style>
