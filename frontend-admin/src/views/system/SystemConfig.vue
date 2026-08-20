<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
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

const searchItems: SearchItem[] = [
  { prop: 'group', label: '配置分组', type: 'select', options: [] },
]

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'key', label: '配置键', width: 180 },
  { prop: 'name', label: '名称', width: 150 },
  { prop: 'value', label: '值', minWidth: 200, slot: 'value' },
  { prop: 'group', label: '分组', width: 100, slot: 'group' },
  { prop: 'description', label: '说明', minWidth: 180 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getConfigList(query)
    list.value = res.data.list
    total.value = res.data.total
    // 提取分组
    const set = new Set(res.data.list.map((c: SystemConfig) => c.group))
    groups.value = Array.from(set)
    const groupItem = searchItems.find((i) => i.prop === 'group')
    if (groupItem) {
      groupItem.options = groups.value.map((g) => ({ label: g, value: g }))
    }
  } finally {
    loading.value = false
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
    await updateConfig(form.value.id!, form.value)
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
        <el-tag size="small">{{ row.value }}</el-tag>
      </template>

      <template #group="{ row }">
        <el-tag size="small" type="info">{{ row.group }}</el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
      </template>
    </ProTable>

    <ProDialog v-model="dialogVisible" title="编辑配置" width="500px" :loading="submitLoading" @confirm="handleSubmit">
      <el-form label-width="90px">
        <el-form-item label="配置键">
          <el-input :model-value="form.key" disabled />
        </el-form-item>
        <el-form-item label="名称">
          <el-input :model-value="form.name" disabled />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input
            v-if="form.type === 'string'"
            v-model="form.value"
            type="textarea"
            :rows="3"
          />
          <el-input-number v-else-if="form.type === 'number'" v-model="form.value" style="width: 100%" />
          <el-switch v-else-if="form.type === 'boolean'" v-model="form.value" active-value="true" inactive-value="false" />
          <el-input v-else v-model="form.value" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input :model-value="form.description" type="textarea" :rows="2" disabled />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>
