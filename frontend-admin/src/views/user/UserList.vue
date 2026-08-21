<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getUserList,
  getUserDetail,
  createUser,
  updateUserStatus,
  resetPassword,
  updateMember,
  type User,
  type UserQuery,
  type CreateUserParams,
} from '@/api/user'
import { formatDateTime, formatNumber, formatPercent } from '@/utils/format'

const loading = ref(false)
const list = ref<User[]>([])
const total = ref(0)
const query = reactive<UserQuery>({
  page: 1,
  pageSize: 10,
  username: '',
  phone: '',
  email: '',
  memberLevel: undefined,
  status: undefined,
})

const searchItems: SearchItem[] = [
  { prop: 'username', label: '用户名', type: 'input' },
  { prop: 'phone', label: '手机号', type: 'input' },
  { prop: 'email', label: '邮箱', type: 'input' },
  {
    prop: 'memberLevel',
    label: '会员',
    type: 'select',
    options: [
      { label: '免费', value: 'free' },
      { label: '基础版', value: 'basic' },
      { label: '专业版', value: 'pro' },
      { label: '旗舰版', value: 'max' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常', value: 'active' },
      { label: '禁用', value: 'disabled' },
    ],
  },
]

const memberMap: Record<string, { label: string; type: string }> = {
  free: { label: '免费', type: 'info' },
  basic: { label: '基础版', type: '' },
  pro: { label: '专业版', type: 'warning' },
  max: { label: '旗舰版', type: 'danger' },
}

const columns: ProColumn[] = [
  { prop: 'id', label: 'ID', width: 70 },
  { prop: 'avatar', label: '头像', width: 70, slot: 'avatar' },
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'memberLevel', label: '会员', width: 90, slot: 'member' },
  { prop: 'memberExpireAt', label: '会员到期', width: 110, formatter: (r) => r.memberExpireAt ? formatDateTime(r.memberExpireAt, 'YYYY-MM-DD') : '-' },
  { prop: 'questionCount', label: '做题量', width: 90, formatter: (r) => formatNumber(r.questionCount) },
  { prop: 'correctRate', label: '正确率', width: 90, slot: 'correctRate' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'registerAt', label: '注册时间', width: 150, formatter: (r) => formatDateTime(r.registerAt) },
]

// 新增用户
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createForm = ref<CreateUserParams>({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  memberLevel: 'free',
  status: 'active',
})

function handleAddUser() {
  createForm.value = {
    username: '',
    password: '',
    nickname: '',
    phone: '',
    email: '',
    memberLevel: 'free',
    status: 'active',
  }
  createDialogVisible.value = true
}

