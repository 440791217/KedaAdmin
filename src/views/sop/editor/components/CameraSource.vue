<template>
  <el-dialog
    title="工位摄像头拍照"
    :visible="visible"
    width="860px"
    :close-on-click-modal="false"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
    @open="load"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-loading="loading">
      <el-alert title="拍照后点击‘用于当前步骤检测’，自动绑定相机和照片；重新拍照将替换当前草稿图片及其标注。" type="info" :closable="false" />
      <p v-if="failed">工位设备加载失败。<el-button type="text" @click="load">重新加载</el-button></p>
      <el-select v-if="cameras.length" v-model="cameraId" class="camera-picker" :disabled="capturing || uploading" placeholder="选择摄像头" @change="changeCamera">
        <el-option v-for="camera in cameras" :key="camera.id" :label="camera.name + ' / ' + camera.model_name" :value="camera.id" />
      </el-select>
      <p v-if="!loading && !failed && !cameras.length">此工位尚未绑定可用摄像头，请先在设备管理中绑定工位并配置RTSP地址。</p>
      <el-alert v-if="streamError" :title="streamError" type="error" :closable="false" />
      <div v-if="cameraId" v-loading="connecting || capturing" class="camera-stage" :element-loading-text="capturing ? '正在拍照' : '正在连接摄像头'">
        <img v-if="snapshotUrl" :src="snapshotUrl" alt="待标注的摄像头照片">
        <video v-show="!snapshotUrl" ref="video" :style="{ visibility: frameRates.refresh_fps ? 'hidden' : 'visible' }" autoplay muted playsinline controls aria-label="摄像头预览" /><canvas v-show="frameRates.refresh_fps && !snapshotUrl" ref="previewCanvas" class="preview-frames" />
        <span v-if="!snapshotUrl" class="camera-fps">{{ videoFpsText }}</span>
      </div>
      <p v-if="snapshotUrl">照片已定格，确认后用于当前步骤检测；不满意可以重拍。</p>
    </div>
    <span slot="footer">
      <el-button :disabled="uploading" @click="$emit('update:visible', false)">关闭</el-button>
      <el-button v-if="cameraId && !snapshotUrl" :disabled="capturing || uploading" @click="startStream">重新连接</el-button>
      <el-button v-if="cameraId && !snapshotUrl" type="primary" :loading="capturing" :disabled="uploading || !connected" @click="capture">拍照</el-button>
      <el-button v-if="snapshotUrl" :disabled="uploading" @click="retake">重拍</el-button>
      <el-button v-if="snapshotUrl" type="primary" :loading="uploading" @click="useSnapshot">用于当前步骤检测</el-button>
    </span>
  </el-dialog>
</template>
<script src="../js/camera_source.js" />
<style scoped src="../styles/camera_source.scss" lang="scss" />
