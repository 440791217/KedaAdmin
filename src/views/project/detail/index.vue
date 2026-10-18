<template>
  <div v-loading="loading" class="app-container project-page project-detail-page">
    <header class="detail-hero">
      <div class="detail-heading">
        <div class="detail-title-block"><span class="detail-kind">{{ isSub ? '子项目' : '项目总成' }}</span><div class="detail-title-line"><h1>{{ record ? record.name : '项目详情' }}</h1><el-tag v-if="record" :type="statusTypes[record.status]" size="small">{{ statusLabels[record.status] }}</el-tag></div></div>
        <div class="project-toolbar detail-actions">
          <el-button icon="el-icon-back" @click="$router.push(isSub ? `/project/${projectId}` : '/project/list')">返回{{ isSub ? '项目' : '列表' }}</el-button>
          <el-button icon="el-icon-refresh" :disabled="busy" @click="load">刷新</el-button>
          <el-dropdown v-if="record" trigger="click" @command="command($event, record, isSub)">
            <el-button type="primary" plain :disabled="busy">编辑<i class="el-icon-arrow-down el-icon--right" /></el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-if="record.can_edit || record.can_transfer_owner" command="edit">编辑资料</el-dropdown-item>
              <el-dropdown-item v-if="record.can_restore" command="restore">恢复归档</el-dropdown-item>
              <el-dropdown-item v-if="isSub && record.can_status && record.status === 0 && project.status !== 1" disabled>开始子项目（请先开始主项目）</el-dropdown-item>
              <el-dropdown-item v-for="status in (isSub ? record.can_status : record.can_manage) ? (isSub ? subStatuses(record) : nextStatuses(record.status)) : []" :key="status" :command="status">{{ status === 1 && record.status === 2 ? '重新开启' : status === 1 ? (isSub ? '开始子项目' : '开始项目') : status === 2 ? '完成' : '归档' }}</el-dropdown-item>
              <el-dropdown-item v-if="record.can_delete" command="delete" divided><span class="project-danger">删除</span></el-dropdown-item>
              <el-dropdown-item v-if="!record.can_transfer_owner && !record.can_restore && (record.status === 3 || !record.can_edit && !(isSub ? record.can_status : record.can_manage))" disabled>只读</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <template v-if="record">
        <dl class="detail-metadata"><div class="detail-code"><dt>项目编号</dt><dd>{{ record.code }}</dd></div><div><dt>负责人</dt><dd>{{ record.owner_name }}<span v-if="record.owner_username" class="detail-account">{{ record.owner_username }}</span></dd></div><div><dt>{{ isSub ? '所属项目' : '客户' }}</dt><dd>{{ isSub ? project.name : record.customer_name || '未填写' }}</dd></div></dl>
        <div class="detail-description"><span>说明</span><p>{{ record.description || '暂无说明' }}</p></div>
      </template>
    </header>
    <el-alert v-if="failed" class="project-error" title="加载失败，请刷新重试" type="error" :closable="false" />
    <template v-if="record">
      <el-tabs v-model="activeTab" class="detail-workspace">
        <el-tab-pane v-if="!isSub" label="子项目" name="children">
          <section class="subprojects-section">
            <div class="detail-content-heading"><div><h2>子项目<span class="detail-count">{{ children.length }}</span></h2><p>查看分部及其SOP任务，管理负责人和项目进度</p></div><el-button v-if="project.can_create_subproject" type="success" size="small" icon="el-icon-plus" :disabled="busy" @click="openForm(null, true)">新建子项目</el-button></div>
            <el-table :data="children" class="subprojects-table" empty-text="暂无子项目，可点击右上角新建子项目">
              <el-table-column type="index" label="顺序" width="65" align="center" />
              <el-table-column label="子项目" min-width="290"><template slot-scope="{row}"><div class="subproject-identity"><el-link type="primary" @click="$router.push(`/project/${projectId}/subproject/${row.id}`)">{{ row.name }}</el-link><span>{{ row.code }}</span></div></template></el-table-column>
              <el-table-column prop="owner_name" label="负责人" width="150" />
              <el-table-column label="状态" width="100" align="center"><template slot-scope="{row}"><el-tag :type="statusTypes[row.status]">{{ statusLabels[row.status] }}</el-tag></template></el-table-column>
              <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
              <el-table-column v-if="project.can_sort" label="排序" width="100" align="center"><template slot-scope="{ $index }"><el-button type="text" icon="el-icon-top" :disabled="busy || $index === 0" @click="move($index, -1)" /><el-button type="text" icon="el-icon-bottom" :disabled="busy || $index === children.length - 1" @click="move($index, 1)" /></template></el-table-column>
              <el-table-column label="操作" width="120" align="center"><template slot-scope="{row}">
                <el-dropdown trigger="click" @command="command($event, row, true)"><el-button type="primary" plain size="mini" :disabled="busy">编辑<i class="el-icon-arrow-down el-icon--right" /></el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="view">SOP任务</el-dropdown-item>
                    <el-dropdown-item v-if="row.can_edit || row.can_transfer_owner" command="edit">编辑资料</el-dropdown-item>
                    <el-dropdown-item v-if="row.can_restore" command="restore">恢复归档</el-dropdown-item>
                    <el-dropdown-item v-if="row.can_status && row.status === 0 && project.status !== 1" disabled>开始子项目（请先开始主项目）</el-dropdown-item>
                    <el-dropdown-item v-for="status in row.can_status ? subStatuses(row) : []" :key="status" :command="status">{{ status === 1 && row.status === 2 ? '重新开启' : status === 1 ? '开始子项目' : status === 2 ? '完成子项目' : '归档子项目' }}</el-dropdown-item>
                    <el-dropdown-item v-if="row.can_delete" command="delete" divided><span class="project-danger">删除子项目</span></el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </template></el-table-column>
            </el-table>
          </section>
        </el-tab-pane>
        <el-tab-pane v-if="!isSub" label="项目成员" name="members"><project-members v-if="activeTab === 'members'" :project="project" @changed="load" /></el-tab-pane>
        <el-tab-pane v-if="!isSub" label="操作记录" name="activity"><project-activity v-if="activeTab === 'activity'" :project="project" /></el-tab-pane>
        <el-tab-pane v-if="isSub" label="SOP任务" name="tasks"><sop-tasks v-if="activeTab === 'tasks'" :project-id="projectId" :subproject-id="$route.params.subprojectId" /></el-tab-pane>
      </el-tabs>
    </template>
    <entity-dialog :visible.sync="dialog" :entity="selected" :project-id="editingSub ? projectId : ''" @saved="load" @stale="load" @transfer-owner="command('owner', $event, editingSub)" />
    <owner-transfer v-if="project" :visible.sync="ownerDialog" :project="project" :entity="ownerEntity" @transferred="transferred" @stale="load" />
  </div>
</template>
<script src="./js/project_detail.js" />
<style scoped src="./styles/index.scss" lang="scss" />
