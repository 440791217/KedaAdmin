<template>
  <div v-loading="loading" class="task-work">
    <el-button v-if="failed" @click="back">返回子项目</el-button>
    <el-alert v-if="failed" :title="loadMessage" type="error" :closable="false" />
    <template v-if="ready">
      <sop-authoring v-if="form.id && contentReady" :key="editorKey" ref="authoring" embedded :view-only="!editMode" :content-sop-id="editorSopId" :content-revision-id="editorRevisionId" :task-context="taskContext" :preview-revision="previewRevision" @published="published">
        <template slot="task-actions">
          <el-button size="small" :disabled="busy" @click="back">返回子项目</el-button>
          <el-button v-if="canEdit && !editMode" type="primary" size="small" :disabled="busy" @click="editContent">编辑</el-button>
          <el-button v-if="editMode" size="small" :disabled="busy" @click="enterView">查看</el-button>
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
            @change="stationChanged"
          ><el-option
            v-for="s in stations"
            :key="s.id"
            :value="s.id"
            :label="s.name"
          /></el-select><p class="task-note">{{ form.id ? '可切换到备用工位；保存时重新校验设备要求。视觉检测区域需按新工位画面复核。' : '创建时绑定此工位，制作时按该工位硬件选择设备要求。' }}</p><p v-if="stationLoading" class="task-note">正在加载工位设备…</p><p v-if="stationFailed" class="task-warning">工位设备加载失败，请重新选择工位后重试。</p></el-form-item><el-form-item
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
          @change="stationChanged"
        ><el-option
          v-for="s in stations"
          :key="s.id"
          :value="s.id"
          :label="s.name"
        /></el-select><p class="task-note">{{ form.id ? '可切换到备用工位；保存时重新校验设备要求。视觉检测区域需按新工位画面复核。' : '创建时绑定此工位，制作时按该工位硬件选择设备要求。' }}</p><p v-if="stationLoading" class="task-note">正在加载工位设备…</p><p v-if="stationFailed" class="task-warning">工位设备加载失败，请重新选择工位后重试。</p></el-form-item><el-form-item
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
