<template>
  <div class="user-page">
    <!-- 用户中心顶部卡片 -->
    <div class="uc-header">
      <div class="uc-avatar">
        <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="avatar" />
        <span v-else>👤</span>
      </div>
      <div class="uc-info">
        <div class="uc-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '软考学员' }}</div>
        <div class="uc-tag" :class="userStore.isVip ? 'vip' : 'free'">
          {{ userStore.isVip ? '👑 VIP 会员' : '免费用户' }}
        </div>
      </div>
      <div class="setting-btn" @click="$router.push('/settings')">⚙️ 设置</div>
    </div>

    <!-- VIP 横幅 -->
    <div class="vip-banner" @click="$router.push('/vip')">
      <div class="vb-left">
        <div class="vb-title">👑 {{ userStore.isVip ? 'VIP 会员尊享中' : '开通 VIP 会员' }}</div>
        <div class="vb-desc">解锁全部题库 · AI智能解析 · 艾宾浩斯智能复习</div>
      </div>
      <div class="vb-btn">{{ userStore.isVip ? '立即续费' : '立即开通' }}</div>
    </div>

    <!-- 菜单功能分组 -->
    <div class="uc-body">
      <div class="uc-section">
        <div class="uc-item" @click="$router.push('/stats')">
          <div class="uci-icon" style="background: var(--primary-bg)">📊</div>
          <div class="uci-text">做题统计</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="$router.push('/wrong')">
          <div class="uci-icon" style="background: var(--danger-bg)">❌</div>
          <div class="uci-text">错题本</div>
          <div class="uci-value">3题</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="$router.push('/notes')">
          <div class="uci-icon" style="background: var(--warning-bg)">📓</div>
          <div class="uci-text">我的笔记</div>
          <div class="uci-value">0条</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="$router.push('/records')">
          <div class="uci-icon" style="background: var(--cyan-bg)">📋</div>
          <div class="uci-text">做题记录</div>
          <div class="uci-value">1次</div>
          <div class="uci-arrow">›</div>
        </div>
      </div>

      <div class="uc-section">
        <div class="uc-item" @click="$router.push('/subject')">
          <div class="uci-icon" style="background: var(--success-bg)">🎯</div>
          <div class="uci-text">考试科目</div>
          <div class="uci-value">{{ subjectStore.currentSubject?.name || '系统集成项目管理工程师' }}</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="$router.push('/settings')">
          <div class="uci-icon" style="background: var(--purple-bg)">⚙️</div>
          <div class="uci-text">系统设置</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="showToast('暂无新通知')">
          <div class="uci-icon" style="background: var(--pink-bg)">🔔</div>
          <div class="uci-text">消息通知</div>
          <div class="uci-arrow">›</div>
        </div>
      </div>

      <div class="uc-section">
        <div class="uc-item" @click="showToast('客服微信：ruankao_helper')">
          <div class="uci-icon" style="background: var(--cyan-bg)">❓</div>
          <div class="uci-text">帮助与反馈</div>
          <div class="uci-arrow">›</div>
        </div>
        <div class="uc-item" @click="showToast('软考刷题王 v2.0 · 高效备考一战过关')">
          <div class="uci-icon" style="background: var(--gray-2)">ℹ️</div>
          <div class="uci-text">关于我们</div>
          <div class="uci-arrow">›</div>
        </div>
      </div>

      <div class="logout-wrap">
        <button class="logout-btn" @click="onLogout">退出登录</button>
      </div>
    </div>

    <div style="height: 40px"></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useSubjectStore } from '@/stores/subject'

const router = useRouter()
const userStore = useUserStore()
const subjectStore = useSubjectStore()

async function onLogout() {
  try {
    await showConfirmDialog({ title: '退出确认', message: '确定要退出当前账号吗？' })
    userStore.logout()
    router.replace('/auth/login')
  } catch {
    // cancel
  }
}
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 20px);
}

.uc-header {
  background: linear-gradient(140deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%);
  padding: calc(env(safe-area-inset-top) + 20px) 20px 28px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #fff;
  position: relative;

  .uc-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .uc-info {
    flex: 1;

    .uc-name {
      font-size: 18px;
      font-weight: 700;
    }

    .uc-tag {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 4px;

      &.free {
        background: rgba(255, 255, 255, 0.2);
      }

      &.vip {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #fff;
        font-weight: 700;
      }
    }
  }

  .setting-btn {
    font-size: 13px;
    opacity: 0.9;
    cursor: pointer;
  }
}

.vip-banner {
  margin: -14px 14px 14px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);
  color: #fff;
  cursor: pointer;
  position: relative;
  z-index: 10;

  .vb-title {
    font-size: 15px;
    font-weight: 700;
    color: #fbbf24;
  }

  .vb-desc {
    font-size: 11px;
    color: var(--gray-4);
    margin-top: 2px;
  }

  .vb-btn {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 14px;
  }
}

.uc-body {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.uc-section {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 6px 14px;
  box-shadow: var(--shadow-sm);
}

.uc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-2);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  .uci-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .uci-text {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-8);
  }

  .uci-value {
    font-size: 12px;
    color: var(--gray-5);
  }

  .uci-arrow {
    font-size: 18px;
    color: var(--gray-4);
  }
}

.logout-wrap {
  margin-top: 8px;

  .logout-btn {
    width: 100%;
    height: 44px;
    background: var(--gray-0);
    border: 1.5px solid var(--danger-bg);
    color: var(--danger);
    font-size: 14px;
    font-weight: 700;
    border-radius: var(--radius);
    cursor: pointer;

    &:active {
      background: var(--danger-bg);
    }
  }
}
</style>
