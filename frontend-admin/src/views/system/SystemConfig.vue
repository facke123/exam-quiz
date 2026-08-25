<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import { getConfigList, updateConfig, type SystemConfig } from '@/api/system'

const loading = ref(false)
const list = ref<SystemConfig[]>([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20, group: '' })

const groups = ref<string[]>([])

// 🎯 全局考试倒计时配置
const countdownForm = reactive({
  date: '2026-11-08 09:00:00',
  title: '2026年软考统一认证',
})
const countdownSaving = ref(false)

const previewDays = computed(() => {
  try {
    const target = new Date(countdownForm.date.replace(/-/g, '/'))
    if (isNaN(target.getTime())) return 0
    const now = new Date()
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  } catch {
    return 0
  }
})

const searchItems: SearchItem[] = [
  { prop: 'group', label: '配置分组', type: 'select', options: [] },
]

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'key', label: '配置键', width: 220 },
  { prop: 'value', label: '配置值', minWidth: 220, slot: 'value' },
  { prop: 'description', label: '说明', minWidth: 200 },
  { prop: 'updatedAt', label: '更新时间', width: 170 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getConfigList(query)
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    list.value = rawList
    total.value = Array.isArray(res.data) ? rawList.length : (res.data?.total || rawList.length)
    
    // 自动回填考试倒计时
    const dateCfg = rawList.find((c: any) => c.key === 'exam_countdown_date')
    if (dateCfg) countdownForm.date = dateCfg.value
    const titleCfg = rawList.find((c: any) => c.key === 'exam_countdown_title')
    if (titleCfg) countdownForm.title = titleCfg.value

    // 提取分组
    const set = new Set(rawList.map((c: any) => c.group || '通用配置'))
    groups.value = Array.from(set)
    const groupItem = searchItems.find((i) => i.prop === 'group')
    if (groupItem) {
      groupItem.options = groups.value.map((g) => ({ label: g, value: g }))
    }
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function handleSaveCountdown() {
  if (!countdownForm.date) {
    return ElMessage.warning('请选择考试目标时间')
  }
  countdownSaving.value = true
  try {
    const dateCfg = list.value.find((c) => c.key === 'exam_countdown_date')
    const titleCfg = list.value.find((c) => c.key === 'exam_countdown_title')

    await Promise.all([
      updateConfig(dateCfg?.id || (0 as any), {
        key: 'exam_countdown_date',
        value: countdownForm.date,
        description: '全局考试倒计时目标时间',
      }),
      updateConfig(titleCfg?.id || (0 as any), {
        key: 'exam_countdown_title',
        value: countdownForm.title,
        description: '全局考试倒计时副标题',
      }),
    ])
    ElMessage.success('考试倒计时全局设置已成功保存！')
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    countdownSaving.value = false
  }
}

function handleSearch(form: Record<string, any>) {
  Object.assign(query, form)
  query.page = 1
  fetchList()
}

// 编辑弹窗
const dialogVisible = ref(false)
const form = ref<Partial<SystemConfig>>({})
const submitLoading = ref(false)

function handleEdit(row: SystemConfig) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.value) {
    ElMessage.warning('请输入配置值')
    return
  }
  submitLoading.value = true
  try {
    await updateConfig(form.value.id || (form.value.key as any), form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="page-container">
    <!-- 🎯 顶部置顶卡片：考试倒计时设置 -->
    <div class="countdown-setting-card">
      <div class="card-header">
        <div class="ch-left">
          <span class="ch-icon">⏳</span>
          <div class="ch-text">
            <h3 class="ch-title">首页考试倒计时全局设置</h3>
            <p class="ch-desc">设置前台 H5 首页展示的全局统一考试日期及倒计时副标题，全站生效并实时自动计算距离考试剩余天数。</p>
          </div>
        </div>
        <div class="preview-box">
          <div class="pb-num">{{ previewDays }}<span>天</span></div>
          <div class="pb-sub">{{ countdownForm.title || '软考统一认证' }}</div>
        </div>
      </div>

      <div class="card-body">
        <el-form :inline="true" :model="countdownForm" class="countdown-inline-form">
          <el-form-item label="考试目标时间" required>
            <el-date-picker
              v-model="countdownForm.date"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择或输入考试时间，如 2026-11-08 09:00:00"
              style="width: 230px"
            />
          </el-form-item>

          <el-form-item label="倒计时副标题" required>
            <el-input
              v-model="countdownForm.title"
              placeholder="如 2026年下半年软考统一认证"
              style="width: 260px"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="countdownSaving"
              @click="handleSaveCountdown"
            >
              💾 保存倒计时设置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <SearchForm :items="searchItems" :model-value="query" :loading="loading" @search="handleSearch" />

    <ProTable
      :columns="columns"
      :data="list"
      :loading="loading"
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      :show-pagination="false"
    >
      <template #value="{ row }">
        <el-tag v-if="row.key === 'exam_countdown_date'" type="warning" size="small">
          📅 {{ row.value }}
        </el-tag>
        <el-tag v-else-if="row.key === 'exam_countdown_title'" type="success" size="small">
          🎯 {{ row.value }}
        </el-tag>
        <el-tag v-else size="small">{{ row.value }}</el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
      </template>
    </ProTable>

    <ProDialog v-model="dialogVisible" title="编辑配置" width="520px" :loading="submitLoading" @confirm="handleSubmit">
      <el-form label-width="95px">
        <el-form-item label="配置键">
          <el-input :model-value="form.key" disabled />
        </el-form-item>
        <el-form-item label="配置说明">
          <el-input v-model="form.description" placeholder="配置项描述" />
        </el-form-item>
        <el-form-item label="配置值" required>
          <el-date-picker
            v-if="form.key === 'exam_countdown_date'"
            v-model="form.value"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择考试目标时间"
            style="width: 100%"
          />
          <el-input
            v-else-if="form.type === 'string'"
            v-model="form.value"
            type="textarea"
            :rows="3"
          />
          <el-input-number v-else-if="form.type === 'number'" v-model="form.value" style="width: 100%" />
          <el-switch v-else-if="form.type === 'boolean'" v-model="form.value" active-value="1" inactive-value="0" />
          <el-input v-else v-model="form.value" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.countdown-setting-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 14px;

    .ch-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .ch-icon {
        font-size: 28px;
      }

      .ch-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .ch-desc {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
    }

    .preview-box {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      text-align: center;
      min-width: 140px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);

      .pb-num {
        font-size: 22px;
        font-weight: 800;
        line-height: 1;

        span {
          font-size: 12px;
          margin-left: 2px;
          font-weight: 500;
        }
      }

      .pb-sub {
        font-size: 11px;
        opacity: 0.9;
        margin-top: 4px;
        white-space: nowrap;
      }
    }
  }

  .countdown-inline-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 18px;
    }
  }
}
</style>
