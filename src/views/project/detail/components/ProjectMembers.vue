<template>
  <div v-loading="loading">
    <div class="project-toolbar">
      <el-input v-model="query.keyword" clearable placeholder="成员姓名 / 账号" @keyup.enter.native="search" />
      <el-select v-model="query.status" @change="search"><el-option label="有效成员" :value="1" /><el-option label="已移除成员" :value="0" /></el-select>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button v-if="project.can_manage_members" type="success" :disabled="busy" @click="open(null)">添加成员</el-button>
    </div>
    <el-alert v-if="failed" title="成员加载失败，请重新查询" type="error" :closable="false" />
    <el-table :data="items" border>
      <el-table-column prop="real_name" label="姓名" min-width="120" />
      <el-table-column prop="username" label="账号" min-width="120" />
      <el-table-column label="项目权限" width="130"><template slot-scope="{row}"><el-tag :type="row.is_owner ? 'warning' : 'info'">{{ row.is_owner ? '项目负责人' : row.access_level === 1 ? '编辑成员' : '查看成员' }}</el-tag></template></el-table-column>
      <el-table-column label="账号状态" width="110"><template slot-scope="{row}">{{ row.user_deleted_at ? '已删除' : ['禁用', '正常', '离职'][row.account_status] }}</template></el-table-column>
      <el-table-column label="功能权限" min-width="180"><template slot-scope="{row}"><el-tooltip v-if="row.missing_permissions.length" :content="'缺少：' + row.missing_permissions.join('、')"><span class="project-hint">部分操作缺少系统权限 <i class="el-icon-info" /></span></el-tooltip><span v-else>已具备常用功能权限</span></template></el-table-column>
      <el-table-column prop="owned_subprojects" label="负责子项目" width="110" align="center" />
      <el-table-column label="成员状态" width="100"><template slot-scope="{row}">{{ row.member_status === 1 ? '有效' : '已移除' }}</template></el-table-column>
      <el-table-column v-if="project.can_manage_members" label="操作" width="130" align="center"><template slot-scope="{row}">
        <el-dropdown v-if="row.can_change || row.can_remove" trigger="click" @command="command($event, row)"><el-button type="primary" plain size="mini" :disabled="busy">编辑<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu slot="dropdown"><el-dropdown-item v-if="row.can_change" command="access">修改权限</el-dropdown-item><el-dropdown-item v-if="row.can_remove" command="remove"><span class="project-danger">移除成员</span></el-dropdown-item></el-dropdown-menu></el-dropdown>
        <span v-else class="project-hint">{{ row.member_status === 0 ? '可重新添加' : '需先交接负责人' }}</span>
      </template></el-table-column>
    </el-table>
    <pagination v-show="total" :total="total" :page.sync="query.page" :limit.sync="query.limit" @pagination="load" />
    <el-dialog :title="selected ? '修改成员权限' : '添加项目成员'" :visible.sync="dialog" width="520px" :close-on-click-modal="false" :show-close="!busy" :close-on-press-escape="!busy" @close="invalidateOptions">
      <el-form ref="form" :model="form" label-width="90px" :disabled="busy">
        <el-form-item label="用户" prop="user_id" :rules="[{ required: true, message: '请选择用户' }]">
          <el-input v-if="selected" :value="`${selected.real_name}（${selected.username}）`" disabled />
          <el-select v-else v-model="form.user_id" filterable remote :remote-method="searchOptions" :loading="optionsLoading" style="width:100%" placeholder="搜索姓名或账号"><el-option v-for="user in options" :key="user.id" :value="user.id" :label="`${user.real_name}（${user.username}）`" /></el-select>
        </el-form-item>
        <el-form-item label="项目权限"><el-radio-group v-model="form.access_level"><el-radio :label="0">查看</el-radio><el-radio :label="1">编辑</el-radio></el-radio-group></el-form-item>
        <el-alert title="项目编辑权限不替代系统功能权限，缺少的角色权限需由用户管理员配置。" type="info" :closable="false" />
      </el-form>
      <span slot="footer"><el-button :disabled="busy" @click="dialog=false">取消</el-button><el-button type="primary" :loading="busy" @click="save">保存</el-button></span>
    </el-dialog>
  </div>
</template>
<script src="../js/project_members.js" />
<style scoped src="@/shared/project/styles/project.scss" lang="scss" />
