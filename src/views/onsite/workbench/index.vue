<template>
  <section v-loading="loading" class="onsite-workbench" :class="{ 'workbench-guidance': task || executionId, 'workbench-running': !!executionId, 'workbench-focused': focused }">
    <header v-if="!task && !executionId" class="workbench-header">
      <div><h2>现场工作台</h2><p>选择工位与任务，扫码开工并记录操作过程</p></div>
      <div class="workbench-controls">
        <el-button v-if="focused" size="small" @click="focused = false">退出专注</el-button>
        <el-select v-model="stationId" :disabled="starting" filterable remote clearable placeholder="搜索并选择工位" :remote-method="searchStations" @change="selectStation">
          <el-option v-for="s in stations" :key="s.id" :label="s.name + ' · ' + s.code" :value="s.id" />
        </el-select>
        <el-button :disabled="!stationId || loading || starting" icon="el-icon-refresh" @click="selectStation">刷新</el-button>
      </div>
    </header>
    <el-alert v-if="stationFailed" title="工位清单加载失败，可重新搜索重试" type="error" :closable="false" />
    <el-alert v-if="failed" :title="failed" type="error" :closable="false" />
    <div v-if="station && !task && !executionId" class="station-summary"><strong>{{ station.name }}</strong><span>位置：{{ station.location_name || '未设置' }}</span><span>IP：{{ station.ip_address || '未设置' }}</span></div>
    <el-alert v-if="executionFailed" title="执行记录加载失败，请确认已执行现场执行模块建表脚本并重启后台，再点击刷新" type="error" :closable="false" />
    <div v-if="activeExecution && !executionId" class="active-execution"><span>本工位有未结束作业：{{ activeExecution.product_code }} · {{ activeExecution.operator_name }} · {{ activeExecution.status === 1 ? '已暂停' : '进行中' }}</span><el-button type="primary" @click="executionId = activeExecution.id">查看／继续作业</el-button></div>
    <div v-if="executionId"><div class="execution-workspace-toolbar"><el-button size="small" @click="leaveExecution">返回工位任务（保留作业）</el-button><el-button size="small" icon="el-icon-full-screen" @click="focused = !focused">{{ focused ? '退出专注' : '专注模式' }}</el-button></div><execution-panel :key="executionId" :execution-id="executionId" @changed="executionChanged" /></div>
    <div v-else-if="!stationId" class="workbench-empty">请先选择现场工位</div>
    <template v-else-if="!task">
      <div class="task-toolbar"><h3>工位任务 <small>{{ filteredTasks.length }}项</small></h3><el-input v-model="keyword" clearable placeholder="搜索项目、子项目或任务" /></div>
      <div class="task-grid">
        <article v-for="t in filteredTasks" :key="t.id" class="task-card">
          <p class="task-project">{{ t.project_name }} / {{ t.subproject_name }}</p>
          <h3>{{ t.name }}</h3><p class="task-code">{{ t.code }}</p>
          <p>负责人：{{ t.owner_name || '未设置' }}</p>
          <div class="task-card-footer"><el-tag :type="t.onsite_available ? 'success' : 'info'">{{ t.revision_id ? '已发布 · V' + t.revision_no : '未发布' }}</el-tag><el-button type="primary" :disabled="!t.onsite_available" @click="openTask(t)">查看指导</el-button></div>
          <p v-if="!t.onsite_available" class="task-reason">{{ unavailable(t) }}</p>
        </article>
      </div>
      <div v-if="!loading && !filteredTasks.length && !failed" class="workbench-empty">暂无可见任务，请确认工位分配和项目查看权限</div>
    </template>
    <template v-else>
      <div class="guide-heading"><el-button icon="el-icon-back" @click="back">返回任务列表</el-button><div><h3><span v-if="station" class="guide-station-name">{{ station.name }}<span class="guide-title-divider">/</span></span>{{ task.name }}</h3><p>{{ task.project_name }} / {{ task.subproject_name }} · 发布版本 V{{ revision ? revision.revision_no : task.revision_no }}</p></div><el-button size="small" icon="el-icon-full-screen" @click="focused = !focused">{{ focused ? '退出专注' : '专注模式' }}</el-button></div>
      <div v-if="revision && revision.steps.length" class="execution-start"><el-input v-model="productCode" :disabled="starting" maxlength="128" placeholder="扫描或输入产品码，回车开工" @input="productChanged" @keyup.enter.native="start" /><el-button type="primary" :loading="starting" :disabled="!canStart || !productCode.trim() || !!activeExecution || executionFailed" @click="start">扫码开工</el-button><el-tooltip content="支持USB键盘模式扫码枪，也可手工输入。每个工位同时执行一笔作业。"><i class="el-icon-question scan-help" tabindex="0" aria-label="扫码帮助" /></el-tooltip><small v-if="!canStart">当前账号仅可查看指导</small></div>
      <operation-guide v-if="revision && revision.steps.length" :steps="revision.steps" :step-index="stepIndex" :station-name="station ? station.name : task.station_name" :image-context="{ projectId: String(task.project_id), subprojectId: String(task.subproject_id), taskId: String(task.id) }" @select="stepIndex = $event"><template slot="status">{{ stepIndex === revision.steps.length - 1 ? '已到最后一步' : '预览指导 · 扫码开工后可确认步骤' }}</template></operation-guide>
      <div v-else-if="revision" class="workbench-empty">当前发布内容没有操作步骤</div>
    </template>
  </section>
</template>
<script src="./js/onsite_workbench.js" />
<style scoped lang="scss" src="./styles/onsite_workbench.scss" />
