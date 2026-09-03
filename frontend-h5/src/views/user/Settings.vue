<template>
  <div class="settings-page">
    <van-nav-bar
      title="系统设置"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 账号与安全 -->
    <div class="section-title">
      账号安全
    </div>
    <van-cell-group
      inset
      class="group"
    >
      <van-cell
        title="账号与安全"
        icon="shield-o"
        is-link
        :value="userStore.userInfo?.username || '安全中心'"
        @click="showAccountPopup = true"
      />
      <van-cell
        title="修改密码"
        icon="lock"
        is-link
        value="修改登录密码"
        @click="openChangePasswordModal"
      />
    </van-cell-group>

    <!-- 学习与通知提醒 -->
    <div class="section-title">
      通知提醒
    </div>
    <van-cell-group
      inset
      class="group"
    >
      <van-cell
        title="消息通知"
        icon="bell"
      >
        <template #right-icon>
          <van-switch
            v-model="settings.notify"
            size="22px"
            @change="onToggleSetting('notify', '消息通知')"
          />
        </template>
      </van-cell>
      <van-cell
        title="每日打卡提醒"
        icon="clock-o"
      >
        <template #right-icon>
          <van-switch
            v-model="settings.dailyRemind"
            size="22px"
            @change="onToggleSetting('dailyRemind', '每日打卡提醒')"
          />
        </template>
      </van-cell>
      <van-cell
        title="复习提醒"
        icon="underway-o"
      >
        <template #right-icon>
          <van-switch
            v-model="settings.reviewRemind"
            size="22px"
            @change="onToggleSetting('reviewRemind', '艾宾浩斯复习提醒')"
          />
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 显示与通用 -->
    <div class="section-title">
      通用与显示
    </div>
    <van-cell-group
      inset
      class="group"
    >
      <van-cell
        title="夜间模式"
        icon="browsing-history-o"
      >
        <template #right-icon>
          <van-switch
            v-model="settings.darkMode"
            size="22px"
            @change="onToggleDarkMode"
          />
        </template>
      </van-cell>
      <van-cell
        title="字体大小"
        icon="font"
        is-link
        :value="fontSizeText"
        @click="showFontSheet = true"
      />
      <van-cell
        title="缓存清理"
        icon="delete-o"
        is-link
        :value="cacheSize"
        @click="onClearCache"
      />
    </van-cell-group>

    <!-- 关于与协议 -->
    <div class="section-title">
      关于与支持
    </div>
    <van-cell-group
      inset
      class="group"
    >
      <van-cell
        title="关于软考刷题"
        icon="info-o"
        is-link
        value="v1.2.0"
        @click="showAboutPopup = true"
      />
      <van-cell
        title="用户协议"
        icon="description"
        is-link
        @click="showAgreementPopup = true"
      />
      <van-cell
        title="隐私政策"
        icon="warning-o"
        is-link
        @click="showPrivacyPopup = true"
      />
    </van-cell-group>

    <!-- 退出登录 -->
    <div class="logout">
      <van-button
        block
        plain
        type="danger"
        @click="onLogout"
      >
        退出登录
      </van-button>
    </div>

    <!-- 1. 字体大小选择 ActionSheet -->
    <van-action-sheet
      v-model:show="showFontSheet"
      :actions="fontActions"
      cancel-text="取消"
      close-on-click-action
      @select="onFontSelect"
    />

    <!-- 2. 修改密码弹窗 (Popup) -->
    <van-popup
      v-model:show="showChangePwdPopup"
      position="bottom"
      round
      closeable
      class="custom-popup pwd-popup"
      :style="{ maxHeight: '85%' }"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">
            修改登录密码
          </div>
          <div class="popup-subtitle">
            请输入当前原密码与新密码
          </div>
        </div>

        <div class="pwd-form">
          <div class="field-item">
            <div class="field-label">
              原密码
            </div>
            <van-field
              v-model="pwdForm.oldPassword"
              :type="showOldPwd ? 'text' : 'password'"
              placeholder="请输入当前原密码"
              :right-icon="showOldPwd ? 'eye-o' : 'closed-eye'"
              clearable
              @click-right-icon="showOldPwd = !showOldPwd"
            />
          </div>

          <div class="field-item">
            <div class="field-label">
              新密码
            </div>
            <van-field
              v-model="pwdForm.newPassword"
              :type="showNewPwd ? 'text' : 'password'"
              placeholder="请输入新密码（6-20位字符）"
              :right-icon="showNewPwd ? 'eye-o' : 'closed-eye'"
              clearable
              @click-right-icon="showNewPwd = !showNewPwd"
            />
          </div>

          <div class="field-item">
            <div class="field-label">
              确认新密码
            </div>
            <van-field
              v-model="pwdForm.confirmPassword"
              :type="showConfirmPwd ? 'text' : 'password'"
              placeholder="请再次输入新密码"
              :right-icon="showConfirmPwd ? 'eye-o' : 'closed-eye'"
              clearable
              @click-right-icon="showConfirmPwd = !showConfirmPwd"
            />
          </div>

          <div class="pwd-extra-actions">
            <span
              class="forgot-link"
              @click="onGoToForgot"
            >
              忘记原密码？前往通过验证码重置 &gt;
            </span>
          </div>

          <div class="pwd-submit-wrap">
            <van-button
              type="primary"
              block
              round
              :loading="submittingPwd"
              loading-text="正在保存修改..."
              class="submit-btn"
              @click="onSubmitChangePassword"
            >
              确认修改密码
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 3. 账号与安全中心弹窗 -->
    <van-popup
      v-model:show="showAccountPopup"
      position="bottom"
      round
      closeable
      class="custom-popup"
      :style="{ maxHeight: '80%' }"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">
            🛡️ 账号与安全中心
          </div>
          <div class="popup-subtitle">
            查看与管理您的个人账号安全信息
          </div>
        </div>

        <div class="account-card">
          <div class="acc-row">
            <span class="label">用户名</span>
            <span class="value">{{ userStore.userInfo?.username || '-' }}</span>
          </div>
          <div class="acc-row">
            <span class="label">用户昵称</span>
            <span
              class="value clickable"
              @click="openEditNickname"
            >
              {{ userStore.userInfo?.nickname || '未设置' }}
              <van-icon
                name="edit"
                class="edit-icon"
              />
            </span>
          </div>
          <div class="acc-row">
            <span class="label">用户 ID</span>
            <span class="value">{{ userStore.userInfo?.id || 'UID-10086' }}</span>
          </div>
          <div class="acc-row">
            <span class="label">绑定手机</span>
            <span class="value">{{ maskedPhone }}</span>
          </div>
          <div class="acc-row">
            <span class="label">绑定邮箱</span>
            <span class="value">{{ maskedEmail }}</span>
          </div>
          <div class="acc-row">
            <span class="label">会员身份</span>
            <span
              class="value badge-vip"
              :class="{ 'is-vip': userStore.isVip }"
            >
              {{ userStore.isVip ? '👑 VIP 会员' : '免费用户' }}
            </span>
          </div>
          <div class="acc-row">
            <span class="label">安全等级</span>
            <span class="value badge-safe">良好（已设独立密码）</span>
          </div>
        </div>

        <div class="account-actions">
          <van-button
            block
            round
            plain
            type="primary"
            @click="onAccountChangePwd"
          >
            修改登录密码
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 4. 修改昵称 Dialog -->
    <van-dialog
      v-model:show="showNicknameDialog"
      title="修改用户昵称"
      show-cancel-button
      :before-close="onSaveNickname"
    >
      <div style="padding: 16px 20px 8px">
        <van-field
          v-model="editNicknameValue"
          placeholder="请输入新的昵称（2-15个字）"
          maxlength="15"
          clearable
          style="background: var(--bg-page); border-radius: 8px;"
        />
      </div>
    </van-dialog>

    <!-- 5. 关于软考刷题弹窗 -->
    <van-popup
      v-model:show="showAboutPopup"
      position="bottom"
      round
      closeable
      class="custom-popup"
      :style="{ maxHeight: '80%' }"
    >
      <div class="popup-container text-center">
        <div class="about-logo">
          🎓
        </div>
        <h3 class="about-name">
          软考刷题通
        </h3>
        <p class="about-version">
          Version 1.2.0 (Build 20260903)
        </p>
        <p class="about-desc">
          专为全国计算机技术与软件专业技术资格（水平）考试打造的高效刷题、考点突破与智能复习平台。
        </p>

        <div class="feature-grid">
          <div class="f-item">
            <span class="fi-icon">📚</span>
            <span class="fi-title">历年真题精练</span>
          </div>
          <div class="f-item">
            <span class="fi-icon">🤖</span>
            <span class="fi-title">AI智能考点解析</span>
          </div>
          <div class="f-item">
            <span class="fi-icon">🧠</span>
            <span class="fi-title">艾宾浩斯抗遗忘</span>
          </div>
          <div class="f-item">
            <span class="fi-icon">📊</span>
            <span class="fi-title">学情多维诊断</span>
          </div>
        </div>

        <div class="about-footer">
          <p>官方技术支持：ruankao_helper</p>
          <p>版权所有 © 2026 软考刷题团队 保留所有权利</p>
          <van-button
            size="small"
            round
            plain
            type="primary"
            style="margin-top: 10px;"
            @click="onCheckUpdate"
          >
            检查版本更新
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 6. 用户协议弹窗 -->
    <van-popup
      v-model:show="showAgreementPopup"
      position="bottom"
      round
      closeable
      class="custom-popup scrollable-popup"
      :style="{ height: '80%' }"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">
            📜 用户服务协议
          </div>
          <div class="popup-subtitle">
            更新日期：2026年9月
          </div>
        </div>
        <div class="legal-content">
          <h4>1. 协议的确认与接纳</h4>
          <p>欢迎使用“软考刷题”平台。在使用本平台各项服务前，请仔细阅读本协议。您访问或使用本平台即视为已充分理解并同意接受本协议的所有条款约束。</p>

          <h4>2. 账号注册与安全规范</h4>
          <p>用户注册时应提供真实、有效的信息，并妥善保管账号及密码。因用户自身原因（包括但不限于密码泄露、转借他人等）导致的任何损失由用户自行承担。</p>

          <h4>3. 知识产权与题库版权声明</h4>
          <p>本平台包含的所有软件代码、题库精编解析、知识图谱、AI智能推导内容及图形界面均受著作权及相关知识产权法保护。未经许可，任何个人或组织不得擅自抓取、倒卖或用于商业目的。</p>

          <h4>4. 用户行为规范</h4>
          <p>用户在使用本系统过程中不得从事破坏系统安全、利用漏洞刷取数据或发布任何违法违规言论的行为。平台有权对违规账号采取封禁或追究法律责任的措施。</p>

          <h4>5. 服务的变更、中断与终止</h4>
          <p>平台致力于提供连续稳定的备考服务，但保留因系统维护、升级等需要合理暂停或变更部分服务的权利。</p>
        </div>
      </div>
    </van-popup>

    <!-- 7. 隐私政策弹窗 -->
    <van-popup
      v-model:show="showPrivacyPopup"
      position="bottom"
      round
      closeable
      class="custom-popup scrollable-popup"
      :style="{ height: '80%' }"
    >
      <div class="popup-container">
        <div class="popup-header">
          <div class="popup-title">
            🔒 隐私政策
          </div>
          <div class="popup-subtitle">
            更新日期：2026年9月
          </div>
        </div>
        <div class="legal-content">
          <h4>1. 我们收集的信息</h4>
          <p>为了向您提供高品质的刷题与学习服务，我们可能收集以下信息：</p>
          <ul>
            <li>账号信息：注册所填写的手机号、邮箱、用户名与头像；</li>
            <li>学习数据：您的刷题记录、错题本、收藏题目、做题用时与得分统计；</li>
            <li>设备与日志信息：为了保障服务运行安全，我们会收集必要的设备日志信息。</li>
          </ul>

          <h4>2. 我们如何使用这些信息</h4>
          <p>收集的数据主要用于生成个性化的复习计划、AI针对性答疑推荐、以及为您展现全景备考学情分析，绝不会向任何未经授权的第三方出售或泄露。</p>

          <h4>3. 数据存储与安全保障</h4>
          <p>我们采用业界高标准的加密传输（HTTPS/TLS）与多重数据备份机制，确保您的个人数据与做题资产获得严格的安全保护。</p>

          <h4>4. 您的权利</h4>
          <p>您有权随时查阅、更正您的个人资料，以及清理本地缓存或注销账户。</p>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast, showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { storage } from '@/utils/storage'
