<template>
  <div class="banner-manage-page">
    <div class="table-panel">
      <!-- 顶部操作栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <span class="tb-title">🖼️ 移动端轮播 Banner 管理</span>
        </div>
        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="handleAdd">
            + 新增 Banner
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="Banner 预览" width="160" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl || row.image"
              :src="row.imageUrl || row.image"
              style="width: 120px; height: 48px; border-radius: 6px; display: block; margin: 0 auto"
              fit="cover"
            >
              <template #error>
                <div class="banner-thumb">
                  <span class="thumb-tag">{{ row.title }}</span>
                </div>
              </template>
            </el-image>
            <div v-else class="banner-thumb">
              <span class="thumb-tag">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="Banner 标题" min-width="180" />
        <el-table-column label="跳转链接 / 路由" min-width="180">
          <template #default="{ row }">
            <span>{{ row.linkUrl || row.url || row.targetUrl || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序权重" width="90" align="center" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span
              class="status-badge"
              :class="row.status === 'disabled' || row.status === 'offline' || row.status === 0 ? 'disabled' : 'enabled'"
            >
              {{ row.status === 'disabled' || row.status === 'offline' || row.status === 0 ? '已下线' : '展示中' }}
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

    <!-- 新增/编辑 Banner 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑 Banner' : '新增轮播图'" width="520px">
      <el-form :model="form" label-width="95px">
        <el-form-item label="Banner标题" required>
          <el-input v-model="form.title" placeholder="如 2026年软考冲刺刷题营" />
        </el-form-item>
        <el-form-item label="图片链接" required>
          <el-input v-model="form.imageUrl" placeholder="如 https://... 或 /static/banner/banner1.png" />
        </el-form-item>
        <el-form-item label="跳转路由">
          <el-input v-model="form.linkUrl" placeholder="如 /practice/mock-exam 或 /vip" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort" :min="0" :max="99" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBannerList, createBanner, updateBanner, deleteBanner } from '@/api/content'

const loading = ref(false)
const list = ref<any[]>([])
const dialogVisible = ref(false)
const form = ref<any>({})

async function fetchList() {
  loading.value = true
  try {
    const res = await getBannerList({ page: 1, pageSize: 50 })
    if (res?.data?.list) {
      list.value = res.data.list
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取 Banner 列表失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  form.value = {
    title: '',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60',
    linkUrl: '/practice/mock-exam',
    sort: 1,
    status: 1,
  }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  form.value = {
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl || row.image || '',
    linkUrl: row.linkUrl || row.url || row.targetUrl || '',
    sort: row.sort || 0,
    status: row.status === 0 || row.status === 'offline' || row.status === 'disabled' ? 0 : 1,
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  if (!form.value.imageUrl) return ElMessage.warning('请输入图片链接')
  try {
    if (form.value.id) {
      await updateBanner(form.value.id, form.value)
    } else {
      await createBanner(form.value)
    }
    ElMessage.success('Banner 保存成功')
    dialogVisible.value = false
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除 Banner「${row.title}」吗？`, '删除确认', { type: 'warning' })
    await deleteBanner(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // cancel
  }
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.banner-manage-page {
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

  .tb-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
  }
}

.banner-thumb {
  width: 120px;
  height: 48px;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  padding: 4px;
  text-align: center;
  margin: 0 auto;
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.enabled {
    background: #f0fdf4;
    color: #16a34a;
  }
  &.disabled {
    background: #fef2f2;
    color: #dc2626;
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
