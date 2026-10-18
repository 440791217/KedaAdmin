
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
      label="角色"
      min-width="140"
    >
      <template slot-scope="scope">
        <el-tag v-if="scope.row.is_superuser" type="danger">超级用户</el-tag>
        <template v-else>
          <el-tag v-for="role in scope.row.roles" :key="role.id" size="small">{{ role.name }}</el-tag>
          <span v-if="!scope.row.roles.length" class="empty-text">未分配</span>
        </template>
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
      width="160"
      align="center"
      fixed="right"
    >
      <template slot-scope="scope">
        <div class="operation-wrapper">
          <span v-if="scope.row.is_superuser" class="protected-label">
            <i class="el-icon-lock" />系统保护
          </span>
          <template v-else>
            <el-dropdown
              v-if="actions(scope.row).length"
              trigger="click"
              placement="bottom-end"
              :disabled="Boolean(busyId)"
              @command="handleCommand($event, scope.row)"
            >
              <el-button type="primary" plain size="mini" icon="el-icon-edit-outline" class="edit-action" :disabled="Boolean(busyId)">
                编辑<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown" class="user-action-menu">
                <el-dropdown-item
                  v-for="action in actions(scope.row)"
                  :key="action.command"
                  :command="action.command"
                  :icon="action.icon"
                  :divided="action.danger && actions(scope.row).length > 1"
                  :class="{ 'danger-action': action.danger }"
                >{{ action.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <span v-if="!actions(scope.row).length" class="empty-text">—</span>
          </template>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script src="../js/user_table.js"></script>

<style lang="scss" scoped src="../styles/user-table.scss"></style>