import { changePassword } from '@/api/auth'
import { updateProfile } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

// 存储 key
const SETTINGS_STORAGE_KEY = 'app_settings'
const THEME_STORAGE_KEY = 'app_theme'
const FONT_STORAGE_KEY = 'app_font_size'

// 设置项状态
const settings = reactive({
  notify: true,
  dailyRemind: true,
  reviewRemind: true,
  darkMode: false,
  fontSize: 'medium'
})

// 弹窗状态
const showFontSheet = ref(false)
const showChangePwdPopup = ref(false)
const showAccountPopup = ref(false)
const showNicknameDialog = ref(false)
const showAboutPopup = ref(false)
const showAgreementPopup = ref(false)
const showPrivacyPopup = ref(false)

// 缓存大小
const cacheSize = ref('12.8 MB')

// 修改密码表单
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showOldPwd = ref(false)
const showNewPwd = ref(false)
const showConfirmPwd = ref(false)
const submittingPwd = ref(false)

// 昵称修改
const editNicknameValue = ref('')

// 字体文字映射
const fontSizeText = computed(() => {
  const map: Record<string, string> = { small: '小', medium: '标准', large: '大' }
  return map[settings.fontSize] || '标准'
})

const fontActions = [
  { name: '小 (紧凑)', value: 'small' },
  { name: '标准 (默认)', value: 'medium' },
  { name: '大 (清晰大字)', value: 'large' }
]

