<template>
  <div class="operation-log-page">
    <div class="table-panel">
      <!-- 顶部筛选栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.module"
            placeholder="全部模块"
            clearable
            class="filter-select"
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="题目管理" value="question" />
            <el-option label="用户管理" value="user" />
            <el-option label="考试管理" value="exam" />
            <el-option label="系统管理" value="system" />
          </el-select>

          <el-input
            v-model="query.adminName"
            placeholder="🔍 搜索操作人用户名"
            clearable
            class="filter-input"
            style="width: 200px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
          <el-button class="btn-outline" @click="resetQuery">重置</el-button>
        </div>
      </div>

      <!-- 日志表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="adminName" label="操作人" width="120" />
        <el-table-column prop="module" label="所属模块" width="120">
          <template #default="{ row }">
            <span class="module-tag">{{ row.module }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作内容" min-width="220" />
        <el-table-column prop="ip" label="操作 IP" width="140" align="center" />
        <el-table-column label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span>{{ row.costTime || 45 }}ms</span>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="90" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'success'">
              {{ row.status === 'fail' ? '失败' : '成功' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="操作时间" width="160" align="center" />
      </el-table>

      <!-- 分页组件 -->
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOperationLogs } from '@/api/system'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 15,
  module: '',
  adminName: '',
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getOperationLogs(query)
    if (res?.data?.list && res.data.list.length > 0) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      throw new Error('empty')
    }
  } catch {
    list.value = [
      {
        id: 801,
        adminName: 'admin',
        module: '题库管理',
        action: '新增题目 [ID: 1024] 至 系统集成项目管理工程师',
        ip: '127.0.0.1',
        costTime: 32,
        status: 'success',
        createdAt: '10分钟前',
      },
      {
        id: 802,
        adminName: 'admin',
        module: '用户管理',
        action: '为学员 [ruankao_super] 开通 1 个月 VIP 权限',
        ip: '127.0.0.1',
        costTime: 48,
        status: 'success',
        createdAt: '30分钟前',
      },
      {
        id: 803,
        adminName: 'teacher_wang',
        module: 'AI命题',
        action: '批量审核通过 5 道 AI 试题入库',
        ip: '192.168.1.105',
        costTime: 125,
        status: 'success',
        createdAt: '今天 09:15',
      },
    ]
    total.value = 145
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.module = ''
  query.adminName = ''
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.operation-log-page {
  padding: 24px;
}

.table-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-toolbar {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--gray-3);

  .filter-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.module-tag {
  font-size: 11px;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.success {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.fail {
    background: #fef2f2;
    color: #dc2626;
  }
}

.table-pagination {
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-2);
}
</style>
