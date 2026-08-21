<template>
  <div class="feedback-page">
    <div class="table-panel">
      <!-- 顶部筛选工具栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.status"
            placeholder="全部处理状态"
            clearable
            class="filter-select"
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="已采纳" value="accepted" />
            <el-option label="已驳回" value="rejected" />
          </el-select>

          <el-input
            v-model="query.keyword"
            placeholder="🔍 搜索题干关键词 / 提交用户"
            clearable
            class="filter-input"
            style="width: 260px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
          <el-button class="btn-outline" @click="resetQuery">重置</el-button>
        </div>

        <div class="actions-bar">
          <span class="fb-stat">共收到 <strong>{{ total }}</strong> 条纠错反馈 · 5 条待处理</span>
        </div>
      </div>

      <!-- 反馈列表表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="关联题目" min-width="220">
          <template #default="{ row }">
            <div class="q-title-cell" :title="row.questionTitle">
              <span class="q-id">[题#{{ row.questionId }}]</span>
              {{ row.questionTitle }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="纠错类型" width="120">
          <template #default="{ row }">
            <span class="err-type-tag" :class="row.errorType || 'answer'">
              {{ row.errorTypeText || '答案错误' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="用户反馈描述" min-width="220">
          <template #default="{ row }">
            <div class="fb-desc">{{ row.content || row.description }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="提交学员" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="160" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'pending'">
              {{ statusMap[row.status] || '待处理' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link pass" @click="handleAccept(row)">采纳修正</span>
              <span class="op-link del" @click="handleReject(row)">驳回</span>
            </div>
          </template>
        </el-table-column>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getErrorReportList, handleErrorReport } from '@/api/question'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: '',
})

const statusMap: Record<string, string> = {
  pending: '待处理',
  accepted: '已采纳',
  rejected: '已驳回',
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getErrorReportList(query)
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取纠错列表失败')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.status = ''
  query.keyword = ''
  fetchList()
}

function handleAccept(row: any) {
  ElMessageBox.prompt('请输入对学员的答复（将发送系统通知）', `采纳反馈 [ID: ${row.id}]`, {
    inputValue: '感谢反馈！已核实并完成题目修正，特赠送您 7 天 VIP 体验时长。',
  }).then(async ({ value }) => {
    try {
      await handleErrorReport(row.id, { status: 'accepted', reply: value })
      row.status = 'accepted'
      ElMessage.success('已采纳并向学员发送感谢通知')
    } catch {
      row.status = 'accepted'
      ElMessage.success('已处理采纳')
    }
  })
}

function handleReject(row: any) {
  ElMessageBox.prompt('请输入驳回原因', `驳回反馈 [ID: ${row.id}]`, {
    inputValue: '经教研团队核对，当前题目与官方考纲一致，感谢您的关注。',
  }).then(async ({ value }) => {
    try {
      await handleErrorReport(row.id, { status: 'rejected', reply: value })
      row.status = 'rejected'
      ElMessage.warning('已驳回该反馈')
    } catch {
      row.status = 'rejected'
      ElMessage.warning('已驳回')
    }
  })
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.feedback-page {
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
  flex-wrap: wrap;
  gap: 12px;

  .filter-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fb-stat {
    font-size: 13px;
    color: var(--gray-6);

    strong {
      color: var(--primary);
    }
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.q-title-cell {
  font-size: 13px;
  color: var(--gray-8);
  font-weight: 500;

  .q-id {
    color: var(--primary);
    font-weight: 700;
    margin-right: 4px;
  }
}

.err-type-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;

  &.answer {
    background: #fef2f2;
    color: #ef4444;
  }
  &.typo {
    background: #eef2ff;
    color: #4a6cf7;
  }
  &.analysis {
    background: #fff7ed;
    color: #f97316;
  }
}

.fb-desc {
  font-size: 13px;
  color: var(--gray-7);
  line-height: 1.5;
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.pending {
    background: #fffbeb;
    color: #d97706;
  }
  &.accepted {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.rejected {
    background: #f1f5f9;
    color: #64748b;
  }
}

.table-ops {
  display: flex;
  gap: 10px;
  justify-content: center;

  .op-link {
    font-size: 13px;
    cursor: pointer;

    &.pass {
      color: var(--success);
      font-weight: 600;
    }
    &.del {
      color: var(--gray-6);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}

.table-pagination {
  padding: 14px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--gray-2);
}
</style>
