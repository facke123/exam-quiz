<template>
  <div class="mine-page">
    <div class="header">
      <div class="header-bg">
        <div class="circle"></div>
      </div>
      <div class="header-content">
        <div class="user-card">
          <van-image round width="64" height="64" :src="userStore.userInfo?.avatar || ''">
            <template #error>
              <div class="avatar-default"><van-icon name="user-o" /></div>
            </template>
          </van-image>
          <div class="user-info">
            <p class="username">{{ userStore.userInfo?.username || '软考学员' }}</p>
            <p class="user-meta">
              <van-tag v-if="userStore.isVip" type="warning" size="medium">VIP</van-tag>
              <span>{{ subjectStore.currentSubject.name }}</span>
            </p>
          </div>
          <van-icon name="setting-o" class="setting-icon" @click="$router.push('/settings')" />
        </div>

        <div class="quick-stats">
          <div class="qs-item">
            <p class="qs-num">{{ stats.answered }}</p>
            <p class="qs-label">已刷题</p>
          </div>
          <div class="qs-item">
            <p class="qs-num">{{ toPercent(stats.correctRate, 0) }}</p>
            <p class="qs-label">正确率</p>
          </div>
          <div class="qs-item">
            <p class="qs-num">{{ stats.streak }}天</p>
            <p class="qs-label">连续</p>
          </div>
        </div>
      </div>
    </div>

    <!-- VIP 推广 -->
    <div v-if="!userStore.isVip" class="vip-banner" @click="$router.push('/vip')">
      <div class="vip-left">
        <van-icon name="diamond-o" class="vip-icon" />
        <div>
          <p class="vip-title">开通 VIP 会员</p>
          <p class="vip-desc">解锁全部题目 & AI 深度分析</p>
        </div>
      </div>
      <van-button size="small" round class="vip-btn">立即开通</van-button>
    </div>

    <!-- 功能列表 -->
    <van-cell-group inset class="func-group">
      <van-cell
        title="会员中心"
        icon="diamond-o"
        is-link
        @click="$router.push('/vip')"
      />
      <van-cell title="我的笔记" icon="edit-line" is-link @click="$router.push('/notes')" />
      <van-cell title="做题记录" icon="records" is-link @click="$router.push('/records')" />
    </van-cell-group>

    <van-cell-group inset class="func-group">
      <van-cell title="科目选择" icon="bookmark-o" is-link @click="$router.push('/subject')" />
      <van-cell title="设置" icon="setting-o" is-link @click="$router.push('/settings')" />
      <van-cell title="帮助中心" icon="question-o" is-link />
      <van-cell title="关于我们" icon="info-o" is-link />
    </van-cell-group>

    <div class="logout">
      <van-button block plain type="danger" @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { useSubjectStore } from '@/stores/subject'
import { toPercent } from '@/utils/format'

const router = useRouter()
const userStore = useUserStore()
const subjectStore = useSubjectStore()

const stats = reactive({
  answered: 326,
  correctRate: 0.78,
  streak: 12
})

async function onLogout() {
  try {
    await showConfirmDialog({ title: '确认退出', message: '确定要退出登录吗？' })
    userStore.logout()
    router.replace('/auth/login')
  } catch {
    // 取消
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.mine-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
}

.header {
  position: relative;
  background: var(--gradient-primary);
  padding: calc(env(safe-area-inset-top) + var(--space-lg)) var(--space-lg) var(--space-xl);
  overflow: hidden;
}

.header-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    top: -80px;
    right: -60px;
  }
}

.header-content {
  position: relative;
  color: #fff;
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.avatar-default {
  width: 100%;
  height: 100%;
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);

  .van-icon {
    font-size: 32px;
    color: #fff;
  }
}

.user-info {
  flex: 1;
}

.username {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  opacity: 0.85;
  margin-top: 4px;
}

.setting-icon {
  font-size: 22px;
  color: #fff;
}

.quick-stats {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: var(--space-lg) 0;
}

.qs-item {
  flex: 1;
  text-align: center;
}

.qs-num {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.qs-label {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
}

/* VIP banner */
.vip-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, #4c1d95, #7c3aed);
  border-radius: var(--radius-md);
  color: #fff;
}

.vip-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.vip-icon {
  font-size: 28px;
  color: #fbbf24;
}

.vip-title {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.vip-desc {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}

.vip-btn {
  background: #fbbf24 !important;
  color: #4c1d95 !important;
  border: none !important;
  font-weight: 600;
}

/* Function groups */
.func-group {
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
  padding: var(--space-lg);
  margin-top: var(--space-xl);

  :deep(.van-button) {
    border-radius: var(--radius-full);
    height: 44px;
  }
}
</style>
