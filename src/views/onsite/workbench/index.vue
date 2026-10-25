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
    <div v-if="activeExecution && !executionId" class="active-execution"><span>本工位有未结束作业：{{ activeExecution.product_code }} · {{ activeExecution.operator_name }} · {{ activeExecution.status === 1 ? '已暂停' : '进行中' }}</span><el-button type="primary" @click="openActive">{{ activeEntryLabel }}</el-button></div>
    <div v-if="executionId"><execution-panel :key="executionId" :regions-visible.sync="regionsVisible" :execution-id="executionId" :camera-pool="cameraPool" :initial-execution="activeExecution" @changed="executionChanged"><template slot="workspace-actions"><el-button size="small" icon="el-icon-back" title="返回工位任务，保留当前作业进度" @click="leaveExecution">返回工位</el-button><el-button size="small" icon="el-icon-full-screen" @click="focused = !focused">{{ focused ? '退出专注' : '专注模式' }}</el-button></template></execution-panel></div>
    <div v-else-if="!stationId" class="workbench-empty">请先选择现场工位</div>
    <template v-else-if="!task">
      <div class="task-toolbar"><h3>工位任务 <small>{{ filteredTasks.length }}项</small></h3><el-input v-model="keyword" clearable placeholder="搜索项目、子项目或任务" /></div>
      <div class="task-grid">
        <article v-for="t in filteredTasks" :key="t.id" class="task-card">
          <p class="task-project">{{ t.project_name }} / {{ t.subproject_name }}</p>
          <h3>{{ t.name }}</h3><p class="task-code">{{ t.code }}</p>
          <p>负责人：{{ t.owner_name || '未设置' }}</p>
          <div class="task-card-footer"><el-tag :type="t.onsite_available ? 'success' : 'info'">{{ t.revision_id ? '已发布 · V' + t.revision_no : '未发布' }}</el-tag><el-button type="primary" :disabled="loading || taskEntry(t).disabled" @click="enterTask(t)">{{ taskEntry(t).label }}</el-button></div>
          <p v-if="taskEntry(t).reason" class="task-reason">{{ taskEntry(t).reason }}</p>
        </article>
      </div>
      <div v-if="!loading && !filteredTasks.length && !failed" class="workbench-empty">暂无可见任务，请确认工位分配和项目查看权限</div>
    </template>
    <template v-else>
      <div class="guide-heading"><div><h3><span v-if="station" class="guide-station-name">{{ station.name }}<span class="guide-title-divider">/</span></span>{{ task.name }}</h3><p>{{ task.project_name }} / {{ task.subproject_name }} · 发布版本 V{{ revision ? revision.revision_no : task.revision_no }}</p></div></div>
      <div v-if="revision && revision.steps.length" class="execution-start"><el-tag v-if="!activeExecution && canStart && readyToStart" size="small" type="info">等待扫码</el-tag><el-input ref="productCodeInput" v-model="productCode" :disabled="starting || !readyToStart || !canStart || !!activeExecution || executionFailed" maxlength="128" placeholder="扫描或输入产品码，回车开工" @input="productChanged" @keyup.enter.native="start" /><el-button type="primary" :loading="starting" :disabled="!readyToStart || !canStart || !productCode.trim() || !!activeExecution || executionFailed" @click="start">扫码开工</el-button><el-tooltip content="支持USB键盘模式扫码枪，也可手工输入。每个工位同时执行一笔作业。"><i class="el-icon-question scan-help" tabindex="0" aria-label="扫码帮助" /></el-tooltip><small v-if="!readyToStart">{{ unavailable(task) }} · 仅预览</small><small v-else-if="activeExecution">工位已有未结束作业 · 仅预览</small><small v-else-if="executionFailed">作业状态待确认 · 仅预览</small><small v-else-if="!canStart">当前账号仅可预览指导</small></div>
      <operation-guide v-if="revision && revision.steps.length" :steps="revision.steps" :step-index="stepIndex" :station-name="station ? station.name : task.station_name" :image-context="{ projectId: String(task.project_id), subprojectId: String(task.subproject_id), taskId: String(task.id) }" @select="stepIndex = $event"><template slot="live" slot-scope="{ active }"><live-detection :regions-visible.sync="regionsVisible" :camera-pool="cameraPool" :camera-steps="revision.steps" :camera-step-index="stepIndex" :preview-active="active" embedded :step="step" :station-id="String(stationId)" :step-id="String((step && step.id) || stepIndex + 1)" /></template><template slot="status"><el-button size="small" icon="el-icon-back" @click="back">返回工位</el-button><el-button size="small" icon="el-icon-full-screen" @click="focused = !focused">{{ focused ? '退出专注' : '专注模式' }}</el-button><el-button size="small" icon="el-icon-refresh" :disabled="starting" @click="openTask(task)">刷新状态</el-button><job-voice-control /><span>{{ stepIndex === revision.steps.length - 1 ? '已到最后一步' : '仅预览 · 扫码后开始作业' }}</span></template></operation-guide>
      <div v-else-if="revision" class="workbench-empty">当前发布内容没有操作步骤<el-button type="text" @click="back">返回工位</el-button></div>
    </template>
  </section>
</template>
<script src="./js/onsite_workbench.js" />
<style scoped lang="scss" src="./styles/onsite_workbench.scss" />
