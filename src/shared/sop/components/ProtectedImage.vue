<template>
  <div v-loading="loading" class="sop-image">
    <el-image v-if="url" :src="url" fit="contain" :preview-src-list="[url]" /><span
      v-else-if="failed"
      class="sop-note"
    >图片加载失败 <el-button type="text" @click="load">重试</el-button></span>
  </div>
</template>
<script src="../js/protected_image.js" />
<style scoped src="../styles/sop.scss" lang="scss" />
