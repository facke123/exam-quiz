<template>
  <div class="vip-manage-page">
    <!-- 顶部标题与说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">💎 VIP 会员与套餐价格配置</h2>
        <p class="subtitle">实时管理全站 VIP 会员套餐价格、会员名称、有效期限与权益说明，并查询与管理 VIP 学员名单</p>
      </div>
      <div class="header-actions">
        <el-button v-if="activeTab === 'plans'" type="primary" class="primary-btn" @click="handleAddPlan">
          <el-icon><Plus /></el-icon> 新建会员套餐
        </el-button>
        <el-button v-if="activeTab === 'users'" type="primary" class="primary-btn" @click="handleOpenGrantModal">
          <el-icon><Plus /></el-icon> 手动赠送 / 开通 VIP
        </el-button>
      </div>
    </div>

    <!-- 顶部数据概览统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon bg-gold">💎</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.totalVipCount }}</div>
          <div class="stat-label">VIP 会员总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-purple">👑</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.lifetimeCount }}</div>
          <div class="stat-label">永久尊享会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-blue">📅</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.yearlyCount }}</div>
          <div class="stat-label">年卡会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald">⏱️</div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.quarterlyCount + stats.monthlyCount }}</div>
          <div class="stat-label">季卡 / 月卡会员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-indigo">🏷️</div>
        <div class="stat-info">
          <div class="stat-num">{{ planList.length }}</div>
          <div class="stat-label">在售会员套餐</div>
        </div>
      </div>
    </div>

    <!-- 主体 Tabs 面板 -->
    <div class="main-tabs-card">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <!-- Tab 1: VIP 套餐与价格配置 -->
        <el-tab-pane name="plans">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Setting /></el-icon>
              <span>VIP 会员套餐与价格配置 ({{ planList.length }})</span>
            </span>
          </template>

          <!-- 顶部工具栏 -->
          <div class="filter-toolbar">
            <div class="toolbar-left">
              <span class="tool-tip">💡 前台 H5「会员中心」页面将实时根据下表展示对应套餐名称、价格与权益。</span>
            </div>
            <div class="toolbar-right">
              <el-button type="warning" plain icon="RefreshRight" @click="handleResetDefaultPlans">
                重置为官方默认价格 (月卡6/季卡15/年卡60/永久68)
              </el-button>
              <el-button icon="Refresh" @click="fetchPlans">刷新</el-button>
            </div>
          </div>

          <!-- 套餐数据表格 -->
          <el-table v-loading="plansLoading" :data="planList" class="custom-table" stripe border>
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="套餐名称" min-width="160">
              <template #default="{ row }">
                <div class="plan-name-cell">
                  <span class="p-emoji">{{ getPlanEmoji(row.type) }}</span>
                  <div class="p-title-box">
                    <span class="p-name">{{ row.name }}</span>
                    <span v-if="row.type === 'lifetime' || row.duration >= 30000" class="badge-lifetime">永久终身</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="类型标识" width="130" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getPlanTagType(row.type)">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="售卖现价 (¥)" width="140" align="center">
              <template #default="{ row }">
                <span class="price-highlight">¥{{ row.price }}</span>
              </template>
            </el-table-column>

            <el-table-column label="划线原价 (¥)" width="130" align="center">
              <template #default="{ row }">
                <span class="orig-price-text">¥{{ row.originalPrice || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="有效时长" width="130" align="center">
              <template #default="{ row }">
                <span v-if="row.type === 'lifetime' || row.duration >= 30000" class="duration-lifetime">
                  永久有效
                </span>
                <span v-else class="duration-days">
                  {{ row.duration }} 天
                </span>
              </template>
            </el-table-column>

            <el-table-column label="核心功能特性 / 权益清单" min-width="260">
              <template #default="{ row }">
                <div class="features-wrap">
                  <el-tag
                    v-for="(f, i) in (Array.isArray(row.features) ? row.features : [])"
                    :key="i"
                    size="small"
                    effect="plain"
                    class="f-tag"
                  >
                    {{ f }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="上架状态" width="120" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status === 1"
                  active-text="上架"
                  inactive-text="下架"
                  inline-prompt
                  @change="(val) => handleTogglePlanStatus(row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button link type="primary" size="small" @click="handleEditPlan(row)">
                    编辑设置
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDeletePlan(row)">
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: VIP 会员用户查询与权限管理 -->
        <el-tab-pane name="users">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><User /></el-icon>
              <span>VIP 会员用户查询 ({{ vipUsersTotal }})</span>
            </span>
          </template>

          <!-- 筛选工具栏 -->
          <div class="filter-toolbar">
            <div class="filter-inputs">
              <el-input
                v-model="userQuery.keyword"
                placeholder="🔍 搜索学员账号 / 手机号 / 邮箱..."
                prefix-icon="Search"
                clearable
                style="width: 280px"
                @keyup.enter="fetchVipUsers"
              />
              <el-select
                v-model="userQuery.vipLevel"
                placeholder="全部会员类型"
                clearable
                style="width: 170px"
                @change="fetchVipUsers"
              >
                <el-option label="全部 VIP 会员" value="" />
                <el-option label="👑 永久尊享会员" value="lifetime" />
                <el-option label="📅 年卡会员" value="yearly" />
                <el-option label="⏱️ 季卡会员" value="quarterly" />
                <el-option label="⏱️ 月卡会员" value="monthly" />
              </el-select>
              <el-button type="primary" icon="Search" @click="fetchVipUsers">查询</el-button>
              <el-button @click="resetUserQuery">重置</el-button>
            </div>
            <div class="filter-ops">
              <el-button icon="Refresh" @click="fetchVipUsers">刷新</el-button>
            </div>
          </div>

          <!-- VIP 用户数据表格 -->
          <el-table v-loading="usersLoading" :data="vipUserList" class="custom-table" stripe border>
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="学员账号 / 昵称" min-width="200">
              <template #default="{ row }">
                <div class="user-cell">
                  <el-avatar :size="36" :src="row.avatar" class="u-avatar">
                    {{ (row.nickname || row.username).charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="u-text">
                    <div class="u-name">{{ row.username }}</div>
                    <div class="u-nick">{{ row.nickname || '未设置昵称' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="手机号 / 邮箱" min-width="170">
              <template #default="{ row }">
                <div class="contact-cell">
                  <div v-if="row.phone" class="phone">📱 {{ row.phone }}</div>
                  <div v-if="row.email" class="email">✉️ {{ row.email }}</div>
                  <div v-if="!row.phone && !row.email" class="none">—</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="会员等级" width="160" align="center">
              <template #default="{ row }">
                <span v-if="row.isLifetime || row.vipLevel >= 4" class="vip-badge-lifetime">
                  👑 永久尊享会员
                </span>
                <span v-else-if="row.vipLevel === 3" class="vip-badge-yearly">
                  📅 年卡会员
                </span>
                <span v-else-if="row.vipLevel === 2" class="vip-badge-quarterly">
                  ⏱️ 季卡会员
                </span>
                <span v-else class="vip-badge-monthly">
                  ⏱️ 月卡会员
                </span>
              </template>
            </el-table-column>

            <el-table-column label="VIP 有效期 / 状态" min-width="200" align="center">
              <template #default="{ row }">
                <div class="expire-cell">
                  <div v-if="row.isLifetime || row.vipLevel >= 4" class="exp-lifetime">
                    ✨ 永久有效 (终身免续费)
                  </div>
                  <div v-else class="exp-date">
                    <span>{{ formatTime(row.vipExpireAt) }}</span>
                    <span v-if="row.daysRemaining !== undefined" class="days-pill">
                      余 {{ row.daysRemaining }} 天
                    </span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="账号状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'active' ? '正常' : '已禁用' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button link type="primary" size="small" @click="handleEditUserVip(row)">
                    调整会员 / 续期
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleRevokeVip(row)">
                    取消资格
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="userQuery.page"
              v-model:page-size="userQuery.pageSize"
              :total="vipUsersTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchVipUsers"
              @current-change="fetchVipUsers"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗 1：新增 / 编辑会员套餐 -->
    <el-dialog
      v-model="planDialogVisible"
      :title="isEditPlan ? `编辑套餐 [${planForm.name}]` : '新建会员套餐'"
      width="540px"
      destroy-on-close
    >
      <el-form ref="planFormRef" :model="planForm" :rules="planRules" label-width="110px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="planForm.name" placeholder="例如：永久尊享会员 / 季卡会员" />
        </el-form-item>

        <el-form-item label="类型标识" prop="type">
          <el-select v-model="planForm.type" style="width: 100%" placeholder="选择类型标识">
            <el-option label="月卡 (monthly)" value="monthly" />
            <el-option label="季卡 (quarterly)" value="quarterly" />
            <el-option label="年卡 (yearly)" value="yearly" />
            <el-option label="永久会员 (lifetime)" value="lifetime" />
            <el-option label="自定义套餐 (custom)" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="售卖现价 (¥)" prop="price">
          <el-input-number
            v-model="planForm.price"
            :min="0.01"
            :max="99999"
            :precision="2"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="划线原价 (¥)">
          <el-input-number
            v-model="planForm.originalPrice"
            :min="0"
            :max="99999"
            :precision="2"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="有效天数" prop="duration">
          <el-input-number
            v-model="planForm.duration"
            :min="1"
            :max="99999"
            :step="30"
            style="width: 100%"
          />
          <div class="form-tip">💡 永久会员建议填 36500 天（100年）</div>
        </el-form-item>

        <el-form-item label="功能权益说明">
          <el-input
            v-model="planForm.featuresText"
            type="textarea"
            :rows="4"
            placeholder="每行输入一条特权说明，例如：&#10;解锁全科全部历年真题与题库&#10;AI 智能极速考点精解&#10;永久免费同步新考季真题"
          />
        </el-form-item>

        <el-form-item label="上架状态">
          <el-radio-group v-model="planForm.status">
            <el-radio :value="1">正常上架 (前台可见)</el-radio>
            <el-radio :value="0">暂时下架 (前台隐藏)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="planSubmitLoading" @click="handleSavePlan">
          确认保存套餐
        </el-button>
      </template>
    </el-dialog>

    <!-- 弹窗 2：手动开通 / 调整学员 VIP 权限 -->
    <el-dialog
      v-model="grantDialogVisible"
      :title="currentUserToGrant ? `调整学员 [${currentUserToGrant.username}] VIP 权益` : '手动为学员开通 VIP'"
      width="520px"
    >
      <el-form :model="grantForm" label-width="110px">
        <el-form-item v-if="!currentUserToGrant" label="目标学员" required>
          <el-input
            v-model="grantForm.targetUsername"
            placeholder="请输入需要开通 VIP 的用户名 / 手机号"
          />
        </el-form-item>

        <el-form-item label="选择开通等级" required>
          <el-radio-group v-model="grantForm.memberLevel" class="grant-radio-group">
            <el-radio value="lifetime">
              <span class="gr-label">👑 永久尊享会员 (终身有效)</span>
            </el-radio>
            <el-radio value="yearly">
              <span class="gr-label">📅 年卡会员 (365天)</span>
            </el-radio>
            <el-radio value="quarterly">
              <span class="gr-label">⏱️ 季卡会员 (90天)</span>
            </el-radio>
            <el-radio value="monthly">
              <span class="gr-label">⏱️ 月卡会员 (30天)</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="开通方式">
          <el-radio-group v-model="grantForm.grantMode">
            <el-radio value="plan">按套餐默认时长开通</el-radio>
            <el-radio value="custom">自定义到期时间</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="grantForm.grantMode === 'custom'" label="指定到期时间">
          <el-date-picker
            v-model="grantForm.customExpireAt"
            type="datetime"
            placeholder="选择到期日期时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="grantDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantSubmitLoading" @click="handleConfirmGrant">
          确认开通 / 变更
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Setting, User, Search, Refresh, RefreshRight } from '@element-plus/icons-vue'
import {
  getMemberPlans,
  createMemberPlan,
  updateMemberPlan,
  deleteMemberPlan,
  resetDefaultMemberPlans,
  getVipUserList,
  getVipStats,
  updateMember,
  type MemberPlanItem,
  type VipStats,
} from '@/api/user'

// 状态定义
const activeTab = ref('plans')
const plansLoading = ref(false)
const usersLoading = ref(false)
const planSubmitLoading = ref(false)
const grantSubmitLoading = ref(false)

const planList = ref<MemberPlanItem[]>([])
const vipUserList = ref<any[]>([])
const vipUsersTotal = ref(0)

const stats = reactive<VipStats>({
  totalVipCount: 0,
  lifetimeCount: 0,
  yearlyCount: 0,
  quarterlyCount: 0,
  monthlyCount: 0,
  planCount: 0,
})

// 套餐弹窗表单
const planDialogVisible = ref(false)
const isEditPlan = ref(false)
const planFormRef = ref()
const planForm = reactive({
  id: 0,
  name: '',
  type: 'monthly',
  price: 6,
  originalPrice: 19,
  duration: 30,
  featuresText: '',
  status: 1,
})

const planRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型标识', trigger: 'change' }],
  price: [{ required: true, message: '请输入售卖价格', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入有效天数', trigger: 'blur' }],
}

// 用户查询与授权弹窗
const userQuery = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  vipLevel: '',
})

const grantDialogVisible = ref(false)
const currentUserToGrant = ref<any>(null)
const grantForm = reactive({
  targetUsername: '',
  memberLevel: 'lifetime',
  grantMode: 'plan',
  customExpireAt: '',
})

// ==================== 套餐数据加载与操作 ====================
async function fetchPlans() {
  plansLoading.value = true
  try {
    const res = await getMemberPlans()
    if (res?.data) {
      planList.value = res.data
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取会员套餐列表失败')
  } finally {
    plansLoading.value = false
  }
}

async function fetchStats() {
  try {
    const res = await getVipStats()
    if (res?.data) {
      Object.assign(stats, res.data)
    }
  } catch {
    // ignore
  }
}

function handleAddPlan() {
  isEditPlan.value = false
  planForm.id = 0
  planForm.name = ''
  planForm.type = 'monthly'
  planForm.price = 6
  planForm.originalPrice = 19
  planForm.duration = 30
  planForm.featuresText = '解锁全部章节试题\nAI 智能考点解析\n错题本无上限\n艾宾浩斯智能复习'
  planForm.status = 1
  planDialogVisible.value = true
}

function handleEditPlan(row: MemberPlanItem) {
  isEditPlan.value = true
  planForm.id = row.id
  planForm.name = row.name
  planForm.type = row.type
  planForm.price = Number(row.price)
  planForm.originalPrice = Number(row.originalPrice || row.price * 2)
  planForm.duration = Number(row.duration)
  planForm.featuresText = Array.isArray(row.features) ? row.features.join('\n') : ''
  planForm.status = row.status
  planDialogVisible.value = true
}

async function handleSavePlan() {
  if (!planFormRef.value) return
  await planFormRef.value.validate()

  planSubmitLoading.value = true
  try {
    const payload = {
      name: planForm.name,
      type: planForm.type,
      price: planForm.price,
      originalPrice: planForm.originalPrice,
      duration: planForm.duration,
      features: planForm.featuresText.split('\n').filter(Boolean),
      status: planForm.status,
    }

    if (isEditPlan.value) {
      await updateMemberPlan(planForm.id, payload)
      ElMessage.success(`套餐 [${planForm.name}] 配置已更新！`)
    } else {
      await createMemberPlan(payload)
      ElMessage.success(`新增套餐 [${planForm.name}] 成功！`)
    }

    planDialogVisible.value = false
    fetchPlans()
    fetchStats()
  } catch (err: any) {
    ElMessage.error(err.message || '保存套餐失败')
  } finally {
    planSubmitLoading.value = false
  }
}

async function handleTogglePlanStatus(row: MemberPlanItem, val: boolean) {
  const newStatus = val ? 1 : 0
  try {
    await updateMemberPlan(row.id, { status: newStatus })
    row.status = newStatus
    ElMessage.success(`套餐 [${row.name}] 已成功${val ? '上架' : '下架'}`)
  } catch (err: any) {
    ElMessage.error(err.message || '更新状态失败')
  }
}

async function handleDeletePlan(row: MemberPlanItem) {
  try {
    await ElMessageBox.confirm(`确定删除会员套餐「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteMemberPlan(row.id)
    ElMessage.success('套餐已删除')
    fetchPlans()
    fetchStats()
  } catch {
    // cancel
  }
}

async function handleResetDefaultPlans() {
  try {
    await ElMessageBox.confirm(
      '确定重置为系统默认价格吗？将自动恢复为：月卡 ¥6、季卡 ¥15、年卡 ¥60、永久会员 ¥68。',
      '重置确认',
      { type: 'warning', confirmButtonText: '确定重置', cancelButtonText: '取消' },
    )
    await resetDefaultMemberPlans()
    ElMessage.success('官方标准套餐价格已成功重置！')
    fetchPlans()
    fetchStats()
  } catch {
    // cancel
  }
}

// ==================== VIP 会员用户加载与操作 ====================
async function fetchVipUsers() {
  usersLoading.value = true
  try {
    const res = await getVipUserList(userQuery)
    if (res?.data) {
      vipUserList.value = res.data.list || []
      vipUsersTotal.value = res.data.total || 0
      if (res.data.stats) {
        Object.assign(stats, res.data.stats)
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取 VIP 会员列表失败')
  } finally {
    usersLoading.value = false
  }
}

function resetUserQuery() {
  userQuery.page = 1
  userQuery.keyword = ''
  userQuery.vipLevel = ''
  fetchVipUsers()
}

function handleOpenGrantModal() {
  currentUserToGrant.value = null
  grantForm.targetUsername = ''
  grantForm.memberLevel = 'lifetime'
  grantForm.grantMode = 'plan'
  grantForm.customExpireAt = ''
  grantDialogVisible.value = true
}

function handleEditUserVip(row: any) {
  currentUserToGrant.value = row
  grantForm.targetUsername = row.username
  grantForm.memberLevel = row.isLifetime ? 'lifetime' : (row.vipLevelCode || 'yearly')
  grantForm.grantMode = 'plan'
  grantForm.customExpireAt = ''
  grantDialogVisible.value = true
}

async function handleConfirmGrant() {
  if (!currentUserToGrant.value && !grantForm.targetUsername) {
    return ElMessage.warning('请输入需要开通 VIP 的学员账号')
  }

  grantSubmitLoading.value = true
  try {
    const userId = currentUserToGrant.value?.id || 1
    const payload: any = {
      memberLevel: grantForm.memberLevel,
      isLifetime: grantForm.memberLevel === 'lifetime',
    }

    if (grantForm.grantMode === 'custom' && grantForm.customExpireAt) {
      payload.expireAt = new Date(grantForm.customExpireAt).toISOString()
    }

    await updateMember(userId, payload)
    ElMessage.success('学员 VIP 权益配置已生效！')
    grantDialogVisible.value = false
    fetchVipUsers()
    fetchStats()
  } catch (err: any) {
    ElMessage.error(err.message || '开通/调整 VIP 失败')
  } finally {
    grantSubmitLoading.value = false
  }
}

async function handleRevokeVip(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定取消学员 [${row.username}] 的 VIP 会员资格吗？`,
      '取消资格警告',
      { type: 'warning', confirmButtonText: '确定取消', cancelButtonText: '关闭' },
    )
    await updateMember(row.id, { memberLevel: 'free' })
    ElMessage.success(`已取消学员 [${row.username}] 的 VIP 资格`)
    fetchVipUsers()
    fetchStats()
  } catch {
    // cancel
  }
}

// 辅助函数
function getPlanEmoji(type: string) {
  switch (type) {
    case 'lifetime':
      return '👑'
    case 'yearly':
      return '📅'
    case 'quarterly':
      return '⏱️'
    case 'monthly':
      return '🌱'
    default:
      return '🏷️'
  }
}

function getPlanTagType(type: string) {
  switch (type) {
    case 'lifetime':
      return 'danger'
    case 'yearly':
      return 'warning'
    case 'quarterly':
      return 'primary'
    case 'monthly':
      return 'success'
    default:
      return 'info'
  }
}

function formatTime(val: string | null) {
  if (!val) return '永久有效'
  const d = new Date(val)
  if (isNaN(d.getTime()) || d.getFullYear() >= 2090) return '永久有效'
  return d.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  fetchPlans()
  fetchVipUsers()
  fetchStats()
})
</script>

<style scoped lang="scss">
.vip-manage-page {
  padding: 24px;
  background: var(--bg-page, #f8fafc);
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 4px 0 0 0;
  }

  .primary-btn {
    padding: 8px 18px;
    font-weight: 600;
  }
}

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.bg-gold { background: #fef3c7; }
    &.bg-purple { background: #f5f3ff; }
    &.bg-blue { background: #e0f2fe; }
    &.bg-emerald { background: #ecfdf5; }
    &.bg-indigo { background: #eef2ff; }
  }

  .stat-info {
    .stat-num {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
  }
}

/* 主面板 */
.main-tabs-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
  overflow: hidden;
  padding: 16px 20px 24px;
}

.tab-label-custom {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* 工具栏 */
.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;

  .toolbar-left {
    .tool-tip {
      font-size: 13px;
      color: #64748b;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 10px;
  }

  .filter-inputs {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* 表格单元格样式 */
.plan-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .p-emoji { font-size: 18px; }
  .p-title-box {
    display: flex;
    align-items: center;
    gap: 6px;

    .p-name {
      font-weight: 700;
      color: #0f172a;
    }

    .badge-lifetime {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 8px;
    }
  }
}

.price-highlight {
  font-weight: 800;
  font-size: 16px;
  color: #d97706;
}

.orig-price-text {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 13px;
}

.duration-lifetime {
  color: #dc2626;
  font-weight: 700;
}

.duration-days {
  color: #334155;
  font-weight: 600;
}

.features-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .f-tag {
    font-size: 11px;
    border-radius: 4px;
  }
}

/* 用户表格单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .u-avatar {
    background: #6366f1;
    color: #fff;
    font-weight: 700;
  }

  .u-text {
    .u-name {
      font-weight: 700;
      color: #0f172a;
    }
    .u-nick {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
  }
}

.contact-cell {
  font-size: 12px;
  color: #334155;
  .phone { margin-bottom: 2px; }
  .email { color: #64748b; }
}

.vip-badge-lifetime {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-yearly {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-quarterly {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.vip-badge-monthly {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.expire-cell {
  font-size: 12px;
  .exp-lifetime {
    color: #dc2626;
    font-weight: 700;
  }
  .exp-date {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #334155;

    .days-pill {
      background: #fef3c7;
      color: #b45309;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 8px;
    }
  }
}

.ops-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.grant-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .gr-label {
    font-size: 13px;
    font-weight: 600;
  }
}
</style>