<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProDialog from '@/components/ProDialog.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import {
  getBannerList,
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
} from '@/api/content'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const list = ref<Banner[]>([])

async function fetchList() {
  loading.value = true
  try {
    const res = await getBannerList({ page: 1, pageSize: 50 })
    list.value = res.data.list
  } finally {
    loading.value = false
  }
}

// 弹窗
const dialogVisible = ref(false)
const submitLoading = ref(false)
const form = ref<Partial<Banner>>({ status: 'enabled', sort: 0 })

function handleAdd() {
  form.value = { status: 'enabled', sort: 0 }
  dialogVisible.value = true
}

function handleEdit(row: Banner) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title || !form.value.imageUrl) {
    ElMessage.warning('请填写完整信息（含图片）')
    return
  }
  submitLoading.value = true
  try {
    if (form.value.id) {
      await updateBanner(form.value.id, form.value)
    } else {
      await createBanner(form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: Banner) {
  await ElMessageBox.confirm(`确定删除 Banner「${row.title}」吗？`, '提示', { type: 'warning' })
  await deleteBanner(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleToggleStatus(row: Banner) {
  await updateBanner(row.id, { status: row.status === 'enabled' ? 'disabled' : 'enabled' })
  ElMessage.success('操作成功')
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <div v-loading="loading" class="page-container">
    <div class="banner-toolbar">
      <el-button type="primary" :icon="'Plus'" @click="handleAdd">新增 Banner</el-button>
    </div>

    <div class="banner-grid">
      <div v-for="item in list" :key="item.id" class="banner-card">
        <div class="banner-card__image">
          <img :src="item.imageUrl" :alt="item.title" />
          <div class="banner-card__mask">
            <el-button type="primary" circle @click="handleEdit(item)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              :type="item.status === 'enabled' ? 'warning' : 'success'"
              circle
              @click="handleToggleStatus(item)"
            >
              <el-icon><VideoPause v-if="item.status === 'enabled'" /><VideoPlay v-else /></el-icon>
            </el-button>
            <el-button type="danger" circle @click="handleDelete(item)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="banner-card__info">
          <h4>{{ item.title }}</h4>
          <p>排序：{{ item.sort }} · {{ formatDateTime(item.createdAt, 'YYYY-MM-DD') }}</p>
          <el-tag size="small" :type="item.status === 'enabled' ? 'success' : 'info'">
            {{ item.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>
    </div>

    <ProDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑 Banner' : '新增 Banner'"
      width="600px"
      :loading="submitLoading"
      @confirm="handleSubmit"
    >
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="图片">
          <ImageUpload v-model="form.imageUrl" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.linkUrl" placeholder="点击跳转链接（可选）" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.banner-toolbar {
  margin-bottom: 16px;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.banner-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__image {
    position: relative;
    width: 100%;
    height: 140px;
    overflow: hidden;
    background: var(--el-fill-color);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &__image:hover &__mask {
    opacity: 1;
  }

  &__info {
    padding: 12px;

    h4 {
      font-size: 14px;
      margin-bottom: 4px;
    }

    p {
      font-size: 12px;
      color: var(--app-text-secondary);
      margin-bottom: 8px;
    }
  }
}
</style>
