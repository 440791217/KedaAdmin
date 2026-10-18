<template>
  <div class="scanner-panel">
    <h4>扫码输入测试</h4>
    <p>
      USB键盘模式：将焦点放入输入框，扫码后以回车结束。此处只检查输入，不启动任务或确认步骤。
    </p>
    <el-input
      v-model="value"
      maxlength="512"
      placeholder="点击后扫码，也可手工输入测试"
      @keyup.enter.native="receive"
    />
    <p v-if="last">最近输入：{{ last }}</p>
    <small>当前工位：{{
      stationId
    }}。键盘模式无法仅凭文字确认具体扫码枪身份。</small>
  </div>
</template>
<script src="../js/scanner_input.js" />
