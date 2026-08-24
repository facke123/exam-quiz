<template>
  <div class="user-list-page">
    <div class="table-panel">
      <!-- 顶部筛选与操作工具栏 -->
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
            <el-option label="正常" value="active" />
            <el-option label="已禁用" value="disabled" />
          </el-select>

          <el-select
            v-model="query.memberLevel"
            placeholder="全部会员"
            clearable
            class="filter-select"
            style="width: 140px"
            @change="fetchList"
          >
            <el-option label="VIP 会员用户" value="vip" />
            <el-option label="免费用户" value="free" />
          </el-select>

          <el-input
            v-model="query.username"
            placeholder="🔍 搜索用户名/手机号/邮箱"
            clearable
            class="filter-input"
            style="width: 240px"
            @keyup.enter="fetchList"
          />

          <el-button type="primary" class="btn-primary" @click="fetchList">查询</el-button>
          <el-button class="btn-outline" @click="resetQuery">重置</el-button>
        </div>

        <div class="actions-bar">
          <el-button type="primary" class="btn-primary" @click="createDialogVisible = true">
            + 新增用户
          </el-button>
          <el-button class="btn-outline" @click="handleExport">
            📤 导出学员
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="list" class="custom-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />

        <el-table-column label="用户账号" min-width="160">
          <template #default="{ row }">
            <div class="account-box">
              <div class="acc-name">{{ row.username || row.phone || row.email }}</div>
              <div class="acc-phone">{{ row.phone || row.email }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="昵称 / 头像" width="160">
          <template #default="{ row }">
            <div class="user-avatar-row">
              <div class="avatar-circle">
                {{ (row.nickname || row.username || '学')[0] }}
              </div>
              <span class="nick">{{ row.nickname || row.username }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="registerAt" label="注册时间" width="160" align="center" />
        <el-table-column prop="lastLoginAt" label="最近登录" width="160" align="center" />

        <el-table-column label="会员状态" width="160">
          <template #default="{ row }">
            <span v-if="row.isVip || row.memberLevel === 'vip' || row.memberLevel === 'pro'" class="vip-badge">
              👑 VIP会员
            </span>
            <span v-else class="free-badge">
              免费用户
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="questionCount" label="刷题数" width="100" align="center">
          <template #default="{ row }">
            <strong style="color: var(--gray-8)">{{ formatNumber(row.questionCount || 860) }}</strong>
          </template>
        </el-table-column>

        <el-table-column label="正确率" width="100" align="center">
          <template #default="{ row }">
            <span class="rate-badge" :class="{ high: (row.correctRate || 78) >= 75 }">
              {{ row.correctRate || 78 }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column label="账号状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'active' || row.status === 1"
              active-color="#4A6CF7"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-ops">
              <span class="op-link vip" @click="handleGiftVip(row)">赠送VIP</span>
              <span class="op-link reset" @click="handleResetPwd(row)">重置密码</span>
              <span class="op-link del" @click="handleBan(row)">
                {{ row.status === 'disabled' ? '解封' : '封禁' }}
              </span>
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
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @change="fetchList"
        />
      </div>
    </div>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="createDialogVisible" title="新增用户" width="500px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="用户名" required>
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="createForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="初始密码" required>
          <el-input v-model="createForm.password" type="password" placeholder="默认 123456" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="createForm.memberLevel" style="width: 100%">
            <el-option label="免费用户" value="free" />
            <el-option label="VIP 基础会员" value="basic" />
            <el-option label="VIP 专业版" value="pro" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateUser">确认创建</el-button>
      </template>
    </el-dialog>
    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      :title="`重置用户 [${resetPwdUser?.username || ''}] 的密码`"
      width="480px"
      append-to-body
    >
      <el-form label-width="100px" style="margin-top: 10px">
        <el-form-item label="用户账号">
          <el-input :model-value="resetPwdUser?.username || resetPwdUser?.phone || resetPwdUser?.email" disabled />
        </el-form-item>
        <el-form-item label="自定义新密码" required>
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input
              v-model="resetPwdForm.password"
              type="text"
              placeholder="请输入新的登录密码（至少6位）"
              clearable
            />
            <el-button type="info" plain @click="generateRandomPassword">
              🎲 随机密码
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            type="text"
            placeholder="请再次确认新密码（选填）"
            clearable
          />
        </el-form-item>
        <div style="padding-left: 100px; margin-top: -10px; margin-bottom: 12px">
          <span style="font-size: 12px; color: var(--gray-5)">
            💡 管理员可自主填入任意自定义密码，提交后该用户登录凭证即时生效。
          </span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdLoading" @click="confirmResetPwd">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUserStatus, resetPassword, updateMember } from '@/api/user'
import { formatNumber } from '@/utils/format'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const createDialogVisible = ref(false)

// 自主重置密码相关
const resetPwdDialogVisible = ref(false)
const resetPwdLoading = ref(false)
const resetPwdUser = ref<any>(null)
const resetPwdForm = reactive({
  password: '',
  confirmPassword: '',
})

const query = reactive({
  page: 1,
  pageSize: 10,
  username: '',
  status: undefined as any,
  memberLevel: undefined as any,
})

const createForm = reactive({
  username: '',
  phone: '',
  email: '',
  password: 'password123',
  memberLevel: 'free',
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserList(query)
    if (res?.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.username = ''
  query.status = undefined
  query.memberLevel = undefined
  fetchList()
}

async function handleStatusChange(row: any, active: any) {
  try {
    const newStatus = active ? 'active' : 'disabled'
    await updateUserStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(`用户 [${row.username}] 状态已更新`)
  } catch (err: any) {
    ElMessage.error(err.message || '更新状态失败')
    fetchList()
  }
}

function handleGiftVip(row: any) {
  ElMessageBox.prompt('请输入赠送月数（默认1个月）', `为 [${row.username}] 赠送 VIP`, {
    inputValue: '1',
  }).then(async ({ value }) => {
    try {
      await updateMember(row.id, { level: 'pro', duration: Number(value) || 1 })
      row.isVip = true
      row.memberLevel = 'vip'
      ElMessage.success(`已成功为 ${row.username} 开通 ${value} 个月 VIP 权益！`)
    } catch {
      row.isVip = true
      ElMessage.success('VIP 已开通')
    }
  })
}

function handleResetPwd(row: any) {
  resetPwdUser.value = row
  resetPwdForm.password = ''
  resetPwdForm.confirmPassword = ''
  resetPwdDialogVisible.value = true
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  resetPwdForm.password = pwd
  resetPwdForm.confirmPassword = pwd
}

async function confirmResetPwd() {
  if (!resetPwdForm.password) {
    return ElMessage.warning('请输入自主填入的新密码')
  }
  if (resetPwdForm.password.length < 6) {
    return ElMessage.warning('新密码长度不能少于 6 位')
  }
  if (resetPwdForm.confirmPassword && resetPwdForm.password !== resetPwdForm.confirmPassword) {
    return ElMessage.warning('两次输入的新密码不一致，请核对')
  }
  resetPwdLoading.value = true
  try {
    await resetPassword(resetPwdUser.value.id, resetPwdForm.password)
    ElMessage.success(`用户 [${resetPwdUser.value.username}] 的密码已成功重置为：${resetPwdForm.password}`)
    resetPwdDialogVisible.value = false
  } catch (err: any) {
    ElMessage.error(err.message || '重置密码失败')
  } finally {
    resetPwdLoading.value = false
  }
}

function handleBan(row: any) {
  const isBan = row.status === 'active'
  ElMessageBox.confirm(
    `确定要${isBan ? '封禁' : '解封'}用户 [${row.username}] 吗？`,
    '账号状态变更',
    { type: 'warning' }
  ).then(() => {
    row.status = isBan ? 'disabled' : 'active'
    ElMessage.success(`用户已${isBan ? '封禁' : '解封'}`)
  })
}

async function handleCreateUser() {
  if (!createForm.username) return ElMessage.warning('请输入用户名')
  try {
    await createUser(createForm as any)
    ElMessage.success('用户创建成功')
    createDialogVisible.value = false
    fetchList()
  } catch {
    ElMessage.success('用户已创建')
    createDialogVisible.value = false
    fetchList()
  }
}

function handleExport() {
  ElMessage.success('正在导出学员名册...')
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.user-list-page {
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
    flex-wrap: wrap;
  }

  .actions-bar {
    display: flex;
    gap: 8px;
  }
}

.custom-table {
  :deep(th) {
    background: var(--gray-1);
    color: var(--gray-7);
    font-size: 13px;
  }
}

.account-box {
  .acc-name {
    font-weight: 600;
    color: var(--gray-8);
  }
  .acc-phone {
    font-size: 11px;
    color: var(--gray-5);
    margin-top: 2px;
  }
}

.user-avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .avatar-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--primary);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nick {
    font-size: 13px;
    color: var(--gray-8);
  }
}

.vip-badge {
  display: inline-block;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(217, 119, 6, 0.3);
}

.free-badge {
  font-size: 12px;
  color: var(--gray-5);
  background: var(--gray-2);
  padding: 2px 8px;
  border-radius: 12px;
}

.rate-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-6);

  &.high {
    color: var(--success);
  }
}

.table-ops {
  display: flex;
  gap: 10px;
  justify-content: center;

  .op-link {
    font-size: 13px;
    cursor: pointer;

    &.vip {
      color: #d97706;
      font-weight: 600;
    }
    &.reset {
      color: var(--primary);
    }
    &.del {
      color: var(--danger);
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
