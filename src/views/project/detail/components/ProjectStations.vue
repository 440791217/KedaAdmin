<template>
  <section v-loading="loading">
    <div class="station-toolbar">
      <p>本项目的 SOP 任务只能选择这里关联的可用工位。同一工位可以关联多个项目。</p>
      <el-button v-if="canManage" type="primary" size="small" :disabled="busy || loading" @click="open">关联工位</el-button>
      <el-button size="small" :disabled="busy || loading" @click="load">刷新</el-button>
    </div>
    <el-alert v-if="failed" title="关联工位加载失败，请刷新重试" type="error" :closable="false" />
    <el-table :data="items" empty-text="项目尚未关联工位，请先关联再创建 SOP 任务">
      <el-table-column prop="code" label="工位编号" min-width="180" />
      <el-table-column prop="name" label="工位名称" min-width="160" />
      <el-table-column prop="location_name" label="位置" min-width="140" />
      <el-table-column label="状态" width="100"><template slot-scope="{row}">{{ row.status === 0 ? '可用' : row.status === 1 ? '停用' : '已报废' }}</template></el-table-column>
      <el-table-column prop="task_count" label="未取消任务数" width="130" />
      <el-table-column v-if="canManage" label="操作" width="130"><template slot-scope="{row}"><el-button type="text" :disabled="busy || Number(row.task_count) > 0" @click="remove(row)">解除关联</el-button></template></el-table-column>
    </el-table>
    <el-dialog title="关联工位" :visible.sync="dialog" width="520px" :close-on-click-modal="false" :before-close="closeDialog" append-to-body>
      <el-select v-model="selected" filterable remote :remote-method="search" :loading="searching" placeholder="搜索可用工位名称或编号" style="width:100%" :disabled="busy">
        <el-option v-for="station in options" :key="station.id" :value="station.id" :label="station.name + ' · ' + station.code" />
      </el-select>
      <p>仍被未取消任务使用的工位需要先调整任务，才能解除关联。</p>
      <span slot="footer"><el-button :disabled="busy" @click="dialog = false">取消</el-button><el-button type="primary" :loading="busy" :disabled="!selected" @click="add">确认关联</el-button></span>
    </el-dialog>
  </section>
</template>
<script src="../js/project_stations.js" />
<style scoped>
.station-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.station-toolbar p { flex: 1; color: #606266; }
</style>
