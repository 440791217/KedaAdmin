<template>
  <div class="app-container project-page">
    <div class="project-toolbar">
      <el-input v-model="query.keyword" placeholder="项目编号 / 名称" clearable @keyup.enter.native="search" />
      <el-select v-model="query.status" placeholder="项目状态" clearable><el-option v-for="(label, value) in statusLabels" :key="value" :label="label" :value="value" /></el-select>
      <el-button type="primary" icon="el-icon-search" @click="search">查询</el-button>
      <el-button icon="el-icon-refresh" @click="reset">重置</el-button>
      <el-button v-if="canCreate" type="success" icon="el-icon-plus" :disabled="busy || loading" @click="openForm(null)">新建项目</el-button>
    </div>
    <el-alert v-if="failed" class="project-error" type="error" :closable="false" title="项目加载失败，请重新查询或重试。"><el-button type="text" @click="load">重新加载</el-button></el-alert>
    <el-table v-loading="loading" :data="items" border fit>
      <el-table-column type="index" label="序号" width="65" align="center" :index="index => (query.page - 1) * query.limit + index + 1" />
      <el-table-column prop="code" label="项目编号" min-width="140" />
      <el-table-column label="项目名称" min-width="200"><template slot-scope="{row}"><el-link type="primary" @click="$router.push(`/project/${row.id}`)">{{ row.name }}</el-link></template></el-table-column>
      <el-table-column prop="customer_name" label="客户" min-width="130" />
      <el-table-column prop="owner_name" label="负责人" width="110" />
      <el-table-column prop="subproject_count" label="子项目数" width="100" align="center" />
      <el-table-column label="状态" width="100" align="center"><template slot-scope="{row}"><el-tag :type="statusTypes[row.status]">{{ statusLabels[row.status] }}</el-tag></template></el-table-column>
      <el-table-column label="创建时间" width="160"><template slot-scope="{row}">{{ row.created_at | parseTime('{y}-{m}-{d} {h}:{i}') }}</template></el-table-column>
      <el-table-column label="操作" width="130" align="center" fixed="right"><template slot-scope="{row}">
        <el-dropdown trigger="click" :disabled="busy" @command="command($event, row)"><el-button type="primary" plain size="mini" :disabled="busy">编辑<i class="el-icon-arrow-down el-icon--right" /></el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="view">子项目</el-dropdown-item>
            <el-dropdown-item v-if="row.can_edit || row.can_transfer_owner" command="edit">编辑资料</el-dropdown-item>
            <el-dropdown-item v-if="row.can_restore" command="restore">恢复归档</el-dropdown-item>
            <el-dropdown-item v-for="status in row.can_manage ? nextStatuses(row.status) : []" :key="status" :command="status">{{ status === 1 && row.status === 2 ? '重新开启' : status === 1 ? '开始项目' : status === 2 ? '完成项目' : '归档项目' }}</el-dropdown-item>
            <el-dropdown-item v-if="row.can_delete" command="delete" divided><span class="project-danger">删除项目</span></el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="query.page" :limit.sync="query.limit" @pagination="load" />
    <entity-dialog :visible.sync="dialog" :entity="selected" @saved="saved" @stale="load" @transfer-owner="transferOwner" />
    <owner-transfer v-if="ownerProject" :visible.sync="ownerDialog" :project="ownerProject" @transferred="load" @stale="load" />
  </div>
</template>
<script src="./js/project_list.js" />
<style scoped src="./styles/index.scss" lang="scss" />
