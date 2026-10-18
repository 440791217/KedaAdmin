<template>
  <section v-loading="loading" class="execution-panel">
    <el-alert v-if="failed" title="执行记录加载失败，请重试" type="error" :closable="false" />
    <el-button v-if="failed" @click="load">重试</el-button>
    <template v-if="execution">
      <header class="execution-heading"><div><h3>{{ execution.task_name }} <el-tag>{{ states[execution.status] }}</el-tag></h3><p>产品码：<strong>{{ execution.product_code }}</strong> · 工位：{{ execution.station_name }} · 操作人：{{ execution.operator_name }} · V{{ execution.revision_no }}</p><p>{{ execution.project_name }} / {{ execution.subproject_name }} · 开工 {{ time(execution.started_at) }} · 结束 {{ time(execution.ended_at) }}</p></div><el-button :disabled="busy" @click="load">刷新作业</el-button></header>
      <el-alert v-if="execution.status === 1" title="作业已暂停，恢复后才能确认步骤。异常原因见下方操作记录。" type="warning" :closable="false" />
      <operation-guide :steps="steps" :step-index="stepIndex" :confirmed="execution.steps.map(s => !!s.confirmed_at)" :station-name="execution.station_name" :image-context="{ executionId }" executing @select="stepIndex = $event">
        <template slot="status"><span v-if="execution.steps[stepIndex] && execution.steps[stepIndex].confirmed_at" class="execution-confirmed">已确认：{{ time(execution.steps[stepIndex].confirmed_at) }}</span><span v-else>{{ execution.status === 1 ? '作业已暂停，恢复后继续操作' : nextPosition ? '请按顺序完成并确认当前步骤' : '全部步骤已确认，可完成作业' }}</span></template>
        <el-button v-if="canOperate" slot="confirm" type="primary" :disabled="!canConfirm || busy" @click="submit('confirm')">确认本步骤</el-button>
      </operation-guide>
      <div v-if="canOperate || canAbort" class="execution-actions"><el-button v-if="canOperate && execution.status === 0" :disabled="busy" @click="action('pause')">异常暂停</el-button><el-button v-if="canOperate && execution.status === 1" type="primary" :disabled="busy" @click="action('resume')">恢复作业</el-button><el-button v-if="canOperate" type="success" :disabled="busy || execution.status !== 0 || nextPosition !== 0" @click="action('complete')">完成作业</el-button><el-button v-if="canAbort" type="danger" plain :disabled="busy" @click="action('abort')">中止作业</el-button></div>
      <details class="execution-events"><summary>操作记录（{{ execution.events.length }}）</summary><p v-for="event in execution.events" :key="event.id">{{ time(event.created_at) }} · {{ event.actor_name }} · {{ actions[event.action] || event.action }}<span v-if="event.reason"> · {{ event.reason }}</span></p></details>
    </template>
    <el-dialog title="填写原因" :visible.sync="reasonOpen" width="520px" append-to-body :close-on-click-modal="false" :show-close="!busy" :close-on-press-escape="!busy" :before-close="(done) => { if (!busy) done() }"><el-input v-model="reason" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="请填写异常或中止原因" /><span slot="footer"><el-button :disabled="busy" @click="reasonOpen = false">取消</el-button><el-button type="primary" :loading="busy" @click="submitReason">确认</el-button></span></el-dialog>
  </section>
</template>
<script src="../js/execution_panel.js" />
<style scoped lang="scss" src="../styles/execution_panel.scss" />
