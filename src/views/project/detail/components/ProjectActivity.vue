<template>
  <div v-loading="loading">
    <div class="project-toolbar"><el-button icon="el-icon-refresh" @click="load">刷新记录</el-button></div>
    <el-alert v-if="failed" title="操作记录加载失败，请重试" type="error" :closable="false" />
    <el-table :data="items" border>
      <el-table-column label="时间" width="170"><template slot-scope="{row}">{{ row.created_at | parseTime('{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
      <el-table-column prop="actor_name" label="操作者" width="110" />
      <el-table-column label="操作" width="160"><template slot-scope="{row}">{{ labels[row.action] || row.action }}</template></el-table-column>
      <el-table-column prop="target_name" label="目标用户" width="110" />
      <el-table-column label="范围" width="140"><template slot-scope="{row}">{{ row.subproject_id ? '子项目 #' + row.subproject_id : '主项目' }}</template></el-table-column>
      <el-table-column prop="before_value" label="变更前" min-width="170" />
      <el-table-column prop="after_value" label="变更后" min-width="170" />
    </el-table>
    <pagination v-show="total" :total="total" :page.sync="query.page" :limit.sync="query.limit" @pagination="load" />
  </div>
</template>
<script src="../js/project_activity.js" />
<style scoped src="@/shared/project/styles/project.scss" lang="scss" />