async function submitCreateUser() {
  if (!createForm.value.username || !createForm.value.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (createForm.value.password.length < 6) {
    ElMessage.warning('密码长度至少 6 位')
    return
  }
  createLoading.value = true
  try {
    await createUser(createForm.value)
    ElMessage.success('添加用户成功')
    createDialogVisible.value = false
    fetchList()
  } finally {
    createLoading.value = false
  }
}

// 详情弹窗
const detailVisible = ref(false)
const currentUser = ref<User | null>(null)

async function handleDetail(row: User) {
  const res = await getUserDetail(row.id)
  currentUser.value = res.data
  detailVisible.value = true
}

// 禁用/启用
async function handleToggleStatus(row: User) {
  const action = row.status === 'active' ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定${action}该用户吗？`, '提示', { type: 'warning' })
  await updateUserStatus(row.id, row.status === 'active' ? 'disabled' : 'active')
  ElMessage.success(`${action}成功`)
  fetchList()
}

// 重置密码
const pwdDialogVisible = ref(false)
const newPassword = ref('')
async function handleResetPwd(row: User) {
  currentUser.value = row
  newPassword.value = ''
  pwdDialogVisible.value = true
}

async function submitResetPwd() {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  await resetPassword(currentUser.value!.id, newPassword.value)
  ElMessage.success('重置成功')
  pwdDialogVisible.value = false
}

// 修改会员
const memberDialogVisible = ref(false)
const memberForm = ref<{ memberLevel: string; expireAt: string }>({ memberLevel: 'free', expireAt: '' })
async function handleEditMember(row: User) {
  currentUser.value = row
  memberForm.value = {
    memberLevel: row.memberLevel,
    expireAt: row.memberExpireAt ? row.memberExpireAt.split('T')[0] : '',
  }
  memberDialogVisible.value = true
}

async function submitMember() {
  await updateMember(currentUser.value!.id, {
    memberLevel: memberForm.value.memberLevel as any,
    expireAt: memberForm.value.expireAt,
  })
  ElMessage.success('修改成功')
  memberDialogVisible.value = false
  fetchList()
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(form: Record<string, any>) {
  Object.assign(query, form)
  query.page = 1
  fetchList()
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
      @update:page="(p) => (query.page = p)"
      @update:page-size="(s) => (query.pageSize = s)"
    >
      <template #toolbar>
        <el-button type="primary" :icon="'Plus'" @click="handleAddUser">新增用户</el-button>
      </template>

      <template #avatar="{ row }">
        <el-avatar :size="32" :src="row.avatar">{{ (row.username || row.nickname || 'U')[0] }}</el-avatar>
      </template>

      <template #member="{ row }">
        <el-tag size="small" :type="memberMap[row.memberLevel]?.type">
          {{ memberMap[row.memberLevel]?.label }}
        </el-tag>
      </template>

      <template #correctRate="{ row }">
        {{ formatPercent(row.correctRate) }}
      </template>

      <template #status="{ row }">
        <el-tag size="small" :type="row.status === 'active' ? 'success' : 'danger'">
          {{ row.status === 'active' ? '正常' : '禁用' }}
        </el-tag>
      </template>

      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
        <el-button link type="warning" size="small" @click="handleEditMember(row)">会员</el-button>
        <el-button link type="info" size="small" @click="handleResetPwd(row)">重置密码</el-button>
        <el-button link :type="row.status === 'active' ? 'danger' : 'success'" size="small" @click="handleToggleStatus(row)">
          {{ row.status === 'active' ? '禁用' : '启用' }}
        </el-button>
      </template>
    </ProTable>

    <!-- 新增用户弹窗 -->
    <ProDialog
      v-model="createDialogVisible"
      title="新增用户"
      width="500px"
      :confirm-loading="createLoading"
      @confirm="submitCreateUser"
    >
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="createForm.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="登录密码" required>
          <el-input v-model="createForm.password" type="password" show-password placeholder="至少6位密码" />
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input v-model="createForm.nickname" placeholder="请输入显示昵称（可选）" />
        </el-form-item>
        <el-form-item label="手机号码">
          <el-input v-model="createForm.phone" placeholder="请输入手机号（可选）" />
        </el-form-item>
        <el-form-item label="电子邮箱">
          <el-input v-model="createForm.email" placeholder="请输入邮箱（可选）" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="createForm.memberLevel" style="width: 100%">
            <el-option label="免费" value="free" />
            <el-option label="基础版" value="basic" />
            <el-option label="专业版" value="pro" />
            <el-option label="旗舰版" value="max" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-radio-group v-model="createForm.status">
            <el-radio value="active">正常</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 详情弹窗 -->
    <ProDialog v-model="detailVisible" title="用户详情" width="600px" :show-footer="false">
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="头像">
          <el-avatar :size="48" :src="currentUser.avatar" />
        </el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag size="small" :type="memberMap[currentUser.memberLevel]?.type">
            {{ memberMap[currentUser.memberLevel]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员到期">{{ currentUser.memberExpireAt ? formatDateTime(currentUser.memberExpireAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="做题量">{{ formatNumber(currentUser.questionCount) }}</el-descriptions-item>
        <el-descriptions-item label="正确率">{{ formatPercent(currentUser.correctRate) }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDateTime(currentUser.registerAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ formatDateTime(currentUser.lastLoginAt) }}</el-descriptions-item>
      </el-descriptions>
    </ProDialog>

    <!-- 重置密码 -->
    <ProDialog v-model="pwdDialogVisible" title="重置密码" width="400px" @confirm="submitResetPwd">
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input v-model="newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
      </el-form>
    </ProDialog>

    <!-- 修改会员 -->
    <ProDialog v-model="memberDialogVisible" title="修改会员" width="450px" @confirm="submitMember">
      <el-form label-width="90px">
        <el-form-item label="会员等级">
          <el-select v-model="memberForm.memberLevel" style="width: 100%">
            <el-option label="免费" value="free" />
            <el-option label="基础版" value="basic" />
            <el-option label="专业版" value="pro" />
            <el-option label="旗舰版" value="max" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期时间">
          <el-date-picker
            v-model="memberForm.expireAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择到期日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 16px;
}
</style>
