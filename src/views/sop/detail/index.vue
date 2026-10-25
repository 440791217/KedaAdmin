<template>
  <div v-loading="loading" class="app-container">
    <div class="sop-toolbar">
      <el-button v-if="$route.query.task_id" icon="el-icon-back" @click="$router.push(`/project/${$route.query.project_id}/subproject/${$route.query.subproject_id}/task/${$route.query.task_id}`)">返回SOP任务</el-button><el-button v-else icon="el-icon-back" @click="$router.push('/sop/list')">返回标准库</el-button><el-button @click="load">刷新</el-button><el-dropdown
        v-if="document"
        @command="metadata"
      ><el-button
        type="primary"
        plain
        :disabled="busy"
      >操作<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu
        slot="dropdown"
      ><el-dropdown-item v-if="document.can_edit" command="name">修改目录名称</el-dropdown-item><el-dropdown-item v-if="document.can_transfer_owner" command="owner">转移负责人</el-dropdown-item><el-dropdown-item
        v-if="!document.can_edit && !document.can_transfer_owner"
        disabled
      >只读</el-dropdown-item></el-dropdown-menu></el-dropdown>
    </div>
    <el-alert v-if="failed" title="加载失败，请刷新" type="error" :closable="false" />
    <template
      v-if="document"
    ><el-card
       shadow="never"
       class="sop-card"
     ><div slot="header">
        <strong>{{ document.code }} · {{ document.name }}</strong>
      </div>
       <p>管理项目：{{ document.managing_project_name }} · 负责人：{{ document.owner_name }}</p>
       <p class="sop-note">已发布内容保留不变；修改时复制新草稿。项目使用关联不会自动切换版本。</p></el-card>
      <el-table
        :data="versions"
        border
      ><el-table-column
        label="版本"
        width="90"
      ><template slot-scope="{ row }">V{{ row.revision_no }}</template></el-table-column><el-table-column prop="title" label="标题" min-width="200" /><el-table-column
        label="状态"
        width="110"
      ><template
        slot-scope="{ row }"
      ><el-tag :type="['info', 'success', 'warning'][row.status]">{{
        labels[row.status]
      }}</el-tag></template></el-table-column><el-table-column
        prop="revision_note"
        label="修订说明"
        min-width="180"
        show-overflow-tooltip
      /><el-table-column
        label="发布时间"
        width="160"
      ><template slot-scope="{ row }">{{
        row.published_at | parseTime('{y}-{m}-{d} {h}:{i}')
      }}</template></el-table-column><el-table-column
        label="操作"
        width="130"
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
      >操作<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu
        slot="dropdown"
      ><el-dropdown-item command="preview">只读预览</el-dropdown-item><el-dropdown-item
        v-if="row.status !== 0 || document.can_edit"
        command="edit"
      >{{ row.status === 0 ? '制作草稿（含标注）' : '制作视图' }}</el-dropdown-item><el-dropdown-item
        v-if="row.status !== 0 && document.can_edit && !document.draft_count"
        command="copy"
      >复制为新草稿</el-dropdown-item><el-dropdown-item
        v-if="row.status === 0 && document.can_publish"
        command="publish"
      >发布版本</el-dropdown-item><el-dropdown-item
        v-if="row.status === 1 && document.can_retire"
        command="retire"
      >停用版本</el-dropdown-item><el-dropdown-item
        v-if="row.status === 0 && document.can_edit"
        command="discard"
      >放弃草稿</el-dropdown-item></el-dropdown-menu></el-dropdown></template></el-table-column></el-table>
    </template>
    <el-dialog
      title="转移SOP负责人"
      :visible.sync="ownerDialog"
      width="520px"
      :close-on-click-modal="false"
      :show-close="!busy"
    ><el-select
      v-model="nextOwner"
      filterable
      remote
      :remote-method="searchOwners"
      placeholder="搜索有效编辑成员"
      style="width: 100%"
    ><el-option
      v-for="p in owners"
      :key="p.id"
      :label="`${p.real_name}（${p.username}）`"
      :value="p.id"
    /></el-select><span
      slot="footer"
    ><el-button :disabled="busy" @click="ownerDialog = false">取消</el-button><el-button
      type="primary"
      :disabled="!nextOwner"
      :loading="busy"
      @click="transfer"
    >确认交接</el-button></span></el-dialog>
  </div>
</template>
<script src="./js/sop_detail.js" />
<style scoped src="./styles/index.scss" lang="scss" />
