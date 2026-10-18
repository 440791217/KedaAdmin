
<template>
  <div class="app-container">
    <el-alert v-if="!can('user:list')" title="你没有查看用户管理的权限" type="warning" :closable="false" />
    <template v-else>
      <user-filter
        :query="listQuery"
        :teams="teams"
        :can-create="can('user:create')"
        @search="handleFilter"
        @create="handleCreate"
      />

      <user-table
        :list="list"
        :loading="listLoading"
        :page="listQuery.page"
        :limit="listQuery.limit"
        :permissions="permissions"
        :current-user-id="currentUserId"
        :busy-id="busyId"
        @edit="handleEdit"
        @status-change="handleStatusChange"
        @delete="handleDelete"
        @reset-password="handleResetPassword"
      />

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        @pagination="getList"
      />

      <user-dialog
        :visible.sync="dialogFormVisible"
        :user="currentUser"
        :teams="teams"
        :roles="roles"
        :permissions="permissions"
        :current-user-id="currentUserId"
        @success="handleSaveSuccess"
        @refresh="getList"
      />
    </template>
  </div>
</template>

<script src="./js/user_management.js"></script>
