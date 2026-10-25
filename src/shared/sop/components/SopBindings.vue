<template>
  <div v-loading="loading">
    <div class="sop-toolbar">
      <el-button
        v-if="canManage"
        type="success"
        size="small"
        icon="el-icon-plus"
        :disabled="busy"
        @click="open(null)"
      >关联 SOP</el-button><el-button size="small" :disabled="busy" @click="load">刷新</el-button><span class="sop-note">使用固定发布版本；新版发布后可手动切换。</span>
    </div>
    <el-alert v-if="failed" title="关联加载失败，请刷新后重试" type="error" :closable="false" />
    <el-table :data="items" border>
      <el-table-column prop="code" label="SOP编号" min-width="130" />
      <el-table-column prop="title" label="标准名称" min-width="180" />
      <el-table-column
        label="使用版本"
        width="155"
      ><template
        slot-scope="{ row }"
      >V{{ row.revision_no }}
        <el-tag v-if="row.revision_status === 2" type="warning" size="mini">已停用</el-tag><el-tag
          v-if="row.status === 1 && row.latest_published_no > row.revision_no"
          size="mini"
        >有新版</el-tag></template></el-table-column>
      <el-table-column
        label="关联状态"
        width="100"
      ><template
        slot-scope="{ row }"
      ><el-tag :type="row.status === 1 ? 'success' : 'info'">{{
        row.status === 1 ? '使用中' : '已解绑'
      }}</el-tag></template></el-table-column>
      <el-table-column
        v-if="canManage"
        label="顺序"
        width="95"
      ><template
        slot-scope="{ row }"
      ><el-button
        type="text"
        icon="el-icon-top"
        :disabled="busy || row.status !== 1 || active.indexOf(row) === 0"
        @click="move(row, -1)"
      /><el-button
        type="text"
        icon="el-icon-bottom"
        :disabled="busy || row.status !== 1 || active.indexOf(row) === active.length - 1"
        @click="move(row, 1)"
      /></template></el-table-column>
      <el-table-column
        label="操作"
        width="110"
        align="center"
      ><template
        slot-scope="{ row }"
      ><el-dropdown
        trigger="click"
        @command="command($event, row)"
      ><el-button
        size="mini"
        plain
        type="primary"
        :disabled="busy"
      >操作<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu
        slot="dropdown"
      ><el-dropdown-item v-if="row.status === 1" command="preview">查看标准</el-dropdown-item><el-dropdown-item v-if="canManage" command="change">{{
        row.status === 1 ? '切换版本' : '重新关联'
      }}</el-dropdown-item><el-dropdown-item
        v-if="canManage && row.status === 1"
        command="unbind"
        divided
      >解绑</el-dropdown-item><el-dropdown-item
        v-if="!canManage && row.status !== 1"
        disabled
      >只读</el-dropdown-item></el-dropdown-menu></el-dropdown></template></el-table-column>
    </el-table>
    <el-dialog
      :title="selected ? '切换或恢复关联' : '关联 SOP'"
      :visible.sync="dialog"
      width="560px"
      :close-on-click-modal="false"
      :before-close="close"
    >
      <el-form
        label-width="90px"
        @submit.native.prevent
      ><el-form-item
         label="SOP"
       ><el-select
         v-model="form.sop_id"
         filterable
         remote
         :remote-method="search"
         :loading="searching"
         :disabled="!!selected || busy"
         placeholder="搜索编号或名称"
         style="width: 100%"
         @change="choose"
       ><el-option
         v-for="option in options"
         :key="option.id"
         :value="option.id"
         :label="`${option.code} · ${option.name}`"
       /></el-select></el-form-item><el-form-item
         label="发布版本"
       ><el-select
         v-model="form.revision_id"
         :loading="versionsLoading"
         :disabled="busy || !form.sop_id"
         style="width: 100%"
       ><el-option
         v-for="v in versions"
         :key="v.id"
         :value="v.id"
         :label="`V${v.revision_no} · ${v.title}`"
       /></el-select></el-form-item>
        <p class="sop-note">仅列出有权访问的已发布版本。切换后立即按新版本查看。</p></el-form>
      <div slot="footer">
        <el-button :disabled="busy" @click="dialog = false">取消</el-button><el-button
          type="primary"
          :loading="busy"
          :disabled="!form.revision_id || versionsLoading"
          @click="save"
        >保存关联</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script src="../js/sop_bindings.js" />
<style scoped src="../styles/sop.scss" lang="scss" />
