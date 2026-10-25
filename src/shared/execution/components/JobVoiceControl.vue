<template>
  <span class="job-voice-control">
    <el-checkbox v-model="enabled">作业语音</el-checkbox>
    <span v-if="error" class="job-voice-error" role="status">
      {{ error }}
      <el-button type="text" @click="retry">重播</el-button>
    </span>
  </span>
</template>

<script>
import { voiceState, setJobVoice, retryExecutionVoice } from '@/shared/execution/voice-events'

export default {
  name: 'JobVoiceControl',
  computed: {
    enabled: {
      get() {
        return voiceState.enabled
      },
      set(value) {
        setJobVoice(value)
      }
    },
    error() {
      return voiceState.error
    }
  },
  methods: {
    retry: retryExecutionVoice
  }
}
</script>

<style scoped>
.job-voice-control {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.job-voice-error {
  color: #b7791f;
  font-size: 12px;
}
</style>
