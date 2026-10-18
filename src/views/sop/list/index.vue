<template>
  <div class="app-container">
    <div class="sop-toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="SOP编号 / 名称"
        clearable
        @keyup.enter.native="search"
      /><el-button type="primary" icon="el-icon-search" @click="search">查询</el-button><el-button @click="load">刷新</el-button>
    </div>
    <el-alert
      v-if="failed"
      class="sop-error"
      title="SOP加载失败，请刷新重试"
      type="error"
      :closable="false"
    />
    <el-table v-loading="loading" :data="items" border>
      <el-table-column prop="code" label="编号" min-width="140" /><el-table-column
        label="名称"
        min-width="200"
      ><template
        slot-scope="{ row }"
      ><el-link type="primary" @click="$router.push(`/sop/${row.id}`)">{{ row.name }}</el-link></template></el-table-column>
      <el-table-column prop="managing_project_name" label="管理项目" min-width="170" /><el-table-column
        prop="owner_name"
        label="负责人"
        width="110"
      />
      <el-table-column
        label="最新发布"
        width="110"
      ><template slot-scope="{ row }">{{
        row.latest_published_no ? 'V' + row.latest_published_no : '尚未发布'
      }}</template></el-table-column><el-table-column
        label="草稿"
        width="90"
      ><template
        slot-scope="{ row }"
      ><el-tag v-if="row.draft_count" type="info">有草稿</el-tag><span v-else>-</span></template></el-table-column>
      <el-table-column
        label="操作"
        width="120"
        align="center"
      ><template
        slot-scope="{ row }"
      ><el-dropdown
        @command="command($event, row)"
      ><el-button
        type="primary"
        plain
        size="mini"
        :disabled="busy"
      >编辑<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu
        slot="dropdown"
      ><el-dropdown-item command="view">资料 / 版本</el-dropdown-item><el-dropdown-item
        v-if="row.can_delete"
        command="delete"
      ><span class="sop-danger">删除</span></el-dropdown-item></el-dropdown-menu></el-dropdown></template></el-table-column>
    </el-table>
    <pagination
      v-show="total"
      :total="total"
      :page.sync="query.page"
      :limit.sync="query.limit"
      @pagination="load"
    />
  </div>
</template>
<script src="./js/sop_list.js" />
<style scoped src="./styles/index.scss" lang="scss" />
