<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getAdminList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  type Admin,
  type Role,
} from '@/api/system'
import { formatDateTime } from '@/utils/format'

const activeTab = ref<'admin' | 'role'>('admin')
const loading = ref(false)
const adminList = ref<Admin[]>([])
const adminTotal = ref(0)
const adminPage = ref(1)
const adminPageSize = ref(10)

const roleList = ref<Role[]>([])

const adminColumns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'avatar', label: '头像', width: 70, slot: 'avatar' },
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'nickname', label: '昵称', width: 120 },
  { prop: 'roles', label: '角色', slot: 'roles', minWidth: 120 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'lastLoginAt', label: '最后登录', width: 160, formatter: (r) => formatDateTime(r.lastLoginAt) },
]

async function fetchAdmins() {
  loading.value = true
  try {
    const res = await getAdminList({ page: adminPage.value, pageSize: adminPageSize.value })
    adminList.value = res.data.list
    adminTotal.value = res.data.total
  } finally {
    loading.value = false
  }
}

// 管理员弹窗
const adminDialogVisible = ref(false)
const adminForm = ref<Partial<Admin> & { password?: string }>({})
const adminDialogTitle = ref('')

function handleAddAdmin() {
  adminForm.value = { roles: [], status: 'active' }
  adminDialogTitle.value = '新增管理员'
  adminDialogVisible.value = true
}

function handleEditAdmin(row: Admin) {
  adminForm.value = { ...row }
  adminDialogTitle.value = '编辑管理员'
  adminDialogVisible.value = true
}

async function submitAdmin() {
  if (!adminForm.value.username || !adminForm.value.nickname) {
    ElMessage.warning('请填写完整')
    return
  }
  if (!adminForm.value.id && !adminForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (adminForm.value.id) {
    await updateAdmin(adminForm.value.id, adminForm.value)
  } else {
    await createAdmin(adminForm.value as any)
  }
  ElMessage.success('保存成功')
  adminDialogVisible.value = false
  fetchAdmins()
}

async function handleDeleteAdmin(row: Admin) {
  await ElMessageBox.confirm(`确定删除管理员「${row.username}」吗？`, '提示', { type: 'warning' })
  await deleteAdmin(row.id)
  ElMessage.success('删除成功')
  fetchAdmins()
}

// 重置密码
const pwdDialogVisible = ref(false)
const newPwd = ref('')
const currentAdmin = ref<Admin | null>(null)
function handleResetPwd(row: Admin) {
  currentAdmin.value = row
  newPwd.value = ''
  pwdDialogVisible.value = true
}
async function submitResetPwd() {
  if (!newPwd.value || newPwd.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  await resetAdminPassword(currentAdmin.value!.id, newPwd.value)
  ElMessage.success('重置成功')
  pwdDialogVisible.value = false
}

// 角色
async function fetchRoles() {
  const res = await getRoleList()
  roleList.value = res.data
}

const roleDialogVisible = ref(false)
const roleForm = ref<Partial<Role>>({})
const roleDialogTitle = ref('')

function handleAddRole() {
  roleForm.value = { permissions: [] }
  roleDialogTitle.value = '新增角色'
  roleDialogVisible.value = true
}

function handleEditRole(row: Role) {
  roleForm.value = { ...row, permissions: [...row.permissions] }
  roleDialogTitle.value = '编辑角色'
  roleDialogVisible.value = true
}

async function submitRole() {
  if (!roleForm.value.name || !roleForm.value.code) {
    ElMessage.warning('请填写完整')
    return
  }
  if (roleForm.value.id) {
    await updateRole(roleForm.value.id, roleForm.value)
  } else {
    await createRole(roleForm.value)
  }
  ElMessage.success('保存成功')
  roleDialogVisible.value = false
  fetchRoles()
}

async function handleDeleteRole(row: Role) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '提示', { type: 'warning' })
  await deleteRole(row.id)
  ElMessage.success('删除成功')
  fetchRoles()
}

// 权限树（示例）
const permissions = [
  { label: '题目管理', value: 'question', children: [
    { label: '查看', value: 'question:view' },
    { label: '新增', value: 'question:create' },
    { label: '编辑', value: 'question:edit' },
    { label: '删除', value: 'question:delete' },
  ]},
  { label: '用户管理', value: 'user', children: [
    { label: '查看', value: 'user:view' },
    { label: '禁用', value: 'user:disable' },
  ]},
  { label: '系统管理', value: 'system', children: [
    { label: '管理员', value: 'system:admin' },
    { label: '配置', value: 'system:config' },
    { label: '日志', value: 'system:log' },
  ]},
]

onMounted(() => {
  fetchAdmins()
  fetchRoles()
})
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <!-- 管理员列表 -->
      <el-tab-pane label="管理员列表" name="admin">
        <ProTable
          :columns="adminColumns"
          :data="adminList"
          :loading="loading"
          :page="adminPage"
          :page-size="adminPageSize"
          :total="adminTotal"
          @update:page="(p) => (adminPage = p)"
          @update:page-size="(s) => (adminPageSize = s)"
        >
          <template #toolbar>
            <el-button type="primary" :icon="'Plus'" @click="handleAddAdmin">新增管理员</el-button>
          </template>

          <template #avatar="{ row }">
            <el-avatar :size="32" :src="row.avatar">{{ row.username[0] }}</el-avatar>
          </template>

          <template #roles="{ row }">
            <el-tag v-for="r in row.roles" :key="r" size="small" style="margin-right: 4px">{{ r }}</el-tag>
          </template>

          <template #status="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>

          <template #operation="{ row }">
            <el-button link type="primary" size="small" @click="handleEditAdmin(row)">编辑</el-button>
            <el-button link type="info" size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteAdmin(row)">删除</el-button>
          </template>
        </ProTable>
      </el-tab-pane>

      <!-- 角色管理 -->
      <el-tab-pane label="角色权限" name="role">
        <div class="role-toolbar">
          <el-button type="primary" :icon="'Plus'" @click="handleAddRole">新增角色</el-button>
        </div>
        <el-table :data="roleList" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="name" label="角色名称" width="150" />
          <el-table-column prop="code" label="角色编码" width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="adminCount" label="管理员数" width="100" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEditRole(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteRole(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 管理员弹窗 -->
    <ProDialog v-model="adminDialogVisible" :title="adminDialogTitle" @confirm="submitAdmin">
      <el-form label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="adminForm.username" :disabled="!!adminForm.id" placeholder="登录用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="adminForm.nickname" placeholder="显示昵称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!adminForm.id" label="密码">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="初始密码" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="adminForm.phone" placeholder="手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="adminForm.email" placeholder="邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色">
          <el-select v-model="adminForm.roles" multiple placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="adminForm.status">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 重置密码弹窗 -->
    <ProDialog v-model="pwdDialogVisible" title="重置密码" width="400px" @confirm="submitResetPwd">
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input v-model="newPwd" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 角色弹窗 -->
    <ProDialog v-model="roleDialogVisible" :title="roleDialogTitle" width="600px" @confirm="submitRole">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="roleForm.name" placeholder="角色名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="roleForm.code" :disabled="!!roleForm.id" placeholder="角色编码（如 admin）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="权限">
          <el-tree
            v-model:checked="roleForm.permissions"
            :data="permissions"
            show-checkbox
            node-key="value"
            :props="{ label: 'label', children: 'children' }"
            default-expand-all
          />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.role-toolbar {
  margin-bottom: 12px;
}
</style>
