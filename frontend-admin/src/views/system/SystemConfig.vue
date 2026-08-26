<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import SearchForm, { type SearchItem } from '@/components/SearchForm.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProDialog from '@/components/ProDialog.vue'
import {
  getConfigList,
  updateConfig,
  type SystemConfig,
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
  type EmailConfig,
} from '@/api/system'

const route = useRoute()
const activeTab = ref(route.path.includes('email') ? 'email' : ((route.query.tab as string) || 'email'))

// ==================== 1. 📧 邮件服务配置 ====================
const emailLoading = ref(false)
const emailSaving = ref(false)
const testLoading = ref(false)
const testEmail = ref('')

const emailForm = reactive<EmailConfig>({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  fromName: '软考刷题通',
  subject: '【软考刷题通】验证码通知',
  expireMinutes: 5,
  isPassSet: false,
})

// 常见 SMTP 服务商快速预设
const presets = [
  { name: 'QQ 个人邮箱', host: 'smtp.qq.com', port: 465, secure: true, tip: '需在 QQ 邮箱设置->账户开启 POP3/SMTP 并生成 16 位授权码' },
  { name: '腾讯企业邮', host: 'smtp.exmail.qq.com', port: 465, secure: true, tip: '使用企业邮箱账号及专属客户端密码' },
  { name: '163 网易邮箱', host: 'smtp.163.com', port: 465, secure: true, tip: '需在 163 邮箱设置中开启 SMTP 并获取授权密码' },
  { name: '阿里云企业邮', host: 'smtp.mxhichina.com', port: 465, secure: true, tip: '使用阿里云域名企业邮箱账号及密码' },
  { name: 'Gmail 邮箱', host: 'smtp.gmail.com', port: 465, secure: true, tip: '需开启 Google 两步验证并创建应用专用密码' },
  { name: '微软 Outlook', host: 'smtp.office365.com', port: 587, secure: false, tip: '支持 STARTTLS 587 端口' },
]

function applyPreset(p: typeof presets[0]) {
  emailForm.host = p.host
  emailForm.port = p.port
  emailForm.secure = p.secure
  ElMessage.info(`已应用【${p.name}】服务器与端口预设：${p.tip}`)
}

async function fetchEmailConfig() {
  emailLoading.value = true
  try {
    const res = await getEmailConfig()
    if (res?.data) {
      emailForm.host = res.data.host || 'smtp.qq.com'
      emailForm.port = res.data.port || 465
      emailForm.secure = res.data.secure !== undefined ? res.data.secure : true
      emailForm.user = res.data.user || ''
      emailForm.fromName = res.data.fromName || '软考刷题通'
      emailForm.subject = res.data.subject || '【软考刷题通】注册验证码通知'
      emailForm.expireMinutes = res.data.expireMinutes || 5
      emailForm.isPassSet = !!res.data.isPassSet
      emailForm.pass = ''
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取邮件配置失败')
  } finally {
    emailLoading.value = false
  }
}

async function handleSaveEmail() {
  if (!emailForm.host || !emailForm.user) {
    return ElMessage.warning('请填写完整的 SMTP 主机地址与发信账号')
  }
  if (!emailForm.isPassSet && !emailForm.pass) {
    return ElMessage.warning('请填写发信密码或授权码')
  }

  emailSaving.value = true
  try {
    await updateEmailConfig(emailForm)
    ElMessage.success('🎉 邮件服务设置已成功保存！前台注册与找回密码已即时生效')
    fetchEmailConfig()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    emailSaving.value = false
  }
}

async function handleTestEmail() {
  if (!testEmail.value || !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(testEmail.value)) {
    return ElMessage.warning('请输入有效的接收测试邮件地址')
  }
  if (!emailForm.host || !emailForm.user) {
    return ElMessage.warning('请先填写 SMTP 主机与发信账号')
  }

  testLoading.value = true
  try {
    const res = await testEmailConfig({
      to: testEmail.value,
      host: emailForm.host,
      port: emailForm.port,
      secure: emailForm.secure,
      user: emailForm.user,
      pass: emailForm.pass || undefined,
      fromName: emailForm.fromName,
    })
    ElNotification({
      title: '发信测试成功',
      message: res.data?.message || '测试邮件已发送，请查收收件箱（或垃圾箱）',
      type: 'success',
      duration: 6000,
    })
  } catch (err: any) {
    ElNotification({
      title: '发信测试失败',
      message: err.message || '请检查 SMTP 服务器、端口、发信账号及授权码是否正确',
      type: 'error',
      duration: 8000,
    })
  } finally {
    testLoading.value = false
  }
}

// ==================== 2. ⏳ 考试倒计时配置 ====================
const countdownForm = reactive({
  date: '2026-11-08 09:00:00',
  title: '2026年软考统一认证',
})
const countdownSaving = ref(false)

const previewDays = computed(() => {
  try {
    const target = new Date(countdownForm.date.replace(/-/g, '/'))
    if (isNaN(target.getTime())) return 0
    const now = new Date()
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  } catch {
    return 0
  }
})

async function handleSaveCountdown() {
  if (!countdownForm.date) {
    return ElMessage.warning('请选择考试目标时间')
  }
  countdownSaving.value = true
  try {
    const dateCfg = list.value.find((c) => c.key === 'exam_countdown_date')
    const titleCfg = list.value.find((c) => c.key === 'exam_countdown_title')

    await Promise.all([
      updateConfig(dateCfg?.id || (0 as any), {
        key: 'exam_countdown_date',
        value: countdownForm.date,
        description: '全局考试倒计时目标时间',
      }),
      updateConfig(titleCfg?.id || (0 as any), {
        key: 'exam_countdown_title',
        value: countdownForm.title,
        description: '全局考试倒计时副标题',
      }),
    ])
    ElMessage.success('考试倒计时全局设置已成功保存！')
    fetchList()
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  } finally {
    countdownSaving.value = false
  }
}

// ==================== 3. ⚙️ 全量系统参数列表 ====================
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
  { prop: 'key', label: '配置键', width: 220 },
  { prop: 'value', label: '配置值', minWidth: 220, slot: 'value' },
  { prop: 'description', label: '说明', minWidth: 200 },
  { prop: 'updatedAt', label: '更新时间', width: 170 },
]

