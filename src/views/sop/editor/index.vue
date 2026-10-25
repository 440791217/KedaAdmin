<template>
  <div v-loading="loading" class="sop-authoring">
    <div class="authoring-top">
      <div class="authoring-identity">
        <el-button
          v-if="!embedded && !taskInfo.task_content"
          icon="el-icon-back"
          size="small"
          :disabled="busy"
          @click="$router.push({ path: `/sop/${sopId}`, query: $route.query })"
        >返回版本</el-button><strong v-if="document">{{ taskInfo.task_content ? (taskInfo.name || document.name) : document.code + ' · ' + document.name }}</strong><el-tag
          v-if="revision && (!embedded || revision.id)"
          :type="revision.status === 0 ? 'info' : 'success'"
        >V{{ revision.revision_no }} · {{ ['草稿', '已发布', '已停用'][revision.status] }}</el-tag>
      </div>
      <div class="authoring-actions"><slot name="task-actions" /><el-button v-if="!embedded && taskInfo.task_id" size="small" :disabled="busy" @click="$router.push(`/project/${taskInfo.project_id}/subproject/${taskInfo.subproject_id}/task/${taskInfo.task_id}`)">返回SOP任务</el-button>
        <el-button v-if="!embedded" size="small" :disabled="busy" @click="reload">刷新</el-button><el-button v-if="!embedded" size="small" @click="detailsDialog = true">基本资料</el-button><el-button v-if="!embedded" size="small" :disabled="busy" @click="preview">预览</el-button><el-button
          v-if="editable"
          type="primary"
          size="small"
          :loading="busy"
          :disabled="stale"
          @click="saveAll"
        >保存草稿</el-button><el-button
          v-if="editable && document.can_publish && !taskInfo.task_content"
          type="success"
          size="small"
          :disabled="busy || dirty || stale"
          @click="publish"
        >{{ taskInfo.task_id ? '仅发布版本' : '发布版本' }}</el-button><el-button v-if="editable && document.can_publish && taskInfo.task_id && taskInfo.task_version != null" type="success" size="small" :disabled="busy || dirty || stale" @click="publishAndUse">{{ taskInfo.task_content ? '发布并启用' : '发布并用于当前任务' }}</el-button>
      </div>
    </div>
    <el-alert v-if="taskInfo.task_id && !embedded" title="在此编写任务步骤、上传图片并标注；可保存草稿，下次继续编辑，或直接发布任务内容。" type="info" :closable="false" />
    <el-alert
      v-if="failed"
      title="加载失败，请刷新重试；请确认已执行SOP制作增量脚本。"
      type="error"
      :closable="false"
    />
    <el-alert
      v-if="stale"
      title="服务器内容已更新，本地修改仍保留。请复制需要保留的内容，再刷新并重新编辑。"
      type="error"
      :closable="false"
    />
    <div v-if="document && revision" class="authoring-caption">
      <template v-if="embedded">工位：{{ taskInfo.station_name || '未设置' }} · 负责人：{{ taskInfo.owner_name || '未设置' }} ·</template><template v-else>管理项目：{{ document.managing_project_name || '当前管理项目' }} ·</template>
      {{ editable ? '编辑模式 · 保存草稿或发布任务内容。' : '查看模式' }}
      <span v-if="dirty" class="unsaved">有未保存修改</span>
    </div>
    <div v-if="revision" class="authoring-columns">
      <aside class="authoring-panel authoring-steps">
        <div class="authoring-panel-title">
          <strong>操作步骤</strong><el-button
            v-if="editable"
            type="text"
            :disabled="busy"
            icon="el-icon-plus"
            @click="newStep"
          >新增</el-button>
        </div>
        <draggable :value="revision.steps" class="authoring-step-list" filter=".authoring-step-menu, .authoring-step-menu *" :prevent-on-filter="false" :disabled="!editable || busy || dirty || stale" :animation="160" ghost-class="step-drag-ghost" chosen-class="step-drag-chosen" :force-fallback="true" @input="reorderSteps">
          <div
            v-for="(step, index) in revision.steps"
            :key="step.id"
            class="authoring-step"
            :class="{ active: currentStepId === step.id }"
            role="button"
            tabindex="0"
            :aria-current="currentStepId === step.id ? 'step' : null"
            @click="selectStep(step.id)"
            @keydown.enter.self.prevent="selectStep(step.id)"
            @keydown.space.self.prevent="selectStep(step.id)"
          >
            <i v-if="editable" class="el-icon-rank step-drag-handle" :class="{ disabled: busy || dirty || stale }" :title="dirty ? '请先保存草稿再拖动' : '拖动调整步骤顺序'" aria-label="拖动排序" /><span class="step-index">{{ index + 1 }}</span><strong :title="step.title">{{ step.title }}</strong>
            <div v-if="editable" class="authoring-step-menu" @click.stop>
              <el-dropdown trigger="click" @command="$event === 'delete' ? removeStep(step) : move(index, $event === 'up' ? -1 : 1)">
                <el-button class="step-more" type="text" icon="el-icon-more" :disabled="busy || dirty" aria-label="步骤操作" />
                <el-dropdown-menu slot="dropdown"><el-dropdown-item command="up" icon="el-icon-top" :disabled="index === 0 || busy || dirty">上移</el-dropdown-item><el-dropdown-item command="down" icon="el-icon-bottom" :disabled="index === revision.steps.length - 1 || busy || dirty">下移</el-dropdown-item><el-dropdown-item command="delete" icon="el-icon-delete" :disabled="busy || dirty" divided><span class="step-delete">删除步骤</span></el-dropdown-item></el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </draggable>
        <div v-if="!revision.steps.length" class="authoring-empty">
          先新增一个步骤，填写操作内容并通过相机拍照。
        </div>
        <div class="authoring-panel-title authoring-mark-heading"><strong>当前图片标注</strong><span class="authoring-count">{{ items.length }}</span></div><div v-if="!items.length" class="authoring-mark-empty"><i class="el-icon-edit-outline" /><span>{{ editable ? '添加图片后，可绘制指引和检测区域' : '当前图片暂无标注' }}</span></div>
        <div
          v-for="item in items"
          :key="item.id"
          class="authoring-item"
          :class="{ selected: selectedId === item.id }"
          @click="
            selectedId = item.id
            inspector = 'region'
          "
        >
          <i :style="{ color: item.color }" :class="item.detect_type ? 'el-icon-aim' : 'el-icon-edit'" />
          {{ item.name }}
          <el-button
            v-if="editable"
            type="text"
            icon="el-icon-delete"
            :disabled="busy"
            @click.stop="deleteMark(item.id)"
          />
        </div>
      </aside>
      <main v-loading="imageLoading" class="authoring-panel authoring-center">
        <div class="authoring-panel-title">
          <strong>{{ activeStep ? activeStep.title : '制作画布' }}</strong>
          <div>
            <el-button size="small" :disabled="!editable || !activeStep || !taskInfo.station_id || busy || stale" icon="el-icon-camera" @click="openCamera">{{ taskInfo.station_id ? '相机拍照' : '请先关联工位' }}</el-button>
            <el-button v-if="editable && activeImage" type="text" size="mini" :disabled="busy || dirty" @click="removeImage(activeStep, activeImage)">移除图片</el-button>
          </div>
        </div>
        <div v-if="activeImage" class="authoring-tools">
          <el-tag v-if="work.detection.attachment_id === currentImageId" size="mini" type="success">检测基准</el-tag>
          <el-radio-group
            v-model="markMode"
            size="mini"
            :disabled="busy || !editable"
            @change="tool = 'select'"
          ><el-radio-button label="guide">操作指引</el-radio-button><el-radio-button label="detect">检测区域</el-radio-button></el-radio-group><el-button
            v-for="mode in tools"
            :key="mode.value"
            size="mini"
            :type="tool === mode.value ? 'primary' : ''"
            :disabled="
              busy || !editable || (markMode === 'detect' && !['select', 'rect'].includes(mode.value))
            "
            @click="chooseTool(mode.value)"
          >{{ mode.label }}</el-button><el-button
            size="mini"
            :disabled="!history.length || busy || !editable"
            @click="undo"
          >撤销</el-button><el-button size="mini" @click="zoom = Math.max(0.5, zoom - 0.25)">−</el-button><el-button size="mini" @click="zoom = 1">适应</el-button><el-button size="mini" @click="zoom = Math.min(3, zoom + 0.25)">＋</el-button>
        </div>
        <div class="authoring-canvas-scroll">
          <div v-if="imageUrl && visual" :style="{ width: `${zoom * 100}%` }">
            <visual-canvas
              :src="imageUrl"
              :width="visual.image_width || 1000"
              :height="visual.image_height || 600"
              :items="visibleItems"
              :selected-id="selectedId"
              :tool="tool"
              :readonly="!editable || busy"
              @loaded="dimensions"
              @select="
                selectedId = $event
                inspector = 'region'
              "
              @checkpoint="checkpoint"
              @create="createMark"
              @update="updateMark"
            />
          </div>
          <div v-else class="authoring-empty authoring-canvas-empty">
            <span class="canvas-empty-symbol"><i :class="imageFailed ? 'el-icon-picture-outline' : 'el-icon-picture'" /></span><strong>{{ imageFailed ? '图片暂时无法显示' : activeStep ? '为当前步骤添加图像' : '开始制作操作步骤' }}</strong><p>{{
              imageFailed
                ? '图片加载失败'
                : activeStep
                  ? (editable ? '点击相机拍照，确认照片后在画面上制作标注。' : '此步骤暂无图片。')
                  : (editable ? '从左侧新增或选择步骤。' : '暂无步骤，可点击编辑开始编写。')
            }}</p><el-button v-if="imageFailed" type="text" @click="loadImage">重试</el-button>
          </div>
        </div>
        <div class="authoring-bottom">
          <el-checkbox v-model="showGuides">操作指引</el-checkbox><el-checkbox v-model="showDetection">检测区域</el-checkbox>
          {{ visual && visual.image_width ? `${visual.image_width} × ${visual.image_height} · ` : '' }}标注
          {{ items.length }} 项 · 虚线框表示检测区域配置，尚未接入实时识别。
        </div>
      </main>
      <aside class="authoring-panel authoring-properties">
        <el-tabs
          v-model="inspector"
          stretch
        ><el-tab-pane
           label="步骤配置"
           name="step"
         ><el-form v-if="work" label-position="top" size="small" :disabled="busy || !editable">
            <el-form-item
              label="步骤名称"
            ><el-input v-model="work.step.title" maxlength="128" /></el-form-item>
            <step-detection-settings v-model="work.detection" :station-id="String(taskInfo.station_id || '')" @camera="openCamera" />
            <el-form-item
              label="操作说明"
            ><el-input
              v-model="work.step.instruction"
              type="textarea"
              :rows="4"
              placeholder="填写操作方法、检查标准及必要的注意事项"
              maxlength="10000"
            /></el-form-item><el-form-item
              label="作业时长（秒，最小为0）"
            ><el-input-number
              :value="work.step.expected_duration_seconds == null ? undefined : work.step.expected_duration_seconds"
              :min="0"
              :max="99999999.99"
              :precision="2"
              @input="work.step.expected_duration_seconds = $event == null ? null : $event"
            /></el-form-item><el-form-item label="语音提示"><el-switch v-model="work.step.voice_enabled" /></el-form-item><el-form-item
              v-if="work.step.voice_enabled"
              label="语音内容"
            ><el-input v-model="work.step.voice_text" type="textarea" maxlength="1000" /><el-button
              type="text"
              :disabled="!work.step.voice_text.trim()"
              @click="previewVoice"
            >试听</el-button></el-form-item></el-form>
           <div v-else class="authoring-empty">请选择步骤</div></el-tab-pane>
          <el-tab-pane
            label="标注属性"
            name="region"
          ><el-form
             v-if="selected"
             label-position="top"
             size="small"
             :disabled="busy || !editable"
           ><el-form-item
              label="名称"
            ><el-input
              :value="selected.name"
              maxlength="128"
              @input="property('name', $event)"
            /></el-form-item><el-form-item
              label="颜色"
            ><annotation-colors
              :value="selected.color"
              :disabled="busy || !editable"
              @input="property('color', $event)"
            /></el-form-item><el-form-item
              v-if="selected.kind === 'text'"
              label="显示文字"
            ><el-input
              :value="selected.text"
              type="textarea"
              maxlength="1000"
              @input="property('text', $event)"
            /></el-form-item><template
              v-if="selected.detect_type"
            ><el-form-item
               label="参与检测"
             ><el-switch :value="selected.enabled" @change="property('enabled', $event)" /></el-form-item><el-form-item
               label="检测类型"
             ><el-select
               :value="selected.detect_type"
               @change="property('detect_type', $event)"
             ><el-option label="目标存在" value="object" /><el-option
               label="数量"
               value="count"
             /><el-option label="状态" value="status" /><el-option
               label="OCR文字"
               value="ocr"
             /></el-select></el-form-item><el-form-item
               v-if="selected.detect_type !== 'ocr'"
               label="目标类别"
             ><target-class-select
               :value="selected.class_name"
               :reference-src="imageUrl"
               :region="selected"
               @input="property('class_name', $event)"
             /></el-form-item><el-form-item
               label="最低置信度（%）"
             ><el-input-number
               :value="selected.confidence"
               :min="0"
               :max="100"
               @change="property('confidence', $event)"
             /></el-form-item><el-form-item
               v-if="selected.detect_type === 'count'"
               label="期望数量"
             ><el-input-number
               :value="selected.expected_count"
               :min="1"
               :max="100000"
               :precision="0"
               @change="property('expected_count', $event)"
             /></el-form-item><el-form-item
               v-if="selected.detect_type === 'ocr'"
               label="期望文字"
             ><el-input
               :value="selected.expected_text"
               maxlength="1000"
               @input="property('expected_text', $event)"
             /></el-form-item><el-form-item
               v-if="selected.detect_type === 'status'"
               label="期望状态"
             ><el-input
               :value="selected.expected_state"
               maxlength="128"
               @input="property('expected_state', $event)"
             /></el-form-item>
              <div class="detection-requirement" :class="{ inactive: selected.enabled === false }" role="status">
                <span>{{ selected.enabled === false ? '检测已暂停' : '检测要求' }}</span>
                <p>{{ detectionRequirement }}</p>
              </div>
            </template>
             <p class="authoring-hint">
               {{
                 selected.detect_type ? '区域只保存检测配置，未连接模型。' : '操作指引随内容保存。'
               }}
               在画布中拖动，矩形可拖动角点调整大小。
             </p>
             <el-button
               type="danger"
               plain
               size="small"
               @click="deleteMark(selected.id)"
             >删除此标注</el-button></el-form>
            <div v-else class="authoring-empty">选择或绘制一个标注项</div></el-tab-pane></el-tabs>
      </aside>
    </div>
    <el-dialog
      :title="taskInfo.task_content ? '任务内容设置' : 'SOP版本基本资料'"
      :visible.sync="detailsDialog"
      width="650px"
      :close-on-click-modal="false"
    ><el-form
      ref="header"
      :model="header"
      label-width="100px"
      :disabled="busy || !editable"
    ><el-form-item :label="taskInfo.task_content ? '内容标题' : '版本标题'"><el-input v-model="header.title" maxlength="128" /></el-form-item><el-form-item
      label="适用范围"
    ><el-input v-model="header.applicable_scope" maxlength="1000" /></el-form-item><el-form-item
      label="目的"
    ><el-input v-model="header.purpose" type="textarea" maxlength="5000" /></el-form-item><el-form-item
      label="总注意事项"
    ><el-input v-model="header.precautions" type="textarea" maxlength="5000" /></el-form-item><el-form-item
      label="修订说明"
    ><el-input
      v-model="header.revision_note"
      type="textarea"
      maxlength="1000"
      placeholder="V2起发布前必填"
    /></el-form-item></el-form><span
      slot="footer"
    ><el-button @click="detailsDialog = false">关闭</el-button><el-button v-if="editable" type="primary" :loading="busy" @click="saveAll">保存草稿</el-button></span></el-dialog>
    <camera-source v-if="taskInfo.station_id" :visible.sync="cameraDialog" :station-id="taskInfo.station_id" :preferred-camera-id="work ? work.detection.camera_id || '' : ''" :replacing="!!activeImage" @capture="useCameraImage" />
    <step-form :visible.sync="stepDialog" :step="selectedStep" :busy="busy" @save="saveStep" />
  </div>
</template>
<script src="./js/sop_authoring.js" />
<style scoped src="./styles/authoring.scss" lang="scss" />

