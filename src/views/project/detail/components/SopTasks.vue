<template>
  <div v-loading="loading">
    <div class="task-toolbar">
      <span>子项目安排任务，指定工位后直接编写步骤、图片和标注。</span><el-button
        v-if="canManage"
        type="success"
        icon="el-icon-plus"
        :disabled="busy"
        @click="open()"
      >新建任务</el-button><el-button @click="load">刷新</el-button>
    </div>
    <el-alert
      v-if="failed"
      title="任务加载失败，请重试"
      type="error"
      :closable="false"
    /><el-table
      :data="items"
      :row-class-name="taskRowClass"
      border
    ><el-table-column
      prop="sort_order"
      label="顺序"
      width="70"
    /><el-table-column
      label="任务"
      min-width="150"
    ><template slot-scope="{ row }"><el-link type="primary" @click="open(row)">{{ row.name }}</el-link></template></el-table-column><el-table-column
      prop="station_name"
      label="工位"
      min-width="120"
    /><el-table-column
      label="任务内容"
      min-width="180"
    ><template slot-scope="{ row }">{{
      row.revision_id ? "当前生效：V" + row.revision_no : "尚未发布"
    }}<span v-if="row.content_draft_id"> ｜ {{ row.content_draft_no ? '编辑草稿：V' + row.content_draft_no : '有未发布草稿' }}</span></template></el-table-column><el-table-column
      prop="owner_name"
      label="负责人"
      width="100"
    /><el-table-column
      label="发布状态"
      min-width="180"
    ><template
      slot-scope="{ row }"
    ><el-tag :type="row.status === 2 ? 'info' : row.revision_id ? 'success' : 'info'">{{ row.status === 2 ? '已取消' : row.revision_id ? '已发布' : '未发布' }}</el-tag>
      <div
        v-if="row.status !== 2 && row.issues.length"
        class="task-warning"
      >
        {{ row.issues.join("；") }}
      </div></template></el-table-column><el-table-column
      label="操作"
      width="110"
    ><template
      slot-scope="{ row }"
    ><el-dropdown trigger="click" @command="command($event, row)"><el-button type="primary" plain size="mini" :disabled="busy">操作<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu slot="dropdown"><el-dropdown-item command="open">打开任务</el-dropdown-item><el-dropdown-item v-if="canManage && row.status !== 2" command="cancel" divided>取消任务</el-dropdown-item><el-dropdown-item v-if="canDelete" command="delete" divided><span class="task-danger">删除任务</span></el-dropdown-item></el-dropdown-menu></el-dropdown></template></el-table-column></el-table>
  </div>
</template>
<script src="../js/sop_tasks.js" />
<style scoped src="../styles/sop_tasks.scss" lang="scss" />
