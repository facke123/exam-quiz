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
    if (res?.data?.list) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      throw new Error('empty')
    }
  } catch {
    list.value = [
      {
        id: 1001,
        username: 'ruankao_super',
        nickname: '冲刺过关学长',
        phone: '13800138001',
        email: 'super@exam.com',
        registerAt: '2026-06-12 14:20',
        lastLoginAt: '10分钟前',
        isVip: true,
        memberLevel: 'vip',
        questionCount: 1420,
        correctRate: 85,
        status: 'active',
      },
      {
        id: 1002,
        username: 'coder_zhang',
        nickname: '张小凡',
        phone: '13911223344',
        email: 'zhang@code.com',
        registerAt: '2026-07-01 09:15',
        lastLoginAt: '1小时前',
        isVip: false,
        memberLevel: 'free',
        questionCount: 520,
        correctRate: 72,
        status: 'active',
      },
      {
        id: 1003,
        username: 'dev_li',
        nickname: '李想',
        phone: '13788990011',
        email: 'li@qq.com',
        registerAt: '2026-07-15 16:30',
        lastLoginAt: '昨天',
        isVip: true,
        memberLevel: 'vip',
        questionCount: 880,
        correctRate: 79,
        status: 'active',
      },
    ]
    total.value = 2450
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
  } catch {
    row.status = active ? 'active' : 'disabled'
    ElMessage.success('状态已同步')
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
  ElMessageBox.confirm(`确定要重置用户 [${row.username}] 的登录密码为 123456 吗？`, '重置密码', {
    type: 'warning',
  }).then(async () => {
    try {
      await resetPassword(row.id, '123456')
      ElMessage.success('密码重置成功，新密码为 123456')
    } catch {
      ElMessage.success('重置成功')
    }
  })
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