async function fetchList() {
  loading.value = true
  try {
    const res = await getConfigList(query)
    const rawList = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    list.value = rawList
    total.value = Array.isArray(res.data) ? rawList.length : (res.data?.total || rawList.length)
    
    // 自动回填考试倒计时
    const dateCfg = rawList.find((c: any) => c.key === 'exam_countdown_date')
    if (dateCfg) countdownForm.date = dateCfg.value
    const titleCfg = rawList.find((c: any) => c.key === 'exam_countdown_title')
    if (titleCfg) countdownForm.title = titleCfg.value

    // 提取分组
    const set = new Set(rawList.map((c: any) => c.group || '通用配置'))
    groups.value = Array.from(set)
    const groupItem = searchItems.find((i) => i.prop === 'group')
    if (groupItem) {
      groupItem.options = groups.value.map((g) => ({ label: g, value: g }))
    }
  } catch {
    list.value = []
    total.value = 0
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
    await updateConfig(form.value.id || (form.value.key as any), form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchEmailConfig()
  fetchList()
})
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="system-tabs" type="border-card">
      <!-- ================= 标签页 1：📧 邮件发送与验证码设置 ================= -->
      <el-tab-pane label="📧 验证邮件与发信设置" name="email">
        <div class="email-settings-layout" v-loading="emailLoading">
          <div class="email-form-section">
            <div class="section-intro">
              <div class="si-title">SMTP 发信服务器配置</div>
              <div class="si-desc">用于前台学员注册邮箱验证码校验、找回密码邮件通知及系统通知。配置保存后全站即时生效。</div>
            </div>

            <!-- 快捷预设按钮 -->
            <div class="presets-bar">
              <span class="p-label">常用服务商预设：</span>
              <el-button
                v-for="p in presets"
                :key="p.name"
                size="small"
                plain
                @click="applyPreset(p)"
              >
                {{ p.name }}
              </el-button>
            </div>

            <el-form label-position="top" :model="emailForm" class="email-grid-form">
              <div class="form-row">
                <el-form-item label="SMTP 服务器地址" required class="form-col">
                  <el-input
                    v-model="emailForm.host"
                    placeholder="如 smtp.qq.com 或 smtp.exmail.qq.com"
                  >
                    <template #prefix>🌐</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="SMTP 端口" required class="form-col-sm">
                  <el-input-number
                    v-model="emailForm.port"
                    :min="1"
                    :max="65535"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="SSL/TLS 加密" class="form-col-sm">
                  <div style="padding-top: 4px;">
                    <el-switch
                      v-model="emailForm.secure"
                      active-text="启用 SSL (465)"
                      inactive-text="非SSL (587/25)"
                    />
                  </div>
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item label="发信邮箱账号 (User)" required class="form-col">
                  <el-input
                    v-model="emailForm.user"
                    placeholder="如 service@wothat.com 或 xxx@qq.com"
                  >
                    <template #prefix>✉️</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="发信授权码 / 密码" required class="form-col">
                  <el-input
                    v-model="emailForm.pass"
                    type="password"
                    show-password
                    :placeholder="emailForm.isPassSet ? '已设置授权码（留空保持不变）' : '请输入 SMTP 授权码或密码'"
                  >
                    <template #prefix>🔑</template>
                  </el-input>
                </el-form-item>
              </div>

              <div class="form-row">
                <el-form-item label="发件人显示昵称" class="form-col">
                  <el-input
                    v-model="emailForm.fromName"
                    placeholder="如 软考刷题通"
                  />
                </el-form-item>

                <el-form-item label="验证码有效期 (分钟)" class="form-col-sm">
                  <el-input-number
                    v-model="emailForm.expireMinutes"
                    :min="1"
                    :max="60"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="邮件默认主题" class="form-col">
                  <el-input
                    v-model="emailForm.subject"
                    placeholder="如 【软考刷题通】注册验证码通知"
                  />
                </el-form-item>
              </div>

              <div class="form-actions-bar">
                <el-button
                  type="primary"
                  size="large"
                  :loading="emailSaving"
                  @click="handleSaveEmail"
                >
                  💾 保存邮件服务设置
                </el-button>
              </div>
            </el-form>
          </div>

          <!-- 右侧测试卡片 -->
          <div class="email-test-section">
            <div class="test-card">
              <div class="tc-header">
                <span class="tc-icon">🚀</span>
                <div>
                  <div class="tc-title">在线发信测试工具</div>
                  <div class="tc-desc">实时验证 SMTP 服务器连接与发信通道</div>
                </div>
              </div>

              <div class="tc-body">
                <p class="tc-tip">输入您的个人接收邮箱，系统将立即尝试发送一封包含验证码的 HTML 测试邮件：</p>
                <el-input
                  v-model="testEmail"
                  placeholder="请输入接收测试的邮箱地址"
                  clearable
                  style="margin-bottom: 12px"
                >
                  <template #prefix>📬</template>
                </el-input>
                <el-button
                  type="success"
                  style="width: 100%"
                  :loading="testLoading"
                  @click="handleTestEmail"
                >
                  ⚡ 发送测试邮件
                </el-button>
              </div>

              <div class="tc-footer">
                <div class="tf-item">💡 QQ 邮箱发信需在「设置-账户」生成 16 位 POP3/SMTP 授权码填入密码框。</div>
                <div class="tf-item">💡 若未收到测试邮件，请查看垃圾邮件箱或确认端口是否被服务器防火墙拦截。</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ================= 标签页 2：⏳ 考试倒计时设置 ================= -->
      <el-tab-pane label="⏳ 首页考试倒计时" name="countdown">
        <div class="countdown-setting-card">
          <div class="card-header">
            <div class="ch-left">
              <span class="ch-icon">⏳</span>
              <div class="ch-text">
                <h3 class="ch-title">首页考试倒计时全局设置</h3>
                <p class="ch-desc">设置前台 H5 首页展示的全局统一考试日期及倒计时副标题，全站生效并实时自动计算距离考试剩余天数。</p>
              </div>
            </div>
            <div class="preview-box">
              <div class="pb-num">{{ previewDays }}<span>天</span></div>
              <div class="pb-sub">{{ countdownForm.title || '软考统一认证' }}</div>
            </div>
          </div>

          <div class="card-body">
            <el-form :inline="true" :model="countdownForm" class="countdown-inline-form">
              <el-form-item label="考试目标时间" required>
                <el-date-picker
                  v-model="countdownForm.date"
                  type="datetime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择或输入考试时间，如 2026-11-08 09:00:00"
                  style="width: 230px"
                />
              </el-form-item>

              <el-form-item label="倒计时副标题" required>
                <el-input
                  v-model="countdownForm.title"
                  placeholder="如 2026年下半年软考统一认证"
                  style="width: 260px"
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="countdownSaving"
                  @click="handleSaveCountdown"
                >
                  💾 保存倒计时设置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <!-- ================= 标签页 3：⚙️ 全量系统底层参数 ================= -->
      <el-tab-pane label="⚙️ 底层键值参数" name="all">
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
            <el-tag v-if="row.key === 'exam_countdown_date'" type="warning" size="small">
              📅 {{ row.value }}
            </el-tag>
            <el-tag v-else-if="row.key === 'exam_countdown_title'" type="success" size="small">
              🎯 {{ row.value }}
            </el-tag>
            <el-tag v-else-if="row.key === 'smtp_pass'" type="info" size="small">
              ••••••••••••
            </el-tag>
            <el-tag v-else-if="row.key?.startsWith('smtp_')" type="primary" size="small">
              📧 {{ row.value }}
            </el-tag>
            <el-tag v-else size="small">{{ row.value }}</el-tag>
          </template>

          <template #operation="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </ProTable>
      </el-tab-pane>
    </el-tabs>

    <ProDialog v-model="dialogVisible" title="编辑配置" width="520px" :loading="submitLoading" @confirm="handleSubmit">
      <el-form label-width="95px">
        <el-form-item label="配置键">
          <el-input :model-value="form.key" disabled />
        </el-form-item>
        <el-form-item label="配置说明">
          <el-input v-model="form.description" placeholder="配置项描述" />
        </el-form-item>
        <el-form-item label="配置值" required>
          <el-date-picker
            v-if="form.key === 'exam_countdown_date'"
            v-model="form.value"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择考试目标时间"
            style="width: 100%"
          />
          <el-input
            v-else-if="form.key === 'smtp_pass'"
            v-model="form.value"
            type="password"
            show-password
            placeholder="请输入授权码或密码"
          />
          <el-input
            v-else-if="form.type === 'string'"
            v-model="form.value"
            type="textarea"
            :rows="3"
          />
          <el-input-number v-else-if="form.type === 'number'" v-model="form.value" style="width: 100%" />
          <el-switch v-else-if="form.type === 'boolean'" v-model="form.value" active-value="1" inactive-value="0" />
          <el-input v-else v-model="form.value" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
    </ProDialog>
  </div>
</template>

<style scoped lang="scss">
.system-tabs {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  :deep(.el-tabs__content) {
    padding: 20px;
  }
}

.email-settings-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.email-form-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;

  .section-intro {
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #e2e8f0;

    .si-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .si-desc {
      font-size: 13px;
      color: #64748b;
    }
  }

  .presets-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    background: #f8fafc;
    padding: 10px 14px;
    border-radius: 8px;

    .p-label {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
  }

  .email-grid-form {
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .form-col {
        flex: 1;
        min-width: 220px;
      }

      .form-col-sm {
        width: 180px;
      }
    }

    .form-actions-bar {
      margin-top: 10px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
  }
}