// 脱敏手机与邮箱
const maskedPhone = computed(() => {
  const phone = userStore.userInfo?.phone
  if (!phone) return '未绑定'
  if (phone.length >= 11) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  return phone
})

const maskedEmail = computed(() => {
  const email = userStore.userInfo?.email
  if (!email) return '未绑定'
  const parts = email.split('@')
  if (parts.length === 2) {
    const name = parts[0]
    const masked = name.length > 2 ? `${name.slice(0, 2)}****` : `${name}****`
    return `${masked}@${parts[1]}`
  }
  return email
})

// 初始化设置
onMounted(() => {
  // 加载持久化设置
  const savedSettings = storage.get<any>(SETTINGS_STORAGE_KEY)
  if (savedSettings) {
    Object.assign(settings, savedSettings)
  }

  // 加载主题
  const savedTheme = storage.get<string>(THEME_STORAGE_KEY)
  if (savedTheme === 'dark') {
    settings.darkMode = true
    applyDarkMode(true)
  } else {
    settings.darkMode = false
    applyDarkMode(false)
  }

  // 加载字体
  const savedFont = storage.get<string>(FONT_STORAGE_KEY)
  if (savedFont) {
    settings.fontSize = savedFont
    applyFontSize(savedFont)
  }

  // 计算估算缓存大小
  calcCacheSize()
})

