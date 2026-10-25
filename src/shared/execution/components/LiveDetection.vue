<template>
  <section class="live-detection" :class="{ embedded }">
    <header><strong>工位实时检测</strong><el-select v-model="cameraId" size="small" disabled placeholder="步骤绑定摄像头"><el-option v-for="camera in cameras" :key="camera.id" :value="camera.id" :label="camera.name" /></el-select><el-select v-model="modelId" size="small" placeholder="选择检测模型"><el-option v-for="model in models" :key="model.id" :value="model.id" :label="model.id" /></el-select><el-tag v-if="baselineAttachment" size="small" type="info">当前步骤检测图</el-tag><el-button size="small" :loading="loading || connecting" @click="reconnect">重新连接</el-button><el-checkbox v-if="executionId" v-model="showRegions">显示检测区域</el-checkbox><detection-status v-if="!embedded" :status="verdict" /></header>
    <div class="live-frame">
      <video ref="video" :style="{ visibility: cameraPool || frameRates.refresh_fps ? 'hidden' : 'visible' }" autoplay muted playsinline @loadedmetadata="videoReady" @playing="videoReady" @waiting="stopDetection" /><div v-show="cameraPool && !frameRates.refresh_fps" ref="poolVideoHost" class="pool-video-host" /><canvas v-show="frameRates.refresh_fps && !snapshotUrl" ref="previewCanvas" class="preview-frames" /><canvas ref="overlay" /><live-guidance-overlay :visual="null" :states="executionId && showRegions ? regionStates : []" :width="videoWidth" :height="videoHeight" />
      <div class="live-notices">
        <div class="recognition-status" :class="recognitionStatus.type" role="status" aria-live="polite"><i :class="recognitionStatus.icon" aria-hidden="true" /><div><strong>{{ recognitionStatus.title }}</strong><span>{{ recognitionStatus.detail }}</span><span v-if="connectionNotice" class="connection-notice">{{ connectionNotice }}</span></div></div>
      </div>
      <p class="live-caption">
        <span>{{ videoFpsText }} · {{ measuredDetectionText }}</span>
        <span v-if="result"> · {{ visibleDetections.length }} 个相关目标 · {{ result.inference_ms.toFixed(0) }} ms</span>
      </p>
    </div>
  </section>
</template>
<script src="../js/live_detection.js" />
<style scoped>
.pool-video-host { position: absolute; inset: 0; }
.preview-frames { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; background: #17212e; }
.live-detection { margin: 16px 0; padding: 16px; background: white; border: 1px solid #dfe6ec; border-radius: 6px; }
header { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.live-frame { position: relative; background: #17212e; width: 100%; min-width: 0; margin: 12px 0; }
video { display: block; width: 100%; min-height: 180px; max-height: 55vh; object-fit: contain; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
p { color: #606266; font-size: 13px; }
.live-notices { position: absolute; z-index: 2; top: 10px; left: 10px; right: 10px; pointer-events: none; }
.recognition-status { display: inline-flex; align-items: flex-start; gap: 7px; max-width: min(440px, 100%); padding: 7px 10px; border: 1px solid #ffffff26; border-radius: 5px; color: #e0eaf6; background: #172536d9; box-shadow: 0 2px 8px #00000012; }
.recognition-status > i { font-size: 15px; line-height: 20px; color: #89baff; }
.recognition-status strong { display: block; font-size: 12px; font-weight: 500; line-height: 20px; }
.recognition-status span { display: block; font-size: 11px; line-height: 1.6; color: #c0cddd; overflow-wrap: anywhere; }
.recognition-status.warning > i { color: #f1c16d; }
.recognition-status.success > i { color: #7cd3a1; }
.recognition-status .connection-notice { color: #f1c16d; }
.live-caption { position: absolute; z-index: 2; bottom: 8px; left: 10px; right: 10px; width: fit-content; max-width: calc(100% - 20px); margin: 0; background: #172536c9; border-radius: 4px; padding: 4px 7px; color: #c7d3e2; font-size: 11px; line-height: 1.6; pointer-events: none; }
.embedded { display: flex; flex: 1; flex-direction: column; min-height: 0; margin: 0; padding: 12px; border: 0; border-radius: 0; }
.embedded header { flex-shrink: 0; gap: 8px; }
.embedded header strong { display: none; }
.embedded header .el-select { width: 150px; max-width: 100%; }
.embedded .live-frame { flex: 1; min-height: 180px; width: 100%; margin: 0; }
.embedded video { position: absolute; height: 100%; min-height: 0; max-height: 100%; }
.embedded .live-caption { margin: 0; }
</style>
