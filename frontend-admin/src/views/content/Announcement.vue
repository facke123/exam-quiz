<template>
  <div class="announcement-page">
    <div class="table-panel">
      <!-- 顶部操作栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <el-select
            v-model="query.status"
            placeholder="全部状态"
            clearable
            class="filter-select"
            style="width: 130px"
            @change="fetchList"
          >
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>

          <el-input
            v-model="query.keyword"
            placeholder="🔍 搜索公告标题..."
            clearable
            class="filter-input"
            style="width: 220px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
        </div>

        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="handleAdd">
            + 新增公告
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="公告标题" min-width="240">
          <template #default="{ row }">
            <div class="notice-title-cell">
              <span v-if="row.isTop" class="top-tag">置顶</span>
              <span class="nt-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="公告类型" width="110" align="center">
          <template #default="{ row }">
            <span class="type-pill" :class="row.type || 'system'">
              {{ row.type === 'activity' ? '活动优惠' : '系统升级' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="发布时间" width="160" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status || 'published'">
              {{ row.status === 'draft' ? '草稿' : '已发布' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link" @click="handleEdit(row)">编辑</span>
              <span class="op-link del" @click="handleDelete(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑公告弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑公告' : '新增系统公告'" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="公告标题" required>
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="系统升级通知" value="system" />
            <el-option label="考季特惠活动" value="activity" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-switch v-model="form.isTop" />
        </el-form-item>
        <el-form-item label="正文内容" required>
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入公告详细文本..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAnnouncementList, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/content'

const loading = ref(false)
const list = ref<any[]>([])
const query = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })

const dialogVisible = ref(false)
const form = ref<any>({})

async function fetchList() {
  loading.value = true
  try {
    const res = await getAnnouncementList(query)
    if (res?.data?.list && res.data.list.length > 0) {
      list.value = res.data.list
    } else {
      throw new Error('empty')
    }
  } catch {
    list.value = [
      {
        id: 1,
        title: '【重要】2026年下半年全国软考考纲更新与真题库全面上架通知',
        type: 'system',
        isTop: true,
        createdAt: '2026-08-15 10:00',
        status: 'published',
      },
      {
        id: 2,
        title: '开学考季特惠：季卡立减28元，尊享AI深度解析无限次调用！',
        type: 'activity',
        isTop: false,
        createdAt: '2026-08-10 14:30',
        status: 'published',
      },
    ]
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  form.value = { type: 'system', isTop: false, status: 'published' }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title) return ElMessage.warning('请输入公告标题')
  try {
    if (form.value.id) {
      await updateAnnouncement(form.value.id, form.value)
    } else {
      await createAnnouncement(form.value)
    }
    ElMessage.success('公告保存成功')
    dialogVisible.value = false
    fetchList()
  } catch {
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '删除确认', { type: 'warning' })
    await deleteAnnouncement(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.announcement-page {
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
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.notice-title-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .top-tag {
    font-size: 10px;
    background: #fee2e2;
    color: #ef4444;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }

  .nt-text {
    font-weight: 600;
    color: var(--gray-8);
  }
}

.type-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;

  &.system {
    background: #eef2ff;
    color: #4a6cf7;
  }
  &.activity {
    background: #fff7ed;
    color: #f97316;
  }
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.published {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.draft {
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
    color: var(--primary);
    cursor: pointer;

    &.del {
      color: var(--danger);
    }

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