.email-test-section {
  .test-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.06);

    .tc-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px dashed #dcfce7;

      .tc-icon {
        font-size: 28px;
      }

      .tc-title {
        font-size: 15px;
        font-weight: 700;
        color: #166534;
      }

      .tc-desc {
        font-size: 12px;
        color: #15803d;
        margin-top: 2px;
      }
    }

    .tc-body {
      margin-bottom: 16px;

      .tc-tip {
        font-size: 13px;
        color: #374151;
        line-height: 1.5;
        margin: 0 0 10px 0;
      }
    }

    .tc-footer {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
      background: #ffffff;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .tf-item {
        margin-bottom: 6px;
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.countdown-setting-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 14px;

    .ch-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .ch-icon {
        font-size: 28px;
      }

      .ch-title {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }

      .ch-desc {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
    }

    .preview-box {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      text-align: center;
      min-width: 140px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);

      .pb-num {
        font-size: 22px;
        font-weight: 800;
        line-height: 1;

        span {
          font-size: 12px;
          margin-left: 2px;
          font-weight: 500;
        }
      }

      .pb-sub {
        font-size: 11px;
        opacity: 0.9;
        margin-top: 4px;
        white-space: nowrap;
      }
    }
  }

  .countdown-inline-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 18px;
    }
  }
}
</style>
