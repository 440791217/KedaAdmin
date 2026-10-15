
<template>
  <div class="mock-scene">
    <div class="scene-top">
      <span>CAM-01</span>
      <span>1920 × 1080</span>
    </div>

    <div class="workbench">
      <div class="machine">
        <div class="machine-head">
          <div class="camera-lens" />
        </div>

        <div class="machine-body">
          <div class="product">
            <div class="product-label">
              PRODUCT
            </div>

            <div class="screw screw-1" />
            <div class="screw screw-2" />
            <div class="screw screw-3" />
            <div class="screw screw-4" />

            <div class="part part-1" />
            <div class="part part-2" />
          </div>
        </div>
      </div>
    </div>

    <div class="scene-tip">
      模拟现场画面 · 后续可替换为摄像头截图
    </div>
  </div>
</template>

<script>
export default {
  name: 'MockScene'
}
</script>
