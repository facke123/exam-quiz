<template>
  <div class="admin-setting-page">
    <!-- 顶部页面标题与说明 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">⚙️ 系统管理员与权限设置</h2>
        <p class="subtitle">管理后台管理员账号、配置角色与细粒度功能权限树，保障系统安全与分工明确</p>
      </div>
      <div class="header-actions">
        <el-button v-if="activeTab === 'admins'" type="primary" class="primary-btn" @click="handleAddAdmin">
          <el-icon><Plus /></el-icon> 新增管理员
        </el-button>
        <el-button v-if="activeTab === 'roles'" type="primary" class="primary-btn" @click="handleAddRole">
          <el-icon><Plus /></el-icon> 新建自定义角色
        </el-button>
      </div>
    </div>

    <!-- 顶部数据概览统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon bg-indigo">👥</div>
        <div class="stat-info">
          <div class="stat-num">{{ adminList.length }}</div>
          <div class="stat-label">管理员总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-purple">👑</div>
        <div class="stat-info">
          <div class="stat-num">{{ countByRole('super_admin') }}</div>
          <div class="stat-label">超级管理员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-blue">🎓</div>
        <div class="stat-info">
          <div class="stat-num">{{ countByRole('editor') + countByRole('teacher') }}</div>
          <div class="stat-label">教研命题专家</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald">🚀</div>
        <div class="stat-info">
          <div class="stat-num">{{ countByRole('operator') + countByRole('finance') }}</div>
          <div class="stat-label">运营与客服专员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-green">🟢</div>
        <div class="stat-info">
          <div class="stat-num">{{ activeCount }}</div>
          <div class="stat-label">状态正常</div>
        </div>
      </div>
    </div>

    <!-- 主体 Tabs 面板 -->
    <div class="main-tabs-card">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <!-- Tab 1: 管理员账号管理 -->
        <el-tab-pane name="admins">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><User /></el-icon>
              <span>管理员账号 ({{ adminList.length }})</span>
            </span>
          </template>

          <!-- 筛选与搜索工具栏 -->
          <div class="filter-toolbar">
            <div class="filter-inputs">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索管理员账号 / 真实姓名..."
                prefix-icon="Search"
                clearable
                style="width: 260px"
              />
              <el-select v-model="filterRole" placeholder="所属角色" clearable style="width: 170px">
                <el-option label="全部角色" value="" />
                <el-option
                  v-for="r in roleList"
                  :key="r.code"
                  :label="r.name"
                  :value="r.code"
                />
              </el-select>
              <el-select v-model="filterStatus" placeholder="账号状态" clearable style="width: 130px">
                <el-option label="全部状态" value="" />
                <el-option label="正常" value="active" />
                <el-option label="已禁用" value="disabled" />
              </el-select>
            </div>
            <div class="filter-ops">
              <el-button icon="Refresh" @click="fetchData">刷新</el-button>
            </div>
          </div>

          <!-- 管理员数据表格 -->
          <el-table
            v-loading="loading"
            :data="filteredAdmins"
            class="admin-table"
            stripe
            border
          >
            <el-table-column prop="id" label="ID" width="70" align="center" />

            <el-table-column label="管理员信息" min-width="200">
              <template #default="{ row }">
                <div class="user-cell">
                  <el-avatar :size="36" :src="row.avatar" class="user-avatar">
                    {{ (row.realName || row.username).charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="user-text">
                    <div class="uname">
                      {{ row.username }}
                      <el-tag v-if="row.username === 'admin'" size="small" type="danger" effect="plain">主账号</el-tag>
                    </div>
                    <div class="realname">{{ row.realName || row.nickname || '未填写真实姓名' }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="所属角色" width="160" align="center">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)" effect="light" class="role-badge">
                  {{ getRoleName(row.role) }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 核心：权限明细展示 -->
            <el-table-column label="功能权限明细" min-width="320">
              <template #default="{ row }">
                <div v-if="row.role === 'super_admin' || row.role === 'admin'" class="super-perm-tag">
                  <el-tag type="danger" effect="dark" size="small">
                    👑 全站最高权限 (无限制)
                  </el-tag>
                </div>
                <div v-else class="perm-tags-wrap">
                  <el-tag
                    v-for="p in getReadablePermissions(row.role)"
                    :key="p.code"
                    :type="p.tagType"
                    size="small"
                    class="perm-chip"
                  >
                    {{ p.name }}
                  </el-tag>
                  <el-popover
                    placement="top"
                    :width="360"
                    trigger="hover"
                    :title="`[${row.username}] 完整权限树`"
                  >
                    <template #reference>
                      <el-tag size="small" type="info" class="perm-more-btn">
                        查看明细 ›
                      </el-tag>
                    </template>
                    <div class="perm-popover-content">
                      <div class="pop-role-desc">{{ getRoleDesc(row.role) }}</div>
                      <div class="pop-nodes">
                        <div v-for="item in getDetailedPermissionItems(row.role)" :key="item" class="pop-node-item">
                          ✅ {{ item }}
                        </div>
                      </div>
                    </div>
                  </el-popover>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="账号状态" width="120" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status === 'active' || row.status === 1"
                  :disabled="row.username === 'admin'"
                  active-text="正常"
                  inactive-text="禁用"
                  inline-prompt
                  @change="(val) => handleToggleStatus(row, val)"
                />
              </template>
            </el-table-column>

            <el-table-column label="最近活跃 / 创建时间" width="180" align="center">
              <template #default="{ row }">
                <div class="time-cell">
                  <div class="time-main">{{ row.lastLoginAt ? formatTime(row.lastLoginAt) : '从未登录' }}</div>
                  <div class="time-sub">注册: {{ formatTime(row.createdAt) }}</div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="{ row }">
                <div class="ops-cell">
                  <el-button link type="primary" size="small" @click="handleEditAdmin(row)">
                    编辑
                  </el-button>
                  <el-button link type="warning" size="small" @click="handleOpenPermModal(row)">
                    分配权限
                  </el-button>
                  <el-button link type="info" size="small" @click="handleResetPassword(row)">
                    重置密码
                  </el-button>
                  <el-button
                    v-if="row.username !== 'admin'"
                    link
                    type="danger"
                    size="small"
                    @click="handleDeleteAdmin(row)"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: 角色与权限矩阵配置 -->
        <el-tab-pane name="roles">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Lock /></el-icon>
              <span>角色与权限矩阵 ({{ roleList.length }})</span>
            </span>
          </template>

          <div class="role-matrix-layout">
            <!-- 左侧：角色列表卡片 -->
            <div class="role-list-sidebar">
              <div class="sidebar-header">
                <span class="sidebar-title">系统内置与自定义角色</span>
                <span class="sidebar-tip">点击切换查看对应权限树</span>
              </div>
              <div class="role-cards-list">
                <div
                  v-for="r in roleList"
                  :key="r.code"
                  class="role-item-card"
                  :class="{ active: selectedRole?.code === r.code }"
                  @click="selectRole(r)"
                >
                  <div class="r-top">
                    <span class="r-icon">{{ getRoleEmoji(r.code) }}</span>
                    <span class="r-name">{{ r.name }}</span>
                    <el-tag size="small" :type="getRoleTagType(r.code)" class="r-count">
                      {{ r.adminCount || 0 }} 人
                    </el-tag>
                  </div>
                  <div class="r-desc">{{ r.description || '暂无描述' }}</div>
                  <div class="r-code">标识: <code>{{ r.code }}</code></div>
                </div>
              </div>
            </div>

            <!-- 右侧：当前选中角色的权限树详情 -->
            <div class="role-perm-detail">
              <div v-if="selectedRole" class="detail-panel">
                <div class="panel-header">
                  <div class="role-title-box">
                    <span class="role-emoji">{{ getRoleEmoji(selectedRole.code) }}</span>
                    <div>
                      <h3 class="role-title">{{ selectedRole.name }}</h3>
                      <p class="role-intro">{{ selectedRole.description }}</p>
                    </div>
                  </div>
                  <div class="panel-ops">
                    <el-button
                      v-if="selectedRole.code !== 'super_admin'"
                      type="primary"
                      @click="handleSaveRolePermissions"
                    >
                      保存权限配置
                    </el-button>
                    <el-button
                      v-if="!['super_admin', 'editor', 'operator'].includes(selectedRole.code)"
                      type="danger"
                      plain
                      @click="handleDeleteRole(selectedRole)"
                    >
                      删除该角色
                    </el-button>
                  </div>
                </div>

                <el-alert
                  v-if="selectedRole.code === 'super_admin'"
                  title="👑 超级管理员默认拥有系统内所有功能模块的完全控制权限，无需单独勾选。"
                  type="success"
                  :closable="false"
                  show-icon
                  class="super-alert"
                />

                <!-- 权限树选择矩阵 -->
                <div class="perm-tree-wrapper">
                  <div class="tree-tools">
                    <span class="tree-heading">功能模块权限清单</span>
                    <div class="tree-btn-group">
                      <el-button size="small" @click="checkAllPerms">全选所有</el-button>
                      <el-button size="small" @click="uncheckAllPerms">全部清空</el-button>
                      <el-button size="small" @click="expandAllNodes">全部展开</el-button>
                      <el-button size="small" @click="collapseAllNodes">全部折叠</el-button>
                    </div>
                  </div>

                  <el-tree
                    ref="permTreeRef"
                    :data="permissionTreeData"
                    show-checkbox
                    node-key="id"
                    default-expand-all
                    :props="{ label: 'label', children: 'children' }"
                    :disabled="selectedRole.code === 'super_admin'"
                    class="custom-perm-tree"
                  >
                    <template #default="{ data }">
                      <div class="custom-tree-node">
                        <span class="node-icon">{{ data.icon || '📄' }}</span>
                        <span class="node-label">{{ data.label }}</span>
                        <span v-if="data.code" class="node-code">({{ data.code }})</span>
                        <span v-if="data.desc" class="node-desc">{{ data.desc }}</span>
                      </div>
                    </template>
                  </el-tree>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 操作日志与审计 -->
        <el-tab-pane name="logs">
          <template #label>
            <span class="tab-label-custom">
              <el-icon><Document /></el-icon>
              <span>管理员操作审计日志</span>
            </span>
          </template>
          <div class="log-tab-wrapper">
            <OperationLogView />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗 1：新增/编辑管理员 -->
    <el-dialog
      v-model="adminDialogVisible"
      :title="isEditAdmin ? `编辑管理员 [${adminForm.username}]` : '新增管理员账号'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="adminFormRef" :model="adminForm" :rules="adminRules" label-width="100px">
        <el-form-item label="登录账号" prop="username">
          <el-input
            v-model="adminForm.username"
            placeholder="请输入管理员登录用户名"
            :disabled="isEditAdmin"
          />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="adminForm.realName" placeholder="例如：张教研 / 李主管" />
        </el-form-item>
        <el-form-item v-if="!isEditAdmin" label="登录密码" prop="password">
          <el-input
            v-model="adminForm.password"
            type="password"
            placeholder="默认初始密码 admin123"
            show-password
          />
        </el-form-item>
        <el-form-item label="分配角色" prop="role">
          <el-select v-model="adminForm.role" style="width: 100%" placeholder="请选择权限角色">
            <el-option
              v-for="r in roleList"
              :key="r.code"
              :label="`${r.name} (${r.description})`"
              :value="r.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-radio-group v-model="adminForm.status">
            <el-radio value="active">正常启用</el-radio>
            <el-radio value="disabled">暂时禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adminDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSaveAdmin">
          确认保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 弹窗 2：快速调整管理员权限/角色 -->
    <el-dialog
      v-model="permModalVisible"
      :title="`为管理员 [${currentAdmin?.username}] 配置权限`"
      width="560px"
    >
      <div v-if="currentAdmin" class="perm-modal-body">
        <div class="curr-adm-info">
          <el-avatar :size="40" :src="currentAdmin.avatar" />
          <div class="curr-adm-meta">
            <div class="name">{{ currentAdmin.username }} ({{ currentAdmin.realName || '管理员' }})</div>
            <div class="sub">当前角色：<el-tag size="small">{{ getRoleName(currentAdmin.role) }}</el-tag></div>
          </div>
        </div>

        <el-divider content-position="left">切换授权角色</el-divider>
        <div class="role-select-cards">
          <div
            v-for="r in roleList"
            :key="r.code"
            class="role-select-card"
            :class="{ chosen: targetRoleCode === r.code }"
            @click="targetRoleCode = r.code"
          >
            <div class="rs-head">
              <span class="rs-emoji">{{ getRoleEmoji(r.code) }}</span>
              <span class="rs-title">{{ r.name }}</span>
            </div>
            <div class="rs-desc">{{ r.description }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="permModalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApplyRoleChange">确认变更角色与权限</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗 3：新建自定义角色 -->
    <el-dialog v-model="roleDialogVisible" title="新建自定义角色" width="500px">
      <el-form :model="roleForm" label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" placeholder="例如：外部审核专家" />
        </el-form-item>
        <el-form-item label="角色标识" required>
          <el-input v-model="roleForm.code" placeholder="例如：reviewer (英文字符)" />
        </el-form-item>
        <el-form-item label="角色说明">
          <el-input v-model="roleForm.description" type="textarea" placeholder="说明该角色职责与权限范围" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveNewRole">创建角色</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, Lock, Document, Search } from '@element-plus/icons-vue'
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
} from '@/api/system'
import OperationLogView from './OperationLog.vue'

// ==================== 状态定义 ====================
const activeTab = ref('admins')
const loading = ref(false)
const submitLoading = ref(false)
const adminList = ref<any[]>([])
const roleList = ref<any[]>([])
const selectedRole = ref<any>(null)
const permTreeRef = ref<any>(null)

// 检索与筛选
const searchKeyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// 管理员弹窗
const adminDialogVisible = ref(false)
const isEditAdmin = ref(false)
const adminFormRef = ref()
const adminForm = reactive({
  id: 0,
  username: '',
  realName: '',
  password: '',
  role: 'editor',
  status: 'active',
})

const adminRules = {
  username: [{ required: true, message: '请输入管理员登录账号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择分配角色', trigger: 'change' }],
}

// 快速授权弹窗
const permModalVisible = ref(false)
const currentAdmin = ref<any>(null)
const targetRoleCode = ref('editor')

// 新建角色弹窗
const roleDialogVisible = ref(false)
const roleForm = reactive({
  name: '',
  code: '',
  description: '',
})

// ==================== 权限树字典定义 ====================
const permissionTreeData = [
  {
    id: 'question',
    label: '📚 题库与真题管理',
    icon: '📚',
    children: [
      { id: 'question:view', label: '查看试题列表', code: 'question:view', desc: '可检索各科目题目与知识点' },
      { id: 'question:edit', label: '题目新增与修改', code: 'question:edit', desc: '可创建、编辑单选/多选/判断/主观题' },
      { id: 'question:delete', label: '题目删除', code: 'question:delete', desc: '可永久删除题库题目' },
      { id: 'question:import', label: 'Word/文档智能导入', code: 'question:import', desc: '批量解析并导入题库' },
      { id: 'question:feedback', label: '错题工单与反馈', code: 'question:feedback', desc: '审核用户上报的试题疑问' },
      { id: 'exam:generate', label: '智能组卷与试卷生成', code: 'exam:generate', desc: '生成真题或模拟试卷' },
      { id: 'exam:publish', label: '试卷发布与停用', code: 'exam:publish', desc: '上线试卷供学员练习' },
    ],
  },
  {
    id: 'ai',
    label: '🤖 AI 与大模型系统',
    icon: '🤖',
    children: [
      { id: 'ai:generate', label: 'AI 批量智能命题', code: 'ai:generate', desc: '调用大模型自动出题' },
      { id: 'ai:analysis', label: 'AI 深度题目解析生成', code: 'ai:analysis', desc: '生成考点解析与名师详解' },
      { id: 'ai:prompt', label: 'Prompt 提示词模板管理', code: 'ai:prompt', desc: '配置与调优AI出题指令' },
      { id: 'ai:model_config', label: 'AI 模型接口与Key配置', code: 'ai:model_config', desc: '配置GPT/DeepSeek等模型参数' },
      { id: 'ai:audit', label: 'AI 题目入库审核', code: 'ai:audit', desc: '人工验收AI生成的试题' },
    ],
  },
  {
    id: 'user',
    label: '👥 学员与会员管理',
    icon: '👥',
    children: [
      { id: 'user:view', label: '学员列表与详情查看', code: 'user:view', desc: '查看用户基本信息' },
      { id: 'user:status', label: '账号封禁 / 解封', code: 'user:status', desc: '管理用户账号正常或禁用' },
      { id: 'user:member', label: '会员等级与VIP开通', code: 'user:member', desc: '充值或赠送VIP会员时长' },
      { id: 'user:records', label: '学员做题记录追踪', code: 'user:records', desc: '查看学员做题历史与答题卡' },
    ],
  },
  {
    id: 'content',
    label: '📢 内容与运营中心',
    icon: '📢',
    children: [
      { id: 'content:announcement', label: '系统通知公告管理', code: 'content:announcement', desc: '发布全站置顶公告' },
      { id: 'content:banner', label: '首页轮播图 Banner', code: 'content:banner', desc: '更换移动端活动海报' },
      { id: 'content:feedback', label: '用户建议与工单处理', code: 'content:feedback', desc: '查看并回复学员反馈' },
    ],
  },
  {
    id: 'stats',
    label: '📊 数据中心与统计',
    icon: '📊',
    children: [
      { id: 'stats:overview', label: '数据大盘总览', code: 'stats:overview', desc: '查看核心指标与今日做题' },
      { id: 'stats:user', label: '用户增长与留存分析', code: 'stats:user', desc: '查看新注册趋势与活跃度' },
      { id: 'stats:quiz', label: '做题质量与错题排行', code: 'stats:quiz', desc: '分析高频难点与易错题目' },
      { id: 'stats:revenue', label: '营收报表与订单统计', code: 'stats:revenue', desc: '查看会员开通流水与收益' },
    ],
  },
  {
    id: 'system',
    label: '⚙️ 系统设置与安全',
    icon: '⚙️',
    children: [
      { id: 'system:admin', label: '管理员账号管理', code: 'system:admin', desc: '增删改查管理员' },
      { id: 'system:role', label: '角色与权限矩阵分配', code: 'system:role', desc: '调整功能节点授权' },
      { id: 'system:config', label: '系统底层基础配置', code: 'system:config', desc: '倒计时、网站名称等' },
      { id: 'system:email', label: '邮件服务 SMTP 设置', code: 'system:email', desc: '发信服务器与注册验证码' },
      { id: 'system:log', label: '操作审计日志查看', code: 'system:log', desc: '敏感操作追踪与回溯' },
    ],
  },
]

// 权限代码对照可读名
const permCodeNameMap: Record<string, { name: string; tagType: string }> = {
  'question:view': { name: '题库查看', tagType: 'primary' },
  'question:edit': { name: '题目编辑', tagType: 'primary' },
  'question:delete': { name: '题目删除', tagType: 'danger' },
  'question:import': { name: '文档导入', tagType: 'primary' },
  'question:feedback': { name: '错题工单', tagType: 'warning' },
  'exam:generate': { name: '组卷生成', tagType: 'primary' },
  'exam:publish': { name: '试卷发布', tagType: 'primary' },
  'ai:generate': { name: 'AI命题', tagType: 'success' },
  'ai:analysis': { name: 'AI解析', tagType: 'success' },
  'ai:prompt': { name: 'Prompt管理', tagType: 'success' },
  'ai:model_config': { name: '模型配置', tagType: 'success' },
  'ai:audit': { name: 'AI审核', tagType: 'success' },
  'user:view': { name: '用户查看', tagType: 'info' },
  'user:status': { name: '用户状态', tagType: 'info' },
  'user:member': { name: '会员开通', tagType: 'warning' },
  'user:records': { name: '做题记录', tagType: 'info' },
  'content:announcement': { name: '公告发布', tagType: '' },
  'content:banner': { name: 'Banner配置', tagType: '' },
  'content:feedback': { name: '工单反馈', tagType: 'warning' },
  'stats:overview': { name: '数据大盘', tagType: 'warning' },
  'stats:user': { name: '用户增长', tagType: 'warning' },
  'stats:quiz': { name: '题库质量', tagType: 'warning' },
  'stats:revenue': { name: '营收统计', tagType: 'warning' },
  'system:admin': { name: '管理员配置', tagType: 'danger' },
  'system:role': { name: '权限分配', tagType: 'danger' },
  'system:config': { name: '系统配置', tagType: 'danger' },
  'system:email': { name: '邮件设置', tagType: 'danger' },
  'system:log': { name: '操作日志', tagType: 'info' },
}

// ==================== 计算属性 ====================
const filteredAdmins = computed(() => {
  return adminList.value.filter((adm) => {
    const matchKw =
      !searchKeyword.value ||
      adm.username.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (adm.realName && adm.realName.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    const matchRole = !filterRole.value || adm.role === filterRole.value
    const matchStatus = !filterStatus.value || adm.status === filterStatus.value || (filterStatus.value === 'active' && adm.status === 1)
    return matchKw && matchRole && matchStatus
  })
})

const activeCount = computed(() => {
  return adminList.value.filter((a) => a.status === 'active' || a.status === 1).length
})

function countByRole(roleCode: string) {
  return adminList.value.filter((a) => a.role === roleCode || (roleCode === 'super_admin' && a.role === 'admin')).length
}

// ==================== 辅助映射函数 ====================
function getRoleName(roleCode: string) {
  const found = roleList.value.find((r) => r.code === roleCode || (roleCode === 'admin' && r.code === 'super_admin'))
  return found ? found.name : roleCode === 'super_admin' || roleCode === 'admin' ? '超级管理员' : roleCode
}

function getRoleDesc(roleCode: string) {
  const found = roleList.value.find((r) => r.code === roleCode || (roleCode === 'admin' && r.code === 'super_admin'))
  return found ? found.description : '负责指定模块的管理工作'
}

function getRoleTagType(roleCode: string) {
  switch (roleCode) {
    case 'super_admin':
    case 'admin':
      return 'danger'
    case 'editor':
    case 'teacher':
      return 'primary'
    case 'operator':
      return 'success'
    case 'finance':
      return 'warning'
    case 'devops':
      return 'info'
    default:
      return ''
  }
}

function getRoleEmoji(roleCode: string) {
  switch (roleCode) {
    case 'super_admin':
    case 'admin':
      return '👑'
    case 'editor':
    case 'teacher':
      return '🎓'
    case 'operator':
      return '🚀'
    case 'finance':
      return '💰'
    case 'devops':
      return '⚙️'
    default:
      return '🛡️'
  }
}

function getReadablePermissions(roleCode: string) {
  const role = roleList.value.find((r) => r.code === roleCode || (roleCode === 'admin' && r.code === 'super_admin'))
  if (!role || !role.permissions) return []
  return role.permissions.slice(0, 4).map((p: string) => {
    return permCodeNameMap[p] || { name: p, tagType: 'info' }
  })
}

function getDetailedPermissionItems(roleCode: string) {
  const role = roleList.value.find((r) => r.code === roleCode || (roleCode === 'admin' && r.code === 'super_admin'))
  if (!role || !role.permissions) return []
  return role.permissions.map((p: string) => {
    return (permCodeNameMap[p]?.name || p) + ` (${p})`
  })
}

function formatTime(val: string | null) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString('zh-CN', { hour12: false })
}

// ==================== 数据获取 ====================
async function fetchData() {
  loading.value = true
  try {
    const [admRes, roleRes] = await Promise.all([
      getAdminList({ page: 1, pageSize: 50 }),
      getRoleList(),
    ])
    if (admRes?.data?.list) {
      adminList.value = admRes.data.list
    }
    if (roleRes?.data && Array.isArray(roleRes.data)) {
      roleList.value = roleRes.data
    }
    if (!selectedRole.value && roleList.value.length > 0) {
      selectRole(roleList.value[0])
    }
  } catch (err: any) {
    ElMessage.error(err.message || '加载管理员与角色数据失败')
  } finally {
    loading.value = false
  }
}

// ==================== 角色选择与树节点同步 ====================
function selectRole(role: any) {
  selectedRole.value = role
  nextTick(() => {
    if (!permTreeRef.value) return
    if (role.code === 'super_admin' || role.permissions?.includes('*')) {
      const allIds = getAllTreeIds(permissionTreeData)
      permTreeRef.value.setCheckedKeys(allIds)
    } else {
      permTreeRef.value.setCheckedKeys(role.permissions || [])
    }
  })
}

function getAllTreeIds(nodes: any[]): string[] {
  let ids: string[] = []
  nodes.forEach((n) => {
    ids.push(n.id)
    if (n.children && n.children.length > 0) {
      ids = ids.concat(getAllTreeIds(n.children))
    }
  })
  return ids
}

function checkAllPerms() {
  if (!permTreeRef.value) return
  const allLeafKeys = getAllLeafKeys(permissionTreeData)
  permTreeRef.value.setCheckedKeys(allLeafKeys)
}

function uncheckAllPerms() {
  if (!permTreeRef.value) return
  permTreeRef.value.setCheckedKeys([])
}

function getAllLeafKeys(nodes: any[]): string[] {
  let keys: string[] = []
  nodes.forEach((n) => {
    if (n.children && n.children.length > 0) {
      keys = keys.concat(getAllLeafKeys(n.children))
    } else if (n.code) {
      keys.push(n.code)
    }
  })
  return keys
}

function expandAllNodes() {
  if (!permTreeRef.value) return
  const allIds = getAllTreeIds(permissionTreeData)
  allIds.forEach((id) => {
    const node = permTreeRef.value.getNode(id)
    if (node) node.expanded = true
  })
}

function collapseAllNodes() {
  if (!permTreeRef.value) return
  const allIds = getAllTreeIds(permissionTreeData)
  allIds.forEach((id) => {
    const node = permTreeRef.value.getNode(id)
    if (node) node.expanded = false
  })
}

async function handleSaveRolePermissions() {
  if (!selectedRole.value) return
  const checkedKeys = permTreeRef.value?.getCheckedKeys(true) || []
  try {
    await updateRole(selectedRole.value.id, {
      ...selectedRole.value,
      permissions: checkedKeys,
    })
    selectedRole.value.permissions = checkedKeys
    ElMessage.success(`角色 [${selectedRole.value.name}] 权限配置已成功保存！`)
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '保存角色权限失败')
  }
}

// ==================== 管理员操作 ====================
function handleAddAdmin() {
  isEditAdmin.value = false
  adminForm.id = 0
  adminForm.username = ''
  adminForm.realName = ''
  adminForm.password = 'admin123'
  adminForm.role = 'editor'
  adminForm.status = 'active'
  adminDialogVisible.value = true
}

function handleEditAdmin(row: any) {
  isEditAdmin.value = true
  adminForm.id = row.id
  adminForm.username = row.username
  adminForm.realName = row.realName || row.nickname || ''
  adminForm.password = ''
  adminForm.role = row.role || 'editor'
  adminForm.status = row.status === 'active' || row.status === 1 ? 'active' : 'disabled'
  adminDialogVisible.value = true
}

async function handleSaveAdmin() {
  if (!adminFormRef.value) return
  await adminFormRef.value.validate()
  submitLoading.value = true
  try {
    if (isEditAdmin.value) {
      await updateAdmin(adminForm.id, {
        realName: adminForm.realName,
        role: adminForm.role,
        status: adminForm.status,
      })
      ElMessage.success('管理员信息更新成功')
    } else {
      await createAdmin({
        username: adminForm.username,
        realName: adminForm.realName,
        password: adminForm.password || 'admin123',
        role: adminForm.role,
        status: adminForm.status,
      } as any)
      ElMessage.success('新增管理员成功')
    }
    adminDialogVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleToggleStatus(row: any, val: boolean) {
  const newStatus = val ? 'active' : 'disabled'
  try {
    await updateAdmin(row.id, { status: newStatus })
    row.status = newStatus
    ElMessage.success(`管理员 [${row.username}] 状态已切换为：${val ? '正常' : '已禁用'}`)
  } catch (err: any) {
    ElMessage.error(err.message || '状态切换失败')
  }
}

function handleOpenPermModal(row: any) {
  currentAdmin.value = row
  targetRoleCode.value = row.role || 'editor'
  permModalVisible.value = true
}

async function handleApplyRoleChange() {
  if (!currentAdmin.value) return
  try {
    await updateAdmin(currentAdmin.value.id, { role: targetRoleCode.value })
    ElMessage.success(`管理员 [${currentAdmin.value.username}] 权限角色已成功更新为：${getRoleName(targetRoleCode.value)}`)
    permModalVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '角色分配失败')
  }
}

function handleResetPassword(row: any) {
  ElMessageBox.prompt(
    `请输入管理员 [${row.username}] 的新密码（至少6位）：`,
    '重置管理员密码',
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      inputPlaceholder: '例如 admin123',
      inputValue: 'admin123',
      inputValidator: (v) => (v && v.length >= 6 ? true : '密码长度至少 6 位'),
    }
  ).then(async ({ value }) => {
    try {
      await resetAdminPassword(row.id, value)
      ElMessage.success(`管理员 [${row.username}] 密码已成功重置为：${value}`)
    } catch (err: any) {
      ElMessage.error(err.message || '密码重置失败')
    }
  })
}

async function handleDeleteAdmin(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定永久删除管理员账号「${row.username}」吗？此操作不可逆！`,
      '删除警告',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
    await deleteAdmin(row.id)
    ElMessage.success('管理员已成功删除')
    fetchData()
  } catch {
    // cancel
  }
}

// ==================== 角色增删 ====================
function handleAddRole() {
  roleForm.name = ''
  roleForm.code = ''
  roleForm.description = ''
  roleDialogVisible.value = true
}

async function handleSaveNewRole() {
  if (!roleForm.name || !roleForm.code) {
    return ElMessage.warning('请填写角色名称和英文标识')
  }
  try {
    await createRole({
      name: roleForm.name,
      code: roleForm.code,
      description: roleForm.description,
      permissions: ['question:view', 'exam:view'],
    })
    ElMessage.success('自定义角色创建成功')
    roleDialogVisible.value = false
    fetchData()
  } catch (err: any) {
    ElMessage.error(err.message || '创建角色失败')
  }
}

async function handleDeleteRole(role: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除角色「${role.name}」吗？`,
      '删除角色确认',
      { type: 'warning' }
    )
    await deleteRole(role.id)
    ElMessage.success('角色已删除')
    fetchData()
  } catch {
    // cancel
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.admin-setting-page {
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

/* 统计卡片栅格 */
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

    &.bg-indigo { background: #eef2ff; }
    &.bg-purple { background: #f5f3ff; }
    &.bg-blue { background: #e0f2fe; }
    &.bg-emerald { background: #ecfdf5; }
    &.bg-green { background: #f0fdf4; }
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

/* 主卡片与 Tabs */
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

  .filter-inputs {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* 表格用户单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-avatar {
    background: #6366f1;
    color: #fff;
    font-weight: 700;
  }

  .user-text {
    .uname {
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .realname {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
  }
}

.role-badge {
  font-weight: 600;
  border-radius: 6px;
}

/* 权限明细展示 */
.super-perm-tag {
  display: inline-block;
}

.perm-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  .perm-chip {
    border-radius: 4px;
    font-size: 11px;
  }

  .perm-more-btn {
    cursor: pointer;
    border-radius: 4px;
    &:hover {
      background: #e2e8f0;
    }
  }
}

.perm-popover-content {
  .pop-role-desc {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #e2e8f0;
  }
  .pop-nodes {
    max-height: 220px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #334155;
  }
}

.time-cell {
  font-size: 12px;
  .time-main {
    color: #334155;
    font-weight: 500;
  }
  .time-sub {
    color: #94a3b8;
    margin-top: 2px;
  }
}

.ops-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 角色与权限矩阵布局 */
.role-matrix-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  min-height: 520px;
}

.role-list-sidebar {
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 16px;

  .sidebar-header {
    margin-bottom: 14px;
    .sidebar-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      display: block;
    }
    .sidebar-tip {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .role-cards-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .role-item-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #6366f1;
      transform: translateY(-1px);
    }

    &.active {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.15);
    }

    .r-top {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .r-icon { font-size: 16px; }
      .r-name {
        font-weight: 700;
        font-size: 14px;
        color: #0f172a;
        flex: 1;
      }
    }

    .r-desc {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 6px;
    }

    .r-code {
      font-size: 11px;
      color: #94a3b8;
      code {
        background: #f1f5f9;
        padding: 1px 4px;
        border-radius: 4px;
        color: #6366f1;
      }
    }
  }
}

.role-perm-detail {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;

  .detail-panel {
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f1f5f9;

      .role-title-box {
        display: flex;
        align-items: center;
        gap: 12px;

        .role-emoji { font-size: 28px; }
        .role-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .role-intro {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }
      }
    }

    .super-alert {
      margin-bottom: 16px;
    }

    .perm-tree-wrapper {
      .tree-tools {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .tree-heading {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
        }
      }

      .custom-perm-tree {
        border: 1px solid #f1f5f9;
        border-radius: 8px;
        padding: 12px 14px;
        max-height: 420px;
        overflow-y: auto;
      }

      .custom-tree-node {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;

        .node-icon { font-size: 14px; }
        .node-label { font-weight: 600; color: #1e293b; }
        .node-code { font-size: 11px; color: #94a3b8; font-family: monospace; }
        .node-desc { font-size: 12px; color: #64748b; margin-left: 8px; }
      }
    }
  }
}

/* 授权弹窗内角色卡片 */
.curr-adm-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 14px;

  .name { font-weight: 700; font-size: 14px; color: #0f172a; }
  .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
}

.role-select-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  .role-select-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { border-color: #6366f1; }
    &.chosen {
      border-color: #6366f1;
      background: #f5f3ff;
    }

    .rs-head {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .rs-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.3;
    }
  }
}

.log-tab-wrapper {
  margin-top: 10px;
}
</style>
