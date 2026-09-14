<template>
  <div class="app-container">
    <div class="page-header" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center;">
        <el-button icon="el-icon-back" size="mini" circle style="margin-right: 15px;" @click="goBack" />
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/production_management/project' }">项目管理</el-breadcrumb-item>
          <el-breadcrumb-item style="cursor:pointer;" @click.native="goBack">项目详情</el-breadcrumb-item>
          <el-breadcrumb-item>分总成工序流程配置</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div>
        <el-button type="primary" icon="el-icon-check" @click="handleSaveAll">保存工艺路线</el-button>
      </div>
    </div>

    <div class="component-banner">
      <i class="el-icon-setting" /> Current Component / 当前配置分总成：
      <span class="highlight-text">{{ currentAssemblyName }}</span>
    </div>

    <el-row :gutter="20">

      <el-col :span="8">
        <el-card class="box-card" shadow="never">
          <div slot="header" class="clearfix" style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;"><i class="el-icon-s-operation" /> 工序流水线 (可拖拽排序)</span>
            <el-button type="success" size="mini" icon="el-icon-plus" circle @click="handleAddProcess" />
          </div>

          <div v-if="processList.length === 0" class="empty-process">
            <p>暂无工序，请点击右上角按钮添加工艺步骤</p>
          </div>

          <div v-else>
            <draggable v-model="processList" animation="200" handle=".step-number" @end="onDragEnd">
              <div
                v-for="(step, index) in processList"
                :key="step.id"
                :class="['process-node-card', { 'is-active': activeProcessId === step.id }]"
                @click="selectProcess(step)"
              >
                <div class="step-number">{{ String(index + 1).padStart(2, '0') }}</div>
                <div class="step-name">{{ step.processName || '未命名工序' }}</div>
                <el-tag size="mini" :type="step.type === '检验' ? 'warning' : 'primary'">{{ step.type }}</el-tag>
                <span class="step-delete" @click.stop="handleDeleteProcess(index)">
                  <i class="el-icon-delete" />
                </span>
              </div>
            </draggable>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="box-card" shadow="never" style="min-height: 600px;">
          <div slot="header" class="clearfix">
            <span style="font-weight: bold;"><i class="el-icon-edit-outline" /> 工序详细参数设置</span>
          </div>

          <div v-if="!activeProcessId" class="form-empty">
            <i class="el-icon-guide" style="font-size: 40px; color: #ccc; margin-bottom: 10px;" />
            <p>请在左侧列表中选择具体的工艺步骤进行详细参数配置</p>
          </div>

          <el-form v-else ref="processForm" :model="activeFormData" label-width="110px" size="small">
            <h4 style="margin-top: 0; color: #409EFF; border-bottom: 1px solid #f2f6fc; padding-bottom: 10px;">
              当前步骤：第 {{ currentStepIndex + 1 }} 步 - {{ activeFormData.processName }}
            </h4>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="工序名称">
                  <el-input v-model="activeFormData.processName" placeholder="如: 激光打标 / 螺栓拧紧" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工序性质">
                  <el-radio-group v-model="activeFormData.type">
                    <el-radio-button label="加工">加工</el-radio-button>
                    <el-radio-button label="检验">检验</el-radio-button>
                    <el-radio-button label="外协">外协</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="核心制造设备">
                  <el-select v-model="activeFormData.device" placeholder="请选择绑定的设备/机床" style="width: 100%;">
                    <el-option label="全自动激光焊接机 A-01" value="dev_01" />
                    <el-option label="数字扭矩拧紧工作站 T-12" value="dev_12" />
                    <el-option label="气密性综合测试仪 Q-05" value="dev_05" />
                    <el-option label="人工流水工位 M-03" value="dev_03" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标准工时(秒)">
                  <el-input-number v-model="activeFormData.standardTime" :min="1" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="工艺控制要点">
              <el-input
                v-model="activeFormData.requirements"
                type="textarea"
                :rows="2"
                placeholder="请输入技术指标（例如：扭矩必须达到 25N·m）"
              />
            </el-form-item>

            <div class="anti-error-section" style="background-color: #fcfcfd; border: 1px dashed #dcdfe6; border-radius: 6px; padding: 15px 15px 5px 15px; margin-bottom: 18px;">
              <div style="font-weight: bold; font-size: 13px; color: #e6a23c; margin-bottom: 12px; display: flex; align-items: center;">
                <i class="el-icon-warning-outline" style="margin-right: 5px; font-size: 15px;" /> 工位安灯(Andon)交互与防错提示配置
              </div>

              <el-form-item label="语音播报内容">
                <el-input v-model="activeFormData.voiceText" placeholder="请输入推送到现场工位的 TTS 播报语音文本">
                  <el-button slot="append" type="warning" icon="el-icon-phone-outline" @click="testVoiceSpeak(activeFormData.voiceText)">
                    🔊 现场试听
                  </el-button>
                </el-input>
              </el-form-item>

              <el-form-item label="大屏文字提示">
                <el-input v-model="activeFormData.screenText" placeholder="请输入推送到工位大屏/LED看板上的醒目高亮提示词">
                  <el-button slot="append" icon="el-icon-document-copy" @click="syncFromRequirements">
                    同步工艺要点
                  </el-button>
                </el-input>
              </el-form-item>

              <el-form-item label="作业引导文字">
                <el-input v-model="activeFormData.guideText" placeholder="请输入下发给工位终端/扫码枪/智能工装的现场操作引导词">
                  <el-button slot="append" type="success" icon="el-icon-magic-stick" @click="generateGuideText">
                    💡 智能生成引导
                  </el-button>
                </el-input>
              </el-form-item>
            </div>

            <el-form-item label="作业指导图片">
              <el-upload
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :file-list="activeFormData.imageList"
                :on-preview="handlePictureCardPreview"
                :on-remove="handlePictureRemove"
                :on-change="handlePictureChange"
                multiple
              >
                <i class="el-icon-plus" />
                <div slot="tip" class="el-upload__tip" style="line-height: 20px; color: #909399;">
                  <i class="el-icon-info" /> 支持多张现场实拍标准图（JPG/PNG格式）
                </div>
              </el-upload>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog :visible.sync="dialogVisible" title="工艺图片大图预览" append-to-body width="60%">
      <img width="100%" :src="dialogImageUrl" alt="SOP指导图" style="display: block; max-height: 70vh; object-fit: contain; margin: 0 auto;">
    </el-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'AssemblyProcess',
  components: { draggable },
  data() {
    return {
      assemblyId: this.$route.params.assemblyId,
      currentAssemblyName: this.$route.query.name || '未定义部件',

      activeProcessId: null,
      activeFormData: {},

      dialogImageUrl: '',
      dialogVisible: false,

      processList: [
        {
          id: 1,
          processName: '骨架上料与身份码镭刻',
          type: '加工',
          device: 'dev_01',
          standardTime: 30,
          requirements: '扫描基体二维码，确保数据上云。',
          voiceText: '请进行基体身份码镭刻，注意扫描二维码',
          screenText: '⚠️请注意：务必先扫描基体二维码！',
          guideText: '请执行【骨架上料与身份码镭刻】，指引：扫描基体二维码，确保数据上云。',
          imageList: [{ name: 'sop1.jpg', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300' }]
        },
        {
          id: 2,
          processName: '衬套定位与机器人压装',
          type: '加工',
          device: 'dev_12',
          standardTime: 45,
          requirements: '压装深度 12.5mm，压力保持 3 秒。',
          voiceText: '开始压装，请双手离开危险区域',
          screenText: '机器人压装中，深度指标：12.5mm',
          guideText: '请执行【衬套定位与机器人压装】，指引：压装深度 12.5mm，压力保持 3 秒。',
          imageList: []
        },
        {
          id: 3,
          processName: '关键面形位公差视觉检测',
          type: '检验',
          device: 'dev_05',
          standardTime: 15,
          requirements: 'CCD相机拍照，平面度误差不得大于 0.05mm。',
          voiceText: '形位公差检测中，请保持工件静止',
          screenText: '视觉检测中：平面度公差要求 ≤ 0.05mm',
          guideText: '',
          imageList: []
        }
      ]
    }
  },
  computed: {
    currentStepIndex() {
      return this.processList.findIndex(item => item.id === this.activeProcessId)
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    selectProcess(step) {
      this.activeProcessId = step.id
      this.activeFormData = step
    },
    handleAddProcess() {
      const newStep = {
        id: new Date().getTime(),
        processName: '新加工艺步骤',
        type: '加工',
        device: '',
        standardTime: 10,
        requirements: '',
        voiceText: '',
        screenText: '',
        guideText: '',
        imageList: []
      }
      this.processList.push(newStep)
      this.selectProcess(newStep)
    },
    handleDeleteProcess(index) {
      if (this.processList[index].id === this.activeProcessId) {
        this.activeProcessId = null
        this.activeFormData = {}
      }
      this.processList.splice(index, 1)
    },
    onDragEnd() {
      this.$message.info('工艺流程链条顺序已调整')
    },
    testVoiceSpeak(text) {
      if (!text) {
        this.$message.warning('请先输入需要播报的语音文字内容')
        return
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
      } else {
        this.$message.error('当前浏览器不支持内置语音合成播报功能')
      }
    },
    syncFromRequirements() {
      if (this.activeFormData.requirements) {
        this.activeFormData.screenText = this.activeFormData.requirements
        this.$message.success('已成功同步工艺要点内容')
      } else {
        this.$message.warning('工艺控制要点内容为空，无法同步')
      }
    },
    generateGuideText() {
      const name = this.activeFormData.processName || '当前工序'
      const req = this.activeFormData.requirements || ''

      if (!this.activeFormData.processName && !this.activeFormData.requirements) {
        this.$message.warning('请先填写上面的工序名称或工艺要点后再点击生成')
        return
      }

      if (req) {
        this.activeFormData.guideText = `请执行【${name}】，现场指引：${req}`
      } else {
        this.activeFormData.guideText = `请开始执行【${name}】作业步骤。`
      }
      this.$message.success('已智能为您生成工位操作引导语')
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },
    handlePictureRemove(file, fileList) {
      this.activeFormData.imageList = fileList
    },
    handlePictureChange(file, fileList) {
      this.activeFormData.imageList = fileList
    },
    handleSaveAll() {
      console.log('完整工艺路由提交包：', this.processList)
      this.$notify({
        title: '工艺路线保存成功',
        message: `已成功保存包含现场作业引导文字在内的全套防错参数。`,
        type: 'success'
      })
    }
  }
}
</script>

<style scoped>
.component-banner {
  background: #edf2f7;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 20px;
  font-weight: 500;
  border-left: 4px solid #409EFF;
}
.highlight-text {
  color: #2b6cb0;
  font-weight: bold;
  font-size: 16px;
  margin-left: 5px;
}
.empty-process {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 0;
}
.process-node-card {
  display: flex;
  align-items: center;
  padding: 14px 15px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}
.process-node-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}
.process-node-card.is-active {
  border-color: #409EFF;
  background: #ecf5ff;
  box-shadow: 0 4px 6px -1px rgba(64, 158, 255, 0.1);
}
.step-number {
  width: 28px;
  height: 28px;
  background: #cbd5e1;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  margin-right: 15px;
  cursor: grab;
}
.process-node-card.is-active .step-number {
  background: #409EFF;
}
.step-number:active {
  cursor: grabbing;
}
.step-name {
  flex: 1;
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px;
}
.step-delete {
  color: #94a3b8;
  padding: 5px;
  font-size: 14px;
  transition: color 0.2s;
}
.step-delete:hover {
  color: #ef4444;
}
.form-empty {
  text-align: center;
  padding: 120px 0;
  color: #909399;
  font-size: 14px;
}
</style>
