<template>
  <div class="app-container process-page">
    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <el-button
          icon="el-icon-back"
          size="mini"
          circle
          @click="goBack"
        />

        <div class="page-title">
          <div class="title-main">
            工序配置
          </div>
          <div class="title-sub">
            Process Configuration
          </div>
        </div>

        <div class="toolbar-divider" />

        <el-select
          v-model="currentAssembly"
          placeholder="选择分总成"
          style="width: 220px;"
        >
          <el-option
            v-for="item in assemblyOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

        <el-tag
          size="small"
          type="info"
          style="margin-left: 10px;"
        >
          {{ processList.length }} 道工序
        </el-tag>
      </div>

      <div class="toolbar-right">
        <el-button
          icon="el-icon-refresh-left"
          @click="resetProcessList"
        >
          重置
        </el-button>

        <el-button
          type="primary"
          icon="el-icon-check"
          @click="saveProcessList"
        >
          保存工艺路线
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="process-body">
      <!-- 左侧：工序流程 -->
      <div class="left-panel">
        <div class="panel-title">
          <div>
            <i class="el-icon-s-operation" />
            工序流程
          </div>

          <el-button
            type="primary"
            size="mini"
            icon="el-icon-plus"
            circle
            @click="addProcess"
          />
        </div>

        <div class="process-tip">
          <i class="el-icon-info" />
          点击工序进行配置，可拖拽调整顺序
        </div>

        <div class="process-list">
          <draggable
            v-model="processList"
            animation="200"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <div
              v-for="(item, index) in processList"
              :key="item.id"
              class="process-item"
              :class="{ active: currentProcessId === item.id }"
              @click="selectProcess(item)"
            >
              <div class="process-line">
                <div
                  class="process-number"
                  :class="{ active: currentProcessId === item.id }"
                >
                  {{ index + 1 }}
                </div>

                <div
                  v-if="index !== processList.length - 1"
                  class="line"
                />
              </div>

              <div class="process-info">
                <div class="process-name-row">
                  <div class="process-name">
                    {{ item.processName }}
                  </div>

                  <el-tag
                    size="mini"
                    :type="getProcessTypeTag(item.type)"
                  >
                    {{ item.type }}
                  </el-tag>
                </div>

                <div class="process-meta">
                  <span>
                    <i class="el-icon-timer" />
                    {{ item.standardTime }}s
                  </span>

                  <span>
                    <i class="el-icon-monitor" />
                    {{ getDeviceName(item.device) }}
                  </span>
                </div>

                <div
                  v-if="item.type === '检验'"
                  class="vision-status"
                >
                  <i class="el-icon-view" />
                  视觉检测
                  <span>
                    · {{ getRegionCount(item) }} 个区域
                  </span>
                </div>
              </div>

              <div class="process-actions">
                <i
                  class="el-icon-rank drag-handle"
                  title="拖拽排序"
                />

                <i
                  class="el-icon-delete"
                  title="删除工序"
                  @click.stop="deleteProcess(index)"
                />
              </div>
            </div>
          </draggable>
        </div>

        <div class="add-process-wrapper">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            style="width: 100%;"
            @click="addProcess"
          >
            添加工序
          </el-button>
        </div>
      </div>

      <!-- 中间：工序参数 -->
      <div class="center-panel">
        <template v-if="currentProcess">
          <div class="panel-title center-title">
            <div>
              <i class="el-icon-edit-outline" />
              工序参数
            </div>

            <el-tag
              size="small"
              :type="getProcessTypeTag(currentProcess.type)"
            >
              第 {{ currentProcessIndex + 1 }} 道工序
            </el-tag>
          </div>

          <div class="form-container">
            <div class="section-title">
              <span class="section-icon">01</span>
              基础信息
            </div>

            <el-form
              :model="currentProcess"
              label-position="top"
              size="small"
            >
              <el-row :gutter="18">
                <el-col :span="14">
                  <el-form-item label="工序名称">
                    <el-input
                      v-model="currentProcess.processName"
                      placeholder="请输入工序名称"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="10">
                  <el-form-item label="工序性质">
                    <el-select
                      v-model="currentProcess.type"
                      style="width: 100%;"
                      @change="handleTypeChange"
                    >
                      <el-option
                        label="加工"
                        value="加工"
                      />
                      <el-option
                        label="检验"
                        value="检验"
                      />
                      <el-option
                        label="装配"
                        value="装配"
                      />
                      <el-option
                        label="外协"
                        value="外协"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="18">
                <el-col :span="14">
                  <el-form-item label="核心制造设备">
                    <el-select
                      v-model="currentProcess.device"
                      placeholder="请选择设备"
                      style="width: 100%;"
                    >
                      <el-option
                        v-for="item in deviceOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="10">
                  <el-form-item label="标准工时（秒）">
                    <el-input-number
                      v-model="currentProcess.standardTime"
                      :min="1"
                      :max="3600"
                      controls-position="right"
                      style="width: 100%;"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="工艺控制要点">
                <el-input
                  v-model="currentProcess.requirements"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入关键工艺要求、质量要求和技术指标"
                />
              </el-form-item>
            </el-form>

            <div class="section-title section-margin">
              <span class="section-icon">02</span>
              现场作业指导
            </div>

            <el-form
              :model="currentProcess"
              label-position="top"
              size="small"
            >
              <el-form-item label="作业引导文字">
                <el-input
                  v-model="currentProcess.guideText"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入现场操作步骤或作业指导"
                />
              </el-form-item>

              <el-form-item label="作业指导图片">
                <div class="image-area">
                  <div
                    v-for="(image, index) in currentProcess.imageList"
                    :key="index"
                    class="guide-image"
                  >
                    <img
                      :src="image.url"
                      alt=""
                    >

                    <div class="image-mask">
                      <i
                        class="el-icon-zoom-in"
                        @click="previewImage(image)"
                      />

                      <i
                        class="el-icon-delete"
                        @click="removeImage(index)"
                      />
                    </div>
                  </div>

                  <div
                    class="upload-box"
                    @click="mockUploadImage"
                  >
                    <i class="el-icon-plus" />
                    <span>添加图片</span>
                  </div>
                </div>

                <div class="form-tip">
                  支持添加标准作业图、设备操作图或质量示意图
                </div>
              </el-form-item>
            </el-form>
          </div>
        </template>

        <div
          v-else
          class="empty-center"
        >
          <i class="el-icon-guide" />
          <div>请选择需要配置的工序</div>
          <span>从左侧工序流程中选择一个工序进行编辑</span>
        </div>
      </div>

      <!-- 右侧：扩展配置 -->
      <div class="right-panel">
        <template v-if="currentProcess">
          <div class="panel-title">
            <div>
              <i class="el-icon-setting" />
              扩展配置
            </div>
          </div>

          <div class="right-content">
            <div class="right-section-title">
              <span class="right-title-icon voice">
                <i class="el-icon-microphone" />
              </span>
              现场交互
            </div>

            <el-form
              :model="currentProcess"
              label-position="top"
              size="small"
            >
              <el-form-item label="语音播报">
                <el-input
                  v-model="currentProcess.voiceText"
                  type="textarea"
                  :rows="2"
                  placeholder="现场TTS语音提示"
                />

                <el-button
                  size="mini"
                  icon="el-icon-video-play"
                  class="full-button"
                  @click="testVoice"
                >
                  试听语音
                </el-button>
              </el-form-item>

              <el-form-item label="大屏提示">
                <el-input
                  v-model="currentProcess.screenText"
                  type="textarea"
                  :rows="2"
                  placeholder="工位大屏显示内容"
                />

                <el-button
                  size="mini"
                  class="full-button"
                  @click="syncRequirements"
                >
                  同步工艺控制要点
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 检验工序 -->
            <template v-if="currentProcess.type === '检验'">
              <div class="right-divider" />

              <div class="right-section-title">
                <span class="right-title-icon vision">
                  <i class="el-icon-view" />
                </span>

                视觉检测

                <el-tag
                  size="mini"
                  type="success"
                  style="margin-left: auto;"
                >
                  已启用
                </el-tag>
              </div>

              <div class="config-label">
                检测相机
              </div>

              <el-select
                v-model="currentProcess.cameraId"
                size="small"
                class="config-select"
              >
                <el-option
                  label="CAM-01 工位主相机"
                  value="cam01"
                />
              </el-select>

              <div class="config-label">
                检测模型
              </div>

              <el-select
                v-model="currentProcess.modelId"
                size="small"
                class="config-select"
              >
                <el-option
                  label="YOLO 视觉检测模型"
                  value="yolo_demo"
                />
              </el-select>

              <div class="vision-card">
                <div class="vision-card-top">
                  <div class="vision-card-icon">
                    <i class="el-icon-crop" />
                  </div>

                  <div class="vision-card-info">
                    <div class="vision-card-title">
                      检测区域
                    </div>
                    <div class="vision-card-desc">
                      ROI Region
                    </div>
                  </div>

                  <div class="region-number">
                    {{ getRegionCount(currentProcess) }}
                  </div>
                </div>

                <div class="vision-card-message">
                  已配置
                  <strong>
                    {{ getRegionCount(currentProcess) }}
                  </strong>
                  个检测区域
                </div>

                <el-button
                  type="primary"
                  size="small"
                  icon="el-icon-edit-outline"
                  style="width: 100%;"
                  @click="openAnnotation"
                >
                  进入区域标注
                </el-button>
              </div>

              <div class="vision-summary">
                <div class="summary-item">
                  <span>检测方式</span>
                  <strong>AI视觉</strong>
                </div>

                <div class="summary-item">
                  <span>当前相机</span>
                  <strong>
                    {{ getCameraName(currentProcess.cameraId) }}
                  </strong>
                </div>

                <div class="summary-item">
                  <span>区域数量</span>
                  <strong>
                    {{ getRegionCount(currentProcess) }}
                  </strong>
                </div>
              </div>
            </template>

            <!-- 普通工序 -->
            <template v-else>
              <div class="right-divider" />

              <div class="normal-process-card">
                <i class="el-icon-setting" />

                <div class="normal-title">
                  普通工序
                </div>

                <div class="normal-desc">
                  当前工序无需配置视觉检测区域
                </div>

                <el-button
                  size="mini"
                  type="primary"
                  plain
                  @click="setAsInspection"
                >
                  设置为检验工序
                </el-button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-dialog
      :visible.sync="imageDialogVisible"
      title="作业指导图片"
      width="60%"
      append-to-body
    >
      <img
        :src="previewImageUrl"
        class="preview-image"
        alt=""
      >
    </el-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

