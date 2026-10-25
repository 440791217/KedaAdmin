<template>
  <span class="detection-verdict" :class="'is-' + status.code" role="status" aria-live="polite" aria-label="当前步骤检测结果"><strong v-if="status.code === 'ok' || status.code === 'ng'">{{ status.code.toUpperCase() }}</strong><span>{{ status.text }}</span></span>
</template>
<script>
export default {
  name: 'DetectionStatus',
  props: { status: { type: Object, required: true }}
}
</script>
<style scoped>
.detection-verdict { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid #e1e6ed; border-radius: 4px; color: #7d8b9e; background: #f5f7fa; white-space: nowrap; font-size: 12px; line-height: 18px; }
.detection-verdict strong { font-size: 13px; }
.detection-verdict.is-ng { color: #d94750; background: #fff2f2; border-color: #f5cccc; }
.detection-verdict.is-ok { color: #199660; background: #eefaf3; border-color: #c6ebd7; }
</style>
