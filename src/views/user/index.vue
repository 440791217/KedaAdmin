
<template>
  <div class="app-container">
    <user-filter
      :query="listQuery"
      @search="handleFilter"
      @create="handleCreate"
    />

    <user-table
      :list="list"
      :loading="listLoading"
      :page="listQuery.page"
      :limit="listQuery.limit"
      @edit="handleEdit"
      @status-change="handleStatusChange"
      @delete="handleDelete"
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
      @success="handleSaveSuccess"
    />
  </div>
</template>

<script src="./js/user-management.js"></script>
