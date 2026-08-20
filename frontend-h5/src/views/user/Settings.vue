<template>
  <div class="settings-page">
    <van-nav-bar title="设置" left-arrow @click-left="$router.back()" />

    <van-cell-group inset class="group">
      <van-cell title="账号与安全" icon="shield-o" is-link />
      <van-cell title="修改密码" icon="lock" is-link @click="$router.push('/auth/forgot')" />
    </van-cell-group>

    <van-cell-group inset class="group">
      <van-cell title="消息通知" icon="bell" is-link>
        <template #right-icon>
          <van-switch v-model="settings.notify" size="22px" />
        </template>
      </van-cell>
      <van-cell title="每日打卡提醒" icon="clock-o">
        <template #right-icon>
          <van-switch v-model="settings.dailyRemind" size="22px" />
        </template>
      </van-cell>
      <van-cell title="复习提醒" icon="underway-o">
        <template #right-icon>
          <van-switch v-model="settings.reviewRemind" size="22px" />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="group">
      <van-cell title="夜间模式" icon="browsing-history-o">
        <template #right-icon>
          <van-switch v-model="settings.darkMode" size="22px" />
        </template>
      </van-cell>
      <van-cell title="字体大小" icon="font" is-link :value="fontSizeText" @click="showFontSheet = true" />
      <van-cell title="缓存清理" icon="delete-o" is-link :value="cacheSize" @click="onClearCache" />
    </van-cell-group>

    <van-cell-group inset class="group">
      <van-cell title="关于软考刷题" icon="info-o" is-link value="v1.0.0" />
      <van-cell title="用户协议" icon="description" is-link />
      <van-cell title="隐私政策" icon="warning-o" is-link />
    </van-cell-group>

    <div class="logout">
      <van-button block plain type="danger" @click="onLogout">退出登录</van-button>
    </div>

    <van-action-sheet
      v-model:show="showFontSheet"
      :actions="fontActions"
      @select="onFontSelect"
      close-on-click-action
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { storage } from '@/utils/storage'

const router = useRouter()
const userStore = useUserStore()

const settings = reactive({
  notify: true,
  dailyRemind: true,
  reviewRemind: true,
  darkMode: false,
  fontSize: 'medium'
})

const showFontSheet = ref(false)
const cacheSize = ref('12.3 MB')

const fontSizeText = computed(() => {
  const map: Record<string, string> = { small: '小', medium: '标准', large: '大' }
  return map[settings.fontSize] || '标准'
})

const fontActions = [
  { name: '小', value: 'small' },
  { name: '标准', value: 'medium' },
  { name: '大', value: 'large' }
]

function onFontSelect(action: any) {
  settings.fontSize = action.value
  showToast({ type: 'success', message: '已设置' })
}

function onClearCache() {
  showConfirmDialog({ title: '清理缓存', message: '确定清理缓存吗？' })
    .then(() => {
      storage.clear()
      storage.set('token', userStore.token)
      cacheSize.value = '0 MB'
      showToast({ type: 'success', message: '已清理' })
    })
    .catch(() => {})
}

async function onLogout() {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定退出吗？' })
    userStore.logout()
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

.group {
  margin-bottom: var(--space-lg) !important;

  :deep(.van-cell) {
    padding: 14px var(--van-cell-horizontal-padding);
    font-size: var(--font-size-base);

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
    height: 44px;
  }
}
</style>
