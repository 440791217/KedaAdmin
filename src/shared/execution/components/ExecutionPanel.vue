<template>
  <section v-loading="loading" class="execution-panel">
    <el-alert v-if="failed" title="执行记录加载失败，请重试" type="error" :closable="false" />
    <el-button v-if="failed" @click="load">重试</el-button>
    <template v-if="execution">
      <header class="execution-heading">
        <div class="execution-summary">
          <div class="execution-title"><h3>{{ execution.task_name }}</h3><el-tag :type="statusType" size="small" effect="light">{{ states[execution.status] }}</el-tag><span class="execution-version">执行版本 V{{ execution.revision_no }}</span></div>
          <p>产品码：<strong>{{ execution.product_code }}</strong><span>工位：{{ execution.station_name }}</span><span>操作人：{{ execution.operator_name }}</span></p>
          <p class="execution-meta">{{ execution.project_name }} / {{ execution.subproject_name }} · 开工 {{ time(execution.started_at) }}<template v-if="execution.ended_at"> · 结束 {{ time(execution.ended_at) }}</template></p>
        </div>
      </header>
      <operation-guide
        :live-enabled="!readonly && execution.status < 2 && !!execution.station_id"
        :records-mode="readonly || execution.status >= 2"
        :evidence-steps="execution.steps"
        :execution-status="execution.status"
        :voice-alerts-enabled="!!canOperate && (!execution.clock_supported || clockConnected)"
        :timing-advance-limit="execution.clock_supported && !clockConnected ? 0 : Infinity"
        :timing-interrupted="!!execution.clock_supported && !clockConnected && !clockConnecting"
        :navigation-locked="navigationLocked"
        :detection-status="liveStatus"
        :steps="steps"
        :step-index="stepIndex"
        :confirmed="execution.steps.map(s => !!s.confirmed_at)"
        :station-name="execution.station_name"
        :image-context="{ executionId }"
        executing
        @select="selectStep"
      >
        <template v-if="!readonly && execution.status < 2 && execution.station_id" slot="live" slot-scope="{ active }"><live-detection
          ref="live"
          :camera-pool="liveCameraPool"
          :regions-visible="regionsVisible"
          :camera-steps="steps"
          :camera-step-index="stepIndex"
          :preview-active="active"
          embedded
          :step="step"
          :station-id="String(execution.station_id)"
          :execution-id="executionId"
          :step-id="String((step && step.id) || stepIndex + 1)"
          :step-confirmed="!!(execution.steps[stepIndex] && execution.steps[stepIndex].confirmed_at)"
          :running="execution.status === 0 && canConfirm && !busy && !reasonOpen && !autoFailed"
          @update:regionsVisible="$emit('update:regionsVisible', $event)"
          @satisfied="autoConfirm"
          @status-change="detectionStatus = $event"
        /></template>
        <template slot="status">
          <slot name="workspace-actions" />
          <el-button size="small" icon="el-icon-refresh" :disabled="busy" @click="load">刷新状态</el-button>
          <el-button v-if="canOperate && execution.status === 0" type="danger" size="small" plain :disabled="busy" @click="action('pause')">异常暂停</el-button>
          <el-button v-if="canAbort" type="danger" plain size="small" :disabled="busy" @click="action('abort')">中止任务</el-button>
          <job-voice-control v-if="!readonly" />
        </template>
        <template slot="confirm">
          <span v-if="execution.clock_supported && execution.status === 0 && nextPosition && !clockConnected" class="execution-auto-status">{{ clockConnecting ? '正在连接执行会话…' : clockError || '执行已中断，计时已停止' }}</span>
          <el-button v-if="canOperate && execution.clock_supported && execution.status === 0 && nextPosition && !clockConnected" type="primary" :loading="clockConnecting" :disabled="busy || clockConnecting" @click="resumeClock">继续作业</el-button>
          <el-button v-else-if="canOperate && execution.status === 1" type="primary" :disabled="busy" @click="action('resume')">继续作业</el-button>
          <el-button v-else-if="canOperate && canComplete" type="primary" :disabled="busy" @click="action('complete')">完成作业</el-button>
          <span v-else-if="canOperate && automaticStep && (autoFailed || busy)" class="execution-auto-status">{{ autoFailed ? '提交失败，请刷新状态重试' : '提交中…' }}</span>
          <el-button v-else-if="canOperate && !automaticStep" type="primary" :disabled="!canConfirm || busy" @click="submit('confirm')">确认本步骤</el-button>
        </template>
      </operation-guide>
      <details class="execution-events"><summary>操作记录（{{ execution.events.length }}）</summary><p v-for="event in execution.events" :key="event.id">{{ time(event.created_at) }} · {{ event.actor_name }} · {{ actions[event.action] || event.action }}<span v-if="event.reason"> · {{ event.reason }}</span></p></details>
    </template>
    <el-dialog :title="pendingAction === 'abort' ? '中止作业' : '异常暂停'" :visible.sync="reasonOpen" width="min(440px, 92vw)" append-to-body :close-on-click-modal="false" :show-close="!busy" :close-on-press-escape="!busy" :before-close="(done) => { if (!busy) done() }"><p class="execution-reason-hint">{{ pendingAction === 'abort' ? '中止后无法继续本次作业，记录将保留。' : '暂停会保留当前进度，处理异常后可继续作业。' }}</p><el-input v-model="reason" type="textarea" :rows="3" maxlength="2000" show-word-limit :placeholder="pendingAction === 'abort' ? '请填写中止原因' : '请填写异常原因'" /><span slot="footer"><el-button size="small" :disabled="busy" @click="reasonOpen = false">取消</el-button><el-button size="small" :type="pendingAction === 'abort' ? 'danger' : 'primary'" :loading="busy" @click="submitReason">{{ pendingAction === 'abort' ? '确认中止' : '确认暂停' }}</el-button></span></el-dialog>
  </section>
</template>
<script src="../js/execution_panel.js" />
<style scoped lang="scss" src="../styles/execution_panel.scss" />