function calcCacheSize() {
  try {
    let bytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        bytes += (localStorage.getItem(key) || '').length * 2
      }
    }
    const mb = (bytes / (1024 * 1024) + 8.4).toFixed(1)
    cacheSize.value = `${mb} MB`
  } catch {
    cacheSize.value = '8.5 MB'
  }
}

// 切换提醒开关
function onToggleSetting(key: 'notify' | 'dailyRemind' | 'reviewRemind', name: string) {
  storage.set(SETTINGS_STORAGE_KEY, settings)
  showToast({
    type: 'success',
    message: `${settings[key] ? '已开启' : '已关闭'}${name}`
  })
}

// 切换夜间模式
function onToggleDarkMode(val: boolean) {
  applyDarkMode(val)
  storage.set(THEME_STORAGE_KEY, val ? 'dark' : 'light')
  storage.set(SETTINGS_STORAGE_KEY, settings)
  showToast({
    type: 'success',
    message: val ? '已开启夜间模式' : '已恢复明亮模式'
  })
}

function applyDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  }
}

// 选择字体大小
function onFontSelect(action: any) {
  settings.fontSize = action.value
  applyFontSize(action.value)
  storage.set(FONT_STORAGE_KEY, action.value)
  storage.set(SETTINGS_STORAGE_KEY, settings)
  showToast({ type: 'success', message: `字号已切换为：${action.name}` })
}

