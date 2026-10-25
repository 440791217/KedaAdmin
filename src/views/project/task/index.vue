<template>
  <div v-loading="loading" class="task-work">
    <el-button v-if="failed" @click="back">返回子项目</el-button>
    <el-alert v-if="failed" :title="loadMessage" type="error" :closable="false" />
    <template v-if="ready">
      <div v-if="form.id && contentReady" class="task-version-bar">
        <div><strong>内容版本</strong><el-select :value="versionKey" size="small" :loading="versionLoading" :disabled="busy || loading" placeholder="选择查看版本" @change="switchVersion"><el-option v-for="item in versionOptions" :key="item.key" :value="item.key" :label="item.label" /></el-select><el-tag size="small" :type="editMode ? 'warning' : 'info'">{{ editMode ? '编辑草稿' : '只读查看' }}</el-tag></div>
        <p>当前生效：{{ selected && selected.revision_no ? 'V' + selected.revision_no : '尚未发布' }}<span v-if="draftVersion"> ｜ 编辑草稿：{{ draftVersion.revision_no ? 'V' + draftVersion.revision_no : '未发布' }}</span> ｜ 正在打开：{{ currentVersionLabel }}</p>
        <p v-if="editMode" class="task-note">草稿修改尚未生效，发布并启用后供新作业使用。</p><p v-else class="task-note">历史版本与生效版本只读，进行中的作业保留开工时的版本。</p>
        <el-button v-if="canCopyVersion" size="small" :disabled="busy || versionFailed || versionLoading" @click="copyVersion">复制此版本为草稿</el-button>
        <p v-if="versionFailed" class="task-warning">版本列表加载失败，暂显示已知版本。<el-button type="text" @click="refreshVersions">重试</el-button></p>
      </div>
      <sop-authoring v-if="form.id && contentReady" :key="editorKey" ref="authoring" embedded :view-only="!editMode" :content-sop-id="editorSopId" :content-revision-id="editorRevisionId" :task-context="taskContext" :preview-revision="previewRevision" @published="published">
        <template slot="task-actions">
          <el-button size="small" :disabled="busy" @click="back">返回子项目</el-button>
          <el-button v-if="canEdit && !editMode" type="primary" size="small" :disabled="busy || versionLoading" @click="editContent">{{ draftVersion ? '编辑草稿' + (draftVersion.revision_no ? ' V' + draftVersion.revision_no : '') : selected.revision_id ? '创建修订草稿' : '开始编写' }}</el-button>
          <el-button v-if="editMode" size="small" :disabled="busy" @click="enterView">退出编辑</el-button>
          <el-button size="small" :disabled="busy" @click="openSettings">任务设置</el-button>
        </template>
      </sop-authoring>
      <div v-if="!form.id" class="app-container task-create">
        <el-button icon="el-icon-back" :disabled="busy" @click="back">返回子项目</el-button>
        <h3>新建SOP任务</h3>
        <p class="task-note">填写任务名称、工位和负责人，保存后直接编写步骤、图片和标注。</p>
      </div>
      <el-dialog :title="form.id ? '任务设置' : '新建SOP任务'" :visible="form.id ? settingsOpen : false" width="760px" :close-on-click-modal="false" :show-close="!busy" :close-on-press-escape="!busy" @update:visible="closeSettings">
        <div v-if="form.id">
          <el-form
            label-width="100px"
            :disabled="busy || !canEdit"
          ><el-form-item
            label="任务名称"
            required
          ><el-input v-model="form.name" maxlength="128" /></el-form-item><el-form-item
            label="负责人"
            required
          ><el-select
            v-model="form.owner_user_id"
            filterable
            remote
            :remote-method="searchOwners"
          ><el-option
            v-for="u in owners"
            :key="u.id"
            :value="u.id"
            :label="
              u.real_name + '（' + u.username + '）'
            "
          /></el-select></el-form-item><el-form-item
            label="工位"
            required
          ><el-select
            v-model="form.station_id"
            filterable
            remote
            :remote-method="searchStations"
            placeholder="搜索项目关联工位"
            no-data-text="无可选工位，请先在项目中关联可用工位"
            @change="stationChanged"
          ><el-option
            v-for="s in stations"
            :key="s.id"
            :value="s.id"
            :label="s.name"
          /></el-select><p class="task-note">{{ form.id ? '仅可切换到项目关联的可用工位；保存时重新校验设备要求。视觉检测区域需按新工位画面复核。' : '仅可选择项目关联的工位；若无选项，请先到项目详情关联工位。' }}</p><p v-if="stationLoading" class="task-note">正在加载工位设备…</p><p v-if="stationFailed" class="task-warning">工位设备加载失败，请重新选择工位后重试。</p></el-form-item><el-form-item
            v-if="station"
            label="工位设备"
          ><div v-for="d in station.devices" :key="d.id">
             {{ d.name }} · {{ d.type_code }} ·
             {{ d.status === 0 ? "可用" : "维护 / 停用" }}
           </div>
            <span
              v-if="!station.devices.length"
            >尚未绑定设备；发布时会检查步骤所需设备。</span></el-form-item><el-collapse v-model="advancedOpen"><el-collapse-item title="更多设置（编号、顺序、说明）" name="settings"><el-form-item label="编号"><el-input :value="form.code" readonly /></el-form-item><el-form-item
            label="顺序"
          ><el-input-number
            v-model="form.sort_order"
            :min="0"
            :max="1000000"
          /></el-form-item><el-form-item
            label="说明"
          ><el-input
            v-model="form.description"
            type="textarea"
            maxlength="2000"
          /></el-form-item></el-collapse-item></el-collapse></el-form>
        </div>
        <span slot="footer"><el-button :disabled="busy" @click="closeSettings">关闭</el-button><el-button v-if="canEdit" type="primary" :loading="busy" @click="save">保存设置</el-button></span>
      </el-dialog>
      <div v-if="!form.id" class="app-container task-create">
        <el-form
          label-width="100px"
          :disabled="busy || !canEdit"
        ><el-form-item
          label="任务名称"
          required
        ><el-input v-model="form.name" maxlength="128" /></el-form-item><el-form-item
          label="负责人"
          required
        ><el-select
          v-model="form.owner_user_id"
          filterable
          remote
          :remote-method="searchOwners"
        ><el-option
          v-for="u in owners"
          :key="u.id"
          :value="u.id"
          :label="
            u.real_name + '（' + u.username + '）'
          "
        /></el-select></el-form-item><el-form-item
          label="工位"
          required
        ><el-select
          v-model="form.station_id"
          filterable
          remote
          :remote-method="searchStations"
          placeholder="搜索项目关联工位"
          no-data-text="无可选工位，请先在项目中关联可用工位"
          @change="stationChanged"
        ><el-option
          v-for="s in stations"
          :key="s.id"
          :value="s.id"
          :label="s.name"
        /></el-select><p class="task-note">{{ form.id ? '仅可切换到项目关联的可用工位；保存时重新校验设备要求。视觉检测区域需按新工位画面复核。' : '仅可选择项目关联的工位；若无选项，请先到项目详情关联工位。' }}</p><p v-if="stationLoading" class="task-note">正在加载工位设备…</p><p v-if="stationFailed" class="task-warning">工位设备加载失败，请重新选择工位后重试。</p></el-form-item><el-form-item
          v-if="station"
          label="工位设备"
        ><div v-for="d in station.devices" :key="d.id">
           {{ d.name }} · {{ d.type_code }} ·
           {{ d.status === 0 ? "可用" : "维护 / 停用" }}
         </div>
          <span
            v-if="!station.devices.length"
          >尚未绑定设备；发布时会检查步骤所需设备。</span></el-form-item><el-collapse v-model="advancedOpen"><el-collapse-item title="更多设置（编号、顺序、说明）" name="settings"><el-form-item label="编号"><el-input :value="form.code" readonly /></el-form-item><el-form-item
          label="顺序"
        ><el-input-number
          v-model="form.sort_order"
          :min="0"
          :max="1000000"
        /></el-form-item><el-form-item
          label="说明"
        ><el-input
          v-model="form.description"
          type="textarea"
          maxlength="2000"
        /></el-form-item></el-collapse-item></el-collapse></el-form>
        <el-button type="primary" :loading="busy" @click="save(true)">保存并进入编辑</el-button>
      </div>
    </template>
  </div>
</template>
<script src="./js/task_work.js" />
<style scoped src="./styles/index.scss" lang="scss" />
