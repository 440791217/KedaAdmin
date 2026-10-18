<template>
  <div v-loading="loading" class="resource-panel">
    <div class="resource-toolbar">
      <el-input
        v-model="query.keyword"
        clearable
        :placeholder="
          ['station', 'device'].includes(kind)
            ? '编号 / 名称 / IP'
            : '编号 / 名称'
        "
        @keyup.enter.native="search"
      /><el-select
        v-model="query.status"
        clearable
        placeholder="全部状态"
      ><el-option
        v-for="(label, value) in statuses"
        :key="value"
        :label="label"
        :value="Number(value)"
      /></el-select><el-button
        type="primary"
        icon="el-icon-search"
        @click="search"
      >查询</el-button><el-button
        v-if="canManage"
        type="success"
        icon="el-icon-plus"
        @click="open()"
      >新建{{ title }}</el-button>
    </div>
    <el-alert
      v-if="failed"
      :title="failureMessage"
      :description="failureHint"
      type="error"
      :closable="false"
    />
    <el-table
      :data="items"
      border
    ><el-table-column
      prop="code"
      :label="kind === 'device' ? '设备编号' : '编号'"
      min-width="220"
    /><el-table-column
      prop="name"
      label="名称"
      min-width="160"
    /><el-table-column
      v-if="kind === 'station'"
      label="位置"
      min-width="150"
    ><template slot-scope="{ row }">{{
      row.location_name || row.location || "待补充"
    }}</template></el-table-column><el-table-column
      v-if="kind === 'station'"
      prop="ip_address"
      label="工位IP"
      min-width="155"
    ><template slot-scope="{ row }">{{
      row.ip_address || "待补充"
    }}</template></el-table-column><el-table-column
      v-if="kind === 'model'"
      prop="type_code"
      label="类型"
      width="140"
    /><el-table-column
      v-if="kind === 'model'"
      prop="specification"
      label="规格"
      min-width="160"
    /><el-table-column
      v-if="kind === 'device'"
      prop="model_name"
      label="设备规格"
      min-width="150"
    /><el-table-column
      v-if="kind === 'device'"
      prop="station_name"
      label="绑定工位"
      min-width="130"
    /><el-table-column
      v-if="kind === 'device'"
      label="通信方式"
      width="100"
    ><template slot-scope="{ row }">{{
      transportLabels[row.transport] || "未配置"
    }}</template></el-table-column><el-table-column
      v-if="kind === 'device'"
      prop="protocol"
      label="协议 / 模式"
      width="125"
    /><el-table-column
      v-if="kind === 'device'"
      label="IP / 接入地址"
      min-width="190"
    ><template
      slot-scope="{ row }"
    >{{ connectionAddress(row)
    }}<el-tag
      v-if="row.connection_enabled === 0"
      size="mini"
      type="info"
    >连接已禁用</el-tag></template></el-table-column><el-table-column
      label="状态"
      width="90"
    ><template
      slot-scope="{ row }"
    ><el-tag :type="row.status === 0 ? 'success' : 'info'">{{
      statuses[row.status]
    }}</el-tag></template></el-table-column><el-table-column
      prop="description"
      label="说明"
      min-width="150"
      show-overflow-tooltip
    /><el-table-column
      label="操作"
      width="110"
      align="center"
    ><template
      slot-scope="{ row }"
    ><el-dropdown
      trigger="click"
      @command="command($event, row)"
    ><el-button
      size="mini"
      type="primary"
      plain
      :disabled="busy"
    >编辑<i class="el-icon-arrow-down el-icon--right" /></el-button><el-dropdown-menu
      slot="dropdown"
    ><el-dropdown-item command="view">查看详情</el-dropdown-item><el-dropdown-item
      v-if="canManage"
      command="edit"
    >编辑资料</el-dropdown-item><el-dropdown-item
      v-if="canManage"
      command="delete"
      divided
    >删除</el-dropdown-item></el-dropdown-menu></el-dropdown></template></el-table-column></el-table>
    <pagination
      :total="total"
      :page.sync="query.page"
      :limit.sync="query.limit"
      @pagination="load"
    />
    <el-dialog
      :title="(form.id ? '编辑' : '新建') + title"
      :visible.sync="dialog"
      :width="kind === 'device' ? '860px' : '640px'"
      custom-class="resource-edit-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        :label-width="kind === 'device' ? '130px' : '100px'"
        :disabled="busy"
      ><el-form-item
         :label="kind === 'device' ? '设备编号' : '编号'"
       ><el-input :value="form.code" readonly />
         <div class="resource-note">
           系统自动生成，无需填写；保存失败重试时沿用此编号。
         </div></el-form-item><el-form-item
          label="名称"
          required
        ><el-input
          v-model="form.name"
          :maxlength="kind === 'location' ? 255 : 128"
        /></el-form-item>
        <template
          v-if="kind === 'station'"
        ><el-form-item
          label="位置"
          required
        ><el-select
           v-model="form.location_id"
           filterable
           remote
           :remote-method="searchLocations"
           :loading="locationLoading"
           placeholder="请选择位置，支持搜索"
           @visible-change="$event && searchLocations('')"
         ><el-option
           v-for="l in locations"
           :key="l.id"
           :value="l.id"
           :label="l.name"
           :disabled="l.status !== 0"
         /></el-select>
          <div class="resource-note">
            清单来自“现场资源 → 位置管理”，可先录入位置。
          </div></el-form-item><el-form-item
          label="工位IP"
          required
        ><el-input
           v-model="form.ip_address"
           maxlength="45"
           placeholder="例如 192.168.1.101，支持IPv4 / IPv6"
         />
          <div class="resource-note">
            绑定工位终端的IP；每个有效工位使用独立IP。
          </div></el-form-item></template>
        <template
          v-if="kind === 'model'"
        ><el-form-item
          label="类型"
          required
        ><el-select
          v-model="form.type_code"
          filterable
          allow-create
          default-first-option
        ><el-option
          v-for="t in types"
          :key="t.value"
          :label="t.label"
          :value="t.value"
        /></el-select></el-form-item><el-form-item
          label="型号"
        ><el-input v-model="form.model" maxlength="128" /></el-form-item><el-form-item
          label="规格"
        ><el-input
          v-model="form.specification"
          type="textarea"
          maxlength="1000"
        /></el-form-item><el-form-item
          label="单位"
          required
        ><el-input v-model="form.unit" maxlength="32" /></el-form-item></template>
        <template
          v-if="kind === 'device'"
        ><el-form-item
          label="设备规格"
          required
        ><el-select
          v-model="form.model_id"
          filterable
          remote
          :remote-method="searchModels"
          placeholder="搜索规格"
          @change="modelChanged"
        ><el-option
          v-for="m in models"
          :key="m.id"
          :label="m.name + ' ' + (m.specification || '')"
          :value="m.id"
        /></el-select></el-form-item><el-form-item
          label="绑定工位"
        ><el-select
          v-model="form.station_id"
          clearable
          filterable
          remote
          :remote-method="searchStations"
          placeholder="可暂不绑定，搜索工位"
        ><el-option
          v-for="s in stations"
          :key="s.id"
          :label="s.name"
          :value="s.id"
        /></el-select></el-form-item><el-form-item
          label="厂家序列号"
        ><el-input
          v-model="form.serial_number"
          placeholder="选填，厂家出厂编号；没有可留空"
          maxlength="128"
        /></el-form-item><el-divider content-position="left">通信配置</el-divider><connection-fields
          v-if="form.connection"
          v-model="form.connection"
          :disabled="busy"
        /></template>
        <el-form-item
          v-if="kind === 'station' || kind === 'device'"
          label="负责人"
        ><el-select
          v-model="form.owner_user_id"
          clearable
          filterable
          remote
          :remote-method="searchOwners"
        ><el-option
          v-for="u in owners"
          :key="u.id"
          :label="u.real_name + '（' + u.username + '）'"
          :value="u.id"
        /></el-select></el-form-item><el-form-item
          label="状态"
        ><el-select
          v-model="form.status"
        ><el-option
          v-for="(label, value) in statuses"
          :key="value"
          :label="label"
          :value="Number(value)"
        /></el-select></el-form-item><el-form-item
          label="说明"
        ><el-input
          v-model="form.description"
          type="textarea"
          maxlength="2000"
        /></el-form-item></el-form><span
        slot="footer"
      ><el-button :disabled="busy" @click="dialog = false">取消</el-button><el-button
        type="primary"
        :loading="busy"
        @click="save"
      >保存</el-button></span>
    </el-dialog>
    <el-dialog
      title="资源详情"
      :visible.sync="details"
      :width="kind === 'station' ? '1000px' : '760px'"
      custom-class="resource-edit-dialog"
    ><template
      v-if="detail"
    ><h3>{{ detail.name }}</h3>
      <p>{{ detail.code }}</p>
      <p>{{ detail.description || "暂无说明" }}</p>
      <p v-if="kind === 'station'">
        位置：{{ detail.location_name || detail.location || "待补充" }} ·
        工位IP：{{ detail.ip_address || "待补充" }}。
        在“工具与设备”中编辑设备即可绑定或移出此工位。
      </p>
      <el-table
        v-if="kind === 'station'"
        :data="detail.devices || []"
        border
      ><el-table-column prop="name" label="绑定设备" /><el-table-column
        prop="type_code"
        label="类型"
      /><el-table-column
        prop="code"
        label="编号"
        min-width="210"
      /></el-table><scanner-input
        v-if="kind === 'station'"
        :station-id="detail.id"
      /><station-tasks v-if="details && kind === 'station'" :key="detail.id" :station="detail" /><template
        v-if="kind === 'device'"
      ><p>连接状态：{{ detail.connection_state }}</p><p v-if="detail.connection && detail.connection.protocol === 'rtsp'">RTSP 地址：{{ rtspAddress(detail.connection) }}</p><p v-else-if="detail.connection && detail.connection.transport === 'network'">设备IP / 主机：{{ detail.connection.host }}；端口：{{ detail.connection.port }}</p><p v-if="detail.connection && ['usb','serial'].includes(detail.connection.transport)">接入电脑：{{ detail.connection.host_key }}；设备标识：{{ detail.connection.device_key }}</p>
        <p>
          连接方式：{{
            detail.connection
              ? detail.connection.transport +
                " / " +
                detail.connection.protocol
              : "未配置"
          }}
        </p>
        <el-button v-if="detail.connection && detail.connection.protocol === 'rtsp'" :loading="cameraPreviewBusy" @click="preview">测试连接并取图</el-button><div v-if="cameraPreviewUrl"><img :src="cameraPreviewUrl" alt="摄像头测试截图" class="resource-camera-preview"></div></template></template></el-dialog>
  </div>
</template>
<script src="../js/resource_page.js" />
<style scoped src="../styles/resource.scss" lang="scss" />