function applyFontSize(size: string) {
  const sizeMap: Record<string, string> = {
    small: '14px',
    medium: '15px',
    large: '17px'
  }
  const fs = sizeMap[size] || '15px'
  document.documentElement.style.setProperty('--font-size-base', fs)
}

// 打开修改密码弹窗
function openChangePasswordModal() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  showChangePwdPopup.value = true
}

function onAccountChangePwd() {
  showAccountPopup.value = false
  openChangePasswordModal()
}

// 跳转找回密码
function onGoToForgot() {
  showChangePwdPopup.value = false
  router.push('/auth/forgot')
}

// 提交修改密码
async function onSubmitChangePassword() {
  const oldPwd = pwdForm.oldPassword.trim()
  const newPwd = pwdForm.newPassword.trim()
  const confirmPwd = pwdForm.confirmPassword.trim()

  if (!oldPwd) {
    return showFailToast('请输入当前原密码')
  }
  if (!newPwd) {
    return showFailToast('请输入新密码')
  }
  if (newPwd.length < 6 || newPwd.length > 20) {
    return showFailToast('新密码长度需在 6 到 20 位之间')
  }
  if (newPwd === oldPwd) {
    return showFailToast('新密码不能与原密码相同')
  }
  if (newPwd !== confirmPwd) {
    return showFailToast('两次输入的新密码不一致')
  }

  submittingPwd.value = true
  try {
    await changePassword({
      oldPassword: oldPwd,
      newPassword: newPwd
    })
    showSuccessToast('密码修改成功，请重新登录')
    showChangePwdPopup.value = false

    // 清理 Token 并跳转登录
    setTimeout(() => {
      userStore.logout()
      router.replace('/auth/login')
    }, 1200)
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || '修改密码失败，请重试'
    showFailToast(msg)
  } finally {
    submittingPwd.value = false
  }
}

// 修改昵称
function openEditNickname() {
  editNicknameValue.value = userStore.userInfo?.nickname || userStore.userInfo?.username || ''
  showNicknameDialog.value = true
}

async function onSaveNickname(action: string) {
  if (action === 'confirm') {
    const name = editNicknameValue.value.trim()
    if (!name || name.length < 2) {
      showFailToast('昵称长度需在 2 到 15 个字之间')
      return false
    }
    try {
      await updateProfile({ username: name })
      if (userStore.userInfo) {
        userStore.userInfo.nickname = name
        storage.set('userInfo', userStore.userInfo)
      }
      showSuccessToast('昵称修改成功')
      return true
    } catch (err: any) {
      showFailToast(err.message || '更新昵称失败')
      return false
    }
  }
  return true
}

// 清理缓存
function onClearCache() {
  showConfirmDialog({
    title: '清理本地缓存',
    message: '确定清理题库本地临时缓存吗？\n清理后将释放存储空间，不会影响您的登录与做题记录。'
  })
    .then(() => {
      // 保留重要项，清理临时缓存
      const token = storage.get('token')
      const userInfo = storage.get('userInfo')
      const settingsVal = storage.get(SETTINGS_STORAGE_KEY)
      const themeVal = storage.get(THEME_STORAGE_KEY)
      const fontVal = storage.get(FONT_STORAGE_KEY)

      storage.clear()

      if (token) storage.set('token', token)
      if (userInfo) storage.set('userInfo', userInfo)
      if (settingsVal) storage.set(SETTINGS_STORAGE_KEY, settingsVal)
      if (themeVal) storage.set(THEME_STORAGE_KEY, themeVal)
      if (fontVal) storage.set(FONT_STORAGE_KEY, fontVal)

      cacheSize.value = '0 MB'
      showSuccessToast('缓存已深度清理')
    })
    .catch(() => {})
}

