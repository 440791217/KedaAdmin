<template>
  <section v-loading="loading" class="station-tasks">
    <h3>当前任务</h3>
    <p>查看当前工位承担的工作；新建和配置任务请进入所属项目的子项目。</p>
    <el-button size="small" @click="load">刷新</el-button>
    <el-alert v-if="failed" title="工位任务加载失败，请重试" type="error" :closable="false" />
    <el-table :data="items" border>
      <el-table-column prop="project_name" label="项目" />
      <el-table-column prop="subproject_name" label="子项目" />
      <el-table-column prop="name" label="任务" />
      <el-table-column label="任务内容"><template slot-scope="{ row }">{{ row.content_draft_id ? '有草稿' : row.revision_id ? '已发布 · V' + row.revision_no : '尚未编写' }}</template></el-table-column>
      <el-table-column label="操作" width="110"><template slot-scope="{ row }"><el-button type="text" @click="visit(row)">进入项目任务</el-button></template></el-table-column>
    </el-table>
  </section>
</template>
<script src="../js/station_tasks.js" />
<style scoped src="../styles/station_tasks.scss" lang="scss" />