const createDemoProcess = () => ({
  id: 1,
  processName: '关键部位视觉检测',
  type: '检验',
  device: 'dev_01',
  standardTime: 15,
  requirements: '检测关键装配部位，确认零部件安装状态正确。',
  guideText: '将产品放置到检测位置，保持静止并启动视觉检测。',
  voiceText: '视觉检测中，请保持工件静止。',
  screenText: 'AI视觉检测中，请勿移动产品',
  imageList: [
    {
      name: 'sop-demo.jpg',
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500'
    }
  ],
  cameraId: 'cam01',
  modelId: 'yolo_demo',
  visionConfig: {
    regions: [
      {
        id: 1,
        name: '检测区域',
        detectType: 'object',
        className: 'workpiece',
        confidence: 80,
        expectedCount: 1,
        enabled: true,
        color: '#409EFF',
        x: 28,
        y: 26,
        width: 44,
        height: 48
      }
    ]
  }
})

export default {
  name: 'ProcessConfig',
  components: {
    draggable
  },
  data() {
    return {
      currentAssembly: 'assembly01',
      currentProcessId: 1,
      processSeed: 2,
      imageDialogVisible: false,
      previewImageUrl: '',
      assemblyOptions: [
        {
          label: '前副车架分总成',
          value: 'assembly01'
        }
      ],
      deviceOptions: [
        {
          label: '视觉检测工作站 V-01',
          value: 'dev_01'
        }
      ],
      processList: [
        createDemoProcess()
      ]
    }
  },
  computed: {
    currentProcess() {
      return this.processList.find(
        item => item.id === this.currentProcessId
      ) || null
    },
    currentProcessIndex() {
      return this.processList.findIndex(
        item => item.id === this.currentProcessId
      )
    }
  },
  methods: {
    goBack() {
      if (this.$router) {
        this.$router.go(-1)
      }
    },
    selectProcess(item) {
      this.currentProcessId = item.id
      this.initVisionConfig(item)
    },
    initVisionConfig(item) {
      if (!item) {
        return
      }

      if (!item.visionConfig) {
        this.$set(item, 'visionConfig', {
          regions: []
        })
      }

      if (!item.visionConfig.regions) {
        this.$set(item.visionConfig, 'regions', [])
      }

      if (typeof item.cameraId === 'undefined') {
        this.$set(item, 'cameraId', '')
      }

      if (typeof item.modelId === 'undefined') {
        this.$set(item, 'modelId', '')
      }
    },
    addProcess() {
      const item = {
        id: this.processSeed++,
        processName: '新工序',
        type: '加工',
        device: '',
        standardTime: 30,
        requirements: '',
        guideText: '',
        voiceText: '',
        screenText: '',
        imageList: [],
        cameraId: '',
        modelId: '',
        visionConfig: {
          regions: []
        }
      }

      this.processList.push(item)
      this.currentProcessId = item.id
      this.$message.success('已添加新工序')
    },
    deleteProcess(index) {
      const item = this.processList[index]

      this.$confirm(
        `确定删除工序“${item.processName}”吗？`,
        '删除工序',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          const isCurrent = item.id === this.currentProcessId

          this.processList.splice(index, 1)

          if (isCurrent) {
            if (this.processList.length > 0) {
              const nextIndex = Math.min(
                index,
                this.processList.length - 1
              )
              this.currentProcessId = this.processList[nextIndex].id
            } else {
              this.currentProcessId = null
            }
          }

          this.$message.success('工序已删除')
        })
        .catch(() => {})
    },
    handleDragEnd() {
      this.$message.success('工序顺序已调整')
    },
    handleTypeChange(value) {
      if (value !== '检验') {
        return
      }

      this.initVisionConfig(this.currentProcess)

      if (!this.currentProcess.cameraId) {
        this.currentProcess.cameraId = 'cam01'
      }

      if (!this.currentProcess.modelId) {
        this.currentProcess.modelId = 'yolo_demo'
      }
    },
    setAsInspection() {
      if (!this.currentProcess) {
        return
      }

      this.currentProcess.type = '检验'
      this.handleTypeChange('检验')
      this.$message.success('已设置为检验工序')
    },
    getProcessTypeTag(type) {
      if (type === '检验') {
        return 'warning'
      }

      if (type === '装配') {
        return 'success'
      }

      if (type === '外协') {
        return 'info'
      }

      return ''
    },
    getDeviceName(value) {
      const item = this.deviceOptions.find(
        device => device.value === value
      )

      return item ? item.label : '未绑定设备'
    },
    getRegionCount(item) {
      if (!item || !item.visionConfig || !item.visionConfig.regions) {
        return 0
      }

      return item.visionConfig.regions.length
    },
    getCameraName(cameraId) {
      return cameraId === 'cam01'
        ? 'CAM-01'
        : '未配置'
    },
    openAnnotation() {
      if (!this.currentProcess) {
        this.$message.warning('请先选择工序')
        return
      }

      if (this.currentProcess.type !== '检验') {
        this.$message.warning('只有检验工序可以配置检测区域')
        return
      }

      this.$message.success(
        `进入【${this.currentProcess.processName}】区域标注`
      )

      console.log(
        'ROI标注工序：',
        JSON.parse(JSON.stringify(this.currentProcess))
      )

      /*
      this.$router.push({
        name: 'SopAnnotation',
        params: {
          processId: this.currentProcess.id
        },
        query: {
          assemblyId: this.currentAssembly,
          processName: this.currentProcess.processName
        }
      })
      */
    },
    testVoice() {
      if (!this.currentProcess) {
        return
      }

      const text = this.currentProcess.voiceText

      if (!text) {
        this.$message.warning('请先填写语音播报内容')
        return
      }

      if (!('speechSynthesis' in window)) {
        this.$message.warning('当前浏览器不支持语音播放')
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'

      window.speechSynthesis.speak(utterance)
    },
    syncRequirements() {
      if (!this.currentProcess) {
        return
      }

      if (!this.currentProcess.requirements) {
        this.$message.warning('请先填写工艺控制要点')
        return
      }

      this.currentProcess.screenText =
        this.currentProcess.requirements

      this.$message.success('已同步工艺控制要点')
    },
    mockUploadImage() {
      if (!this.currentProcess) {
        return
      }

      if (this.currentProcess.imageList.length > 0) {
        this.$message.info('演示数据保留一张图片即可')
        return
      }

      this.currentProcess.imageList.push({
        name: 'sop-demo.jpg',
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500'
      })

      this.$message.success('演示图片已添加')
    },
    removeImage(index) {
      if (!this.currentProcess) {
        return
      }

      this.currentProcess.imageList.splice(index, 1)
    },
    previewImage(image) {
      this.previewImageUrl = image.url
      this.imageDialogVisible = true
    },
    saveProcessList() {
      console.log(
        '工序配置：',
        JSON.parse(JSON.stringify(this.processList))
      )

      this.$message.success(
        `保存成功，共 ${this.processList.length} 道工序`
      )
    },
    resetProcessList() {
      this.$confirm(
        '确定恢复演示数据吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          this.processList = [
            createDemoProcess()
          ]
          this.currentProcessId = 1
          this.processSeed = 2
          this.$message.success('已恢复演示数据')
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.process-page {
  height: calc(100vh - 84px);
  min-height: 680px;
  padding: 20px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.top-toolbar {
  height: 64px;
  padding: 0 18px;
  margin-bottom: 15px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

.page-title {
  margin-left: 12px;
}

.title-main {
  color: #303133;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
}

.title-sub {
  color: #a8abb2;
  font-size: 10px;
  line-height: 15px;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  margin: 0 18px;
  background: #ebeef5;
}

.process-body {
  height: calc(100% - 79px);
  display: grid;
  grid-template-columns: 285px minmax(520px, 1fr) 300px;
  gap: 15px;
}

.left-panel,
.center-panel,
.right-panel {
  min-height: 0;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.left-panel,
.right-panel {
  overflow-y: auto;
}

.center-panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-title {
  height: 50px;
  padding: 0 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  box-sizing: border-box;
}

.panel-title i {
  margin-right: 6px;
  color: #409EFF;
}

.process-tip {
  margin: 10px;
  padding: 8px 10px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 3px;
  font-size: 11px;
  line-height: 18px;
}

.process-tip i {
  margin-right: 4px;
}

.process-list {
  padding: 5px 10px;
}

.process-item {
  position: relative;
  min-height: 82px;
  display: flex;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s;
}

.process-item:hover {
  background: #f5f7fa;
}

.process-item.active {
  background: #ecf5ff;
}

.process-line {
  position: relative;
  width: 43px;
  display: flex;
  justify-content: center;
}

.process-number {
  position: relative;
  z-index: 2;
  width: 28px;
  height: 28px;
  margin-top: 12px;
  color: #909399;
  background: #f0f2f5;
  border: 2px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 11px;
  font-weight: 600;
}

.process-number.active {
  color: #ffffff;
  background: #409EFF;
}

.line {
  position: absolute;
  top: 38px;
  bottom: -12px;
  left: 21px;
  width: 1px;
  background: #dcdfe6;
}

.process-info {
  flex: 1;
  min-width: 0;
  padding: 10px 3px;
}

.process-name-row {
  display: flex;
  align-items: center;
}

.process-name {
  flex: 1;
  min-width: 0;
  margin-right: 5px;
  color: #303133;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-meta {
  margin-top: 7px;
  color: #909399;
  font-size: 10px;
  line-height: 17px;
}

.process-meta span {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-meta i {
  width: 15px;
}

.vision-status {
  margin-top: 4px;
  color: #409EFF;
  font-size: 10px;
}

.vision-status span {
  color: #909399;
}

.process-actions {
  width: 25px;
  padding-top: 12px;
  color: #c0c4cc;
  text-align: center;
}

.process-actions i {
  display: block;
  margin-bottom: 12px;
  cursor: pointer;
}

.process-actions i:hover {
  color: #409EFF;
}

.process-actions .el-icon-delete:hover {
  color: #f56c6c;
}

.drag-handle {
  cursor: move !important;
}

.add-process-wrapper {
  padding: 10px;
}

.center-title {
  flex-shrink: 0;
}

.form-container {
  flex: 1;
  padding: 20px 24px 30px;
  overflow-y: auto;
}

.section-title {
  height: 28px;
  margin-bottom: 15px;
  color: #303133;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}

.section-margin {
  margin-top: 15px;
}

.section-icon {
  width: 26px;
  height: 22px;
  margin-right: 8px;
  color: #409EFF;
  background: #ecf5ff;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.form-container >>> .el-form-item {
  margin-bottom: 18px;
}

.form-container >>> .el-form-item__label {
  padding-bottom: 5px;
  color: #606266;
  font-size: 12px;
  line-height: 20px;
}

.form-tip {
  margin-top: 7px;
  color: #c0c4cc;
  font-size: 10px;
}

.image-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.guide-image,
.upload-box {
  width: 110px;
  height: 82px;
  border-radius: 4px;
  box-sizing: border-box;
}

.guide-image {
  position: relative;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.guide-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-mask {
  position: absolute;
  inset: 0;
  opacity: 0;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  transition: all 0.2s;
}

.guide-image:hover .image-mask {
  opacity: 1;
}

.image-mask i {
  cursor: pointer;
  font-size: 18px;
}

.upload-box {
  color: #909399;
  border: 1px dashed #d9d9d9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-box:hover {
  color: #409EFF;
  border-color: #409EFF;
}

.upload-box i {
  margin-bottom: 6px;
  font-size: 22px;
}

.upload-box span {
  font-size: 11px;
}

.empty-center {
  flex: 1;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-center > i {
  margin-bottom: 15px;
  color: #c0c4cc;
  font-size: 45px;
}

.empty-center div {
  color: #606266;
  font-size: 14px;
}

.empty-center span {
  margin-top: 7px;
  color: #c0c4cc;
  font-size: 11px;
}

.right-content {
  padding: 15px;
}

.right-content >>> .el-form-item {
  margin-bottom: 15px;
}

.right-content >>> .el-form-item__label {
  padding-bottom: 5px;
  color: #606266;
  font-size: 11px;
  line-height: 18px;
}

.right-section-title {
  height: 30px;
  margin-bottom: 12px;
  color: #303133;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.right-title-icon {
  width: 26px;
  height: 26px;
  margin-right: 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.right-title-icon.voice {
  color: #e6a23c;
  background: #fdf6ec;
}

.right-title-icon.vision {
  color: #409EFF;
  background: #ecf5ff;
}

.right-divider {
  height: 1px;
  margin: 20px 0;
  background: #ebeef5;
}

.full-button {
  width: 100%;
  margin-top: 7px;
}

.config-label {
  margin-bottom: 6px;
  color: #606266;
  font-size: 11px;
}

.config-select {
  width: 100%;
  margin-bottom: 15px;
}

.vision-card {
  padding: 13px;
  margin-top: 3px;
  background: #f8fbff;
  border: 1px solid #d9ecff;
  border-radius: 5px;
}

.vision-card-top {
  display: flex;
  align-items: center;
}

.vision-card-icon {
  width: 38px;
  height: 38px;
  margin-right: 10px;
  color: #409EFF;
  background: #ecf5ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vision-card-icon i {
  font-size: 19px;
}

.vision-card-info {
  flex: 1;
}

.vision-card-title {
  color: #303133;
  font-size: 12px;
  font-weight: 600;
}

.vision-card-desc {
  margin-top: 3px;
  color: #c0c4cc;
  font-size: 9px;
}

.region-number {
  color: #409EFF;
  font-size: 24px;
  font-weight: 600;
}

.vision-card-message {
  margin: 12px 0;
  padding: 8px;
  color: #909399;
  background: #ffffff;
  border-radius: 3px;
  text-align: center;
  font-size: 10px;
}

.vision-card-message strong {
  margin: 0 3px;
  color: #409EFF;
}

.vision-summary {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.summary-item {
  min-height: 34px;
  padding: 0 10px;
  border-bottom: 1px solid #f2f6fc;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item span {
  color: #909399;
  font-size: 10px;
}

.summary-item strong {
  color: #606266;
  font-size: 10px;
  font-weight: 500;
}

.normal-process-card {
  padding: 25px 10px;
  color: #909399;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 5px;
  text-align: center;
}

.normal-process-card > i {
  margin-bottom: 10px;
  color: #c0c4cc;
  font-size: 30px;
}

.normal-title {
  margin-bottom: 5px;
  color: #606266;
  font-size: 12px;
}

.normal-desc {
  margin-bottom: 15px;
  color: #c0c4cc;
  font-size: 10px;
}

.preview-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media screen and (max-width: 1350px) {
  .process-page {
    padding: 12px;
  }

  .process-body {
    grid-template-columns: 250px minmax(460px, 1fr) 270px;
  }
}
</style>
