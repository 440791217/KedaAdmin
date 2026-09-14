<template>
  <div class="app-container">
    <div class="page-header" style="margin-bottom: 20px; display: flex; align-items: center;">
      <el-button icon="el-icon-back" size="mini" circle style="margin-right: 15px;" @click="goBack" />
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/production_management/project' }">项目管理</el-breadcrumb-item>
        <el-breadcrumb-item>项目详情与分总成配置</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-card class="box-card" shadow="never" style="margin-bottom: 20px; background-color: #fcfdfd;">
      <div slot="header" class="clearfix">
        <span style="font-weight: bold; color: #606266;"><i class="el-icon-monitor" /> 整机项目信息</span>
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="info-item"><strong>项目名称：</strong><span>{{ projectInfo.projectName }}</span></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="info-item"><strong>项目ID：</strong><span class="code-text">{{ projectInfo.projectId }}</span></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="info-item"><strong>管理者：</strong><span>{{ projectInfo.manager }}</span></div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="info-item"><strong>管理工号：</strong><el-tag size="mini" type="warning">{{ projectInfo.jobNum }}</el-tag></div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="box-card" shadow="never">
      <div slot="header" class="clearfix" style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; color: #303133;">
          <i class="el-icon-menu" /> 分总成部件管理
          <span style="color: #67C23A; font-size: 12px; font-weight: normal; margin-left: 10px; background: #f0f9eb; padding: 2px 6px; border-radius: 4px;">
            <i class="el-icon-rank" /> 支持鼠标拖拽卡片调整排序
          </span>
        </span>
        <el-button v-if="subAssemblies.length > 0" type="success" size="small" icon="el-icon-plus" @click="handleAddSubAssembly">
          新建分总成
        </el-button>
      </div>

      <div v-if="subAssemblies.length === 0" class="empty-wrapper">
        <div class="empty-icon"><i class="el-icon-box" /></div>
        <p class="empty-text">当前整机项目下还没有任何分总成零部件</p>
        <el-button type="primary" icon="el-icon-plus" @click="handleAddSubAssembly">
          添加第一个分总成
        </el-button>
      </div>

      <div v-else>
        <draggable
          v-model="subAssemblies"
          animation="300"
          element="div"
          class="el-row"
          :options="{ gutter: 20 }"
          @end="onDragEnd"
        >
          <el-col
            v-for="(item, index) in subAssemblies"
            :key="item.id"
            :xs="24"
            :sm="12"
            :md="6"
            style="margin-bottom: 20px;"
          >
            <div class="assembly-card" @click="goToProcessDetail(item)">
              <div class="drag-handle"><i class="el-icon-rank" /></div>

              <div class="card-body">
                <div class="assembly-icon"><i class="el-icon-setting" /></div>
                <div class="assembly-name">{{ item.name }}</div>
                <div class="assembly-status">
                  <el-tag size="mini" type="info" effect="plain" style="margin-right: 5px;">
                    位置: {{ index + 1 }}
                  </el-tag>
                  <span style="color: #909399; font-size: 12px;">待配置</span>
                </div>
              </div>
              <span class="delete-btn" @click.stop="handleDeleteSub(index, item.name)">
                <i class="el-icon-close" />
              </span>
            </div>
          </el-col>
        </draggable>
      </div>

    </el-card>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'ProjectEdit',
  components: {
    draggable
  },
  data() {
    return {
      projectId: this.$route.params.id,
      projectInfo: {
        projectName: '汽车整机轻量化底盘研发项目',
        projectId: 'X7F9G2M5K1',
        manager: '刘智',
        jobNum: 'KD1024'
      },
      subAssemblies: [
        { id: 101, name: '前桥悬架总成', processCount: 0 },
        { id: 102, name: '后桥驱动总成', processCount: 0 },
        { id: 103, name: '电池包高压配电箱', processCount: 0 },
        { id: 104, name: '转向机转向管柱', processCount: 0 }
      ]
    }
  },
  methods: {
    goBack() {
      this.$router.push('/production_management/project')
    },
    handleAddSubAssembly() {
      this.$prompt('请输入新建分总成（零部件）的名称', '新建分总成', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '分总成名称不能为空'
      }).then(({ value }) => {
        this.subAssemblies.push({
          id: new Date().getTime() + Math.floor(Math.random() * 100),
          name: value,
          processCount: 0
        })
        this.$message.success(`成功创建分总成: ${value}`)
      }).catch(() => {})
    },
    onDragEnd() {
      this.$message({
        message: '部件排序已更新',
        type: 'success',
        duration: 1000
      })
      console.log('最新部件顺序：', this.subAssemblies)
    },
    goToProcessDetail(item) {
      // 点击零部件卡片时，把零部件 ID 和 名字传到第三级配置页
      this.$router.push({
        path: `/production_management/project/process/${item.id}`,
        query: { name: item.name }
      })
    },
    handleDeleteSub(index, name) {
      this.$confirm(`确定要移除分总成【${name}】吗？`, '提示', {
        type: 'warning'
      }).then(() => {
        this.subAssemblies.splice(index, 1)
        this.$message.success('移除成功')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.info-item {
  font-size: 14px;
  color: #606266;
  padding: 5px 0;
}
.code-text {
  font-family: monospace;
  font-weight: bold;
  color: #1890ff;
}
.empty-wrapper {
  text-align: center;
  padding: 60px 0;
}
.empty-icon {
  font-size: 60px;
  color: #c0c4cc;
  margin-bottom: 15px;
}
.empty-text {
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}
.assembly-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  position: relative;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.assembly-card:active {
  cursor: grabbing;
}
.assembly-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border-color: #66b1ff;
  background: #fff;
}
.drag-handle {
  position: absolute;
  top: 8px;
  left: 10px;
  color: #cbd5e1;
  font-size: 14px;
}
.assembly-card:hover .drag-handle {
  color: #409EFF;
}
.assembly-icon {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 10px;
}
.assembly-name {
  font-weight: bold;
  font-size: 15px;
  color: #334155;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #94a3b8;
  font-size: 14px;
  padding: 3px;
  border-radius: 50%;
  transition: all 0.2s;
}
.delete-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}
.sortable-ghost {
  opacity: 0.4;
  border: 2px dashed #409EFF !important;
  background: #ecf5ff !important;
}
</style>
