<template>
  <section class="execution-records">
    <header><h2>执行记录</h2><p>按产品码追溯操作人、工位、版本和步骤结果</p></header>
    <template v-if="selected"><el-button class="records-back" @click="selected = ''; load()">返回记录列表</el-button><execution-panel :key="selected" :execution-id="selected" :readonly="!handling" /></template>
    <template v-else>
      <el-form :inline="true" class="records-filters" @submit.native.prevent="load(true)">
        <el-form-item><el-input v-model="product" placeholder="产品码" clearable /></el-form-item>
        <el-form-item><el-input v-model="project" placeholder="项目名称" clearable /></el-form-item>
        <el-form-item><el-input v-model="station" placeholder="工位名称" clearable /></el-form-item>
        <el-form-item><el-input v-model="operator" placeholder="操作人姓名" clearable /></el-form-item>
        <el-form-item><el-select v-model="status" placeholder="全部状态" clearable @clear="status = null"><el-option v-for="(s, i) in states" :key="i" :value="i" :label="s" /></el-select></el-form-item>
        <el-form-item><el-date-picker v-model="dates" type="daterange" value-format="yyyy-MM-dd" start-placeholder="开工日期起" end-placeholder="开工日期止" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit">查询</el-button></el-form-item>
      </el-form>
      <el-alert v-if="failed" title="执行记录加载失败，请确认执行模块表已建立后重试" type="error" :closable="false" />
      <el-table v-loading="loading" :data="items" border empty-text="暂无可见执行记录">
        <el-table-column prop="product_code" label="产品码" min-width="150" />
        <el-table-column prop="project_name" label="项目" min-width="130" /><el-table-column prop="subproject_name" label="子项目" min-width="120" />
        <el-table-column prop="task_name" label="任务" min-width="140" /><el-table-column prop="station_name" label="工位" min-width="120" /><el-table-column prop="operator_name" label="操作人" width="110" />
        <el-table-column label="版本" width="75"><template slot-scope="{ row }">V{{ row.revision_no }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template slot-scope="{ row }">{{ states[row.status] }}</template></el-table-column>
        <el-table-column label="开始时间" width="170"><template slot-scope="{ row }">{{ time(row.started_at) }}</template></el-table-column>
        <el-table-column label="结束时间" width="170"><template slot-scope="{ row }">{{ time(row.ended_at) }}</template></el-table-column>
        <el-table-column label="操作" width="150"><template slot-scope="{ row }"><el-button type="text" @click="handling = false; selected = row.id">查看记录</el-button><el-button v-if="row.status < 2" type="text" @click="handling = true; selected = row.id">处理作业</el-button></template></el-table-column>
      </el-table>
      <el-pagination :current-page.sync="page" :page-size="limit" :total="total" layout="total, prev, pager, next" @current-change="load" />
    </template>
  </section>
</template>
<script src="./js/execution_records.js" />
<style scoped lang="scss" src="./styles/execution_records.scss" />
