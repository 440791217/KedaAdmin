<template>
  <div class="drawer-container">
    <header class="settings-heading"><h3>页面设置</h3><p>调整主题颜色与页面显示方式</p></header>
    <section class="appearance-section" aria-label="外观设置">
      <h4 class="section-title">外观</h4>
      <div class="drawer-item"><span>主题颜色</span><theme-picker class="drawer-theme" @change="themeChange" /></div>
      <div class="drawer-item"><span>显示页面标签栏</span><el-switch v-model="tagsView" /></div>
      <div class="drawer-item"><span>固定顶部导航</span><el-switch v-model="fixedHeader" /></div>
      <div class="drawer-item"><span>显示侧栏标志</span><el-switch v-model="sidebarLogo" /></div>
    </section>
    <el-alert v-if="failed" title="系统参数加载失败" type="error" :closable="false" />
    <el-button v-if="failed" type="text" @click="reload">重新加载</el-button>
    <p>调整可在当前页面预览；保存后作为所有终端的系统默认值。</p>
    <el-button
      v-if="$store.state.settings.systemCanManage"
      type="primary"
      size="small"
      :loading="saving"
      :disabled="failed || $store.state.settings.systemLoading"
      @click="save"
    >保存</el-button>
  </div>
</template>
<script src="./js/appearance_settings.js" />
<style scoped lang="scss" src="./styles/appearance_settings.scss" />
