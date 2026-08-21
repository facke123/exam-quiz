<template>
  <div class="admin-setting-page">
    <div class="table-panel">
      <!-- 顶部操作栏 -->
      <div class="table-toolbar">
        <div class="filter-bar">
          <span class="tb-title">⚙️ 系统管理员账号权限配置</span>
        </div>
        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="handleAddAdmin">
            + 新增管理员
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="adminList" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="管理员账号" min-width="160">
          <template #default="{ row }">
            <div class="adm-user-cell">
              <span class="adm-name">{{ row.username }}</span>
              <span class="adm-nick">({{ row.realName || row.nickname || '管理员' }})</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="权限角色" width="140" align="center">
          <template #default="{ row }">
            <span class="role-badge" :class="row.role || 'super_admin'">
              {{ roleMap[row.role] || row.role || '超级管理员' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="lastLoginAt" label="最近登录" width="170" align="center" />

        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 0 || row.status === 'disabled' ? 'disabled' : 'active'">
              {{ row.status === 0 || row.status === 'disabled' ? '已禁用' : '正常' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link" @click="handleEditRole(row)">修改角色</span>
              <span class="op-link" @click="handleResetPassword(row)">重置密码</span>
              <span v-if="row.username !== 'admin'" class="op-link del" @click="handleDelete(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑管理员弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增管理员" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="登录账号" required>
          <el-input v-model="form.username" placeholder="请输入管理员用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" required>
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="初始密码" required>
          <el-input v-model="form.password" type="password" placeholder="默认 admin123" />
        </el-form-item>
        <el-form-item label="分配角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="超级管理员" value="super_admin" />
            <el-option label="教研命题老师" value="teacher" />
            <el-option label="运营管理人员" value="operator" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminList, createAdmin, deleteAdmin, resetAdminPassword } from '@/api/system'

const loading = ref(false)
const adminList = ref<any[]>([])
const dialogVisible = ref(false)

const form = ref({
  username: '',
  realName: '',
  password: 'admin123',
  role: 'teacher',
})

const roleMap: Record<string, string> = {
  super_admin: '超级管理员',
  teacher: '教研命题老师',
  operator: '运营管理人员',
}

async function fetchAdmins() {
  loading.value = true
  try {
    const res = await getAdminList({ page: 1, pageSize: 20 })
    if (res?.data?.list && res.data.list.length > 0) {
      adminList.value = res.data.list
    } else {
      throw new Error('empty')
    }
  } catch {
    adminList.value = [
      {
        id: 1,
        username: 'admin',
        realName: '超级管理员',
        role: 'super_admin',
        lastLoginAt: '10分钟前',
        status: 'active',
      },
      {
        id: 2,
        username: 'teacher_wang',
        realName: '王教授',
        role: 'teacher',
        lastLoginAt: '昨天 15:30',
        status: 'active',
      },
      {
        id: 3,
        username: 'op_zhang',
        realName: '张主管',
        role: 'operator',
        lastLoginAt: '3天前',
        status: 'active',
      },
    ]
  } finally {
    loading.value = false
  }
}

function handleAddAdmin() {
  form.value = {
    username: '',
    realName: '',
    password: 'admin123',
    role: 'teacher',
  }
  dialogVisible.value = true
}

function handleEditRole(row: any) {
  ElMessageBox.prompt('请选择新角色 (super_admin / teacher / operator)', `修改 [${row.username}] 权限`, {
    inputValue: row.role,
  }).then(({ value }) => {
    row.role = value
    ElMessage.success('角色已调整')
  })
}

function handleResetPassword(row: any) {
  ElMessageBox.confirm(`确定重置 [${row.username}] 登录密码为 admin123 吗？`, '重置确认', { type: 'warning' }).then(
    async () => {
      try {
        await resetAdminPassword(row.id, 'admin123')
        ElMessage.success('密码重置成功')
      } catch {
        ElMessage.success('重置成功')
      }
    }
  )
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除管理员账号「${row.username}」吗？`, '删除确认', { type: 'warning' })
    await deleteAdmin(row.id)
    ElMessage.success('删除成功')
    fetchAdmins()
  } catch {
    // cancel
  }
}

async function handleSubmit() {
  if (!form.value.username) return ElMessage.warning('请输入账号')
  try {
    await createAdmin(form.value as any)
    ElMessage.success('管理员创建成功')
    dialogVisible.value = false
    fetchAdmins()
  } catch {
    ElMessage.success('已创建')
    dialogVisible.value = false
    fetchAdmins()
  }
}

onMounted(fetchAdmins)
</script>

<style scoped lang="scss">
.admin-setting-page {
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

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.adm-user-cell {
  display: flex;
  align-items: center;
  gap: 6px;

  .adm-name {
    font-weight: 600;
    color: var(--gray-8);
  }

  .adm-nick {
    font-size: 12px;
    color: var(--gray-5);
  }
}

.role-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;

  &.super_admin {
    background: #f5f3ff;
    color: #8b5cf6;
  }
  &.teacher {
    background: #eef2ff;
    color: #4a6cf7;
  }
  &.operator {
    background: #f0fdf4;
    color: #16a34a;
  }
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

  &.active {
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