// 检查更新
function onCheckUpdate() {
  showToast({
    type: 'success',
    message: '当前已是最新版本 (v1.2.0)'
  })
}

// 退出登录
async function onLogout() {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出当前登录账号吗？'
    })
    userStore.logout()
    showSuccessToast('已安全退出')
    router.replace('/auth/login')
  } catch {
    // 取消
  }
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.section-title {
  padding: 14px 20px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.group {
  margin-bottom: var(--space-md) !important;

  :deep(.van-cell) {
    padding: 14px var(--van-cell-horizontal-padding);
    font-size: var(--font-size-base);
    background: var(--bg-card);
    color: var(--text-primary);

    .van-cell__title {
      font-weight: 500;
    }

    .van-cell__value {
      color: var(--text-secondary);
    }

    .van-icon {
      font-size: 18px;
      color: var(--color-primary);
    }
  }
}

.logout {
  padding: var(--space-xl) var(--space-lg);

  :deep(.van-button) {
    border-radius: var(--radius-full);
    height: 46px;
    font-weight: 600;
    font-size: 15px;
  }
}

/* 统一弹窗样式 */
.custom-popup {
  background: var(--bg-card);
  color: var(--text-primary);

  .popup-container {
    padding: 24px 20px 32px;
  }

  .popup-header {
    margin-bottom: 20px;
    padding-right: 28px;

    .popup-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .popup-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
}

.pwd-popup {
  .field-item {
    margin-bottom: 16px;

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
      padding-left: 2px;
    }

    :deep(.van-field) {
      background: var(--bg-page);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      border: 1px solid var(--border-light);

      .van-field__control {
        color: var(--text-primary);
        font-size: 15px;
      }

      .van-icon {
        color: var(--text-secondary);
        font-size: 18px;
      }
    }
  }

  .pwd-extra-actions {
    display: flex;
    justify-content: flex-end;
    margin: 8px 0 20px;

    .forgot-link {
      font-size: 13px;
      color: var(--color-primary);
      cursor: pointer;
    }
  }

  .pwd-submit-wrap {
    margin-top: 24px;

    .submit-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      background: var(--gradient-primary);
      border: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
  }
}

/* 账号与安全中心 */
.account-card {
  background: var(--bg-page);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;

  .acc-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;

    .label {
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);

      &.clickable {
        color: var(--color-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;

        .edit-icon {
          font-size: 14px;
        }
      }

      &.badge-vip {
        background: #f1f5f9;
        color: #64748b;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;

        &.is-vip {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
        }
      }

      &.badge-safe {
        color: #10b981;
        font-size: 12px;
      }
    }
  }
}

.account-actions {
  margin-top: 16px;
}

/* 关于软考刷题 */
.about-logo {
  font-size: 48px;
  margin: 8px 0 10px;
}

.about-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.about-version {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.about-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 320px;
  margin: 0 auto 20px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;

  .f-item {
    background: var(--bg-page);
    border-radius: var(--radius-sm);
    padding: 12px 10px;
    display: flex;
    align-items: center;
    gap: 8px;

    .fi-icon {
      font-size: 20px;
    }

    .fi-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.about-footer {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.text-center {
  text-align: center;
}

/* 法律文本抽屉 */
.scrollable-popup {
  display: flex;
  flex-direction: column;

  .popup-container {
    height: 100%;
    overflow-y: auto;
    padding-bottom: 40px;
  }

  .legal-content {
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.8;

    h4 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 16px 0 6px;
    }

    p {
      margin-bottom: 10px;
    }

    ul {
      padding-left: 18px;
      list-style-type: disc;
      margin-bottom: 12px;

      li {
        margin-bottom: 4px;
      }
    }
  }
}
</style>
