<template>
  <div class="user-page">
    <!-- 用户中心顶部卡片 -->
    <div class="uc-header">
      <div class="uc-avatar">
        <img
          v-if="userStore.userInfo?.avatar"
          :src="userStore.userInfo.avatar"
          alt="avatar"
        >
        <span v-else>👤</span>
      </div>
      <div class="uc-info">
        <div class="uc-name">
          {{ userStore.userInfo?.nickname || userStore.userInfo?.username || '软考学员' }}
        </div>
        <div
          class="uc-tag"
          :class="userStore.isVip ? 'vip' : 'free'"
        >
          {{ userStore.isVip ? '👑 VIP 会员' : '免费用户' }}
        </div>
      </div>
      <div
        class="setting-btn"
        @click="$router.push('/settings')"
      >
        ⚙️ 设置
      </div>
    </div>

    <!-- VIP 横幅 -->
    <div
      class="vip-banner"
      @click="$router.push('/vip')"
    >
      <div class="vb-left">
        <div class="vb-title">
          👑 {{ userStore.isVip ? 'VIP 会员尊享中' : '开通 VIP 会员' }}
        </div>
        <div class="vb-desc">
          解锁全部题库 · AI智能解析 · 艾宾浩斯智能复习
        </div>
      </div>
      <div class="vb-btn">
        {{ userStore.isVip ? '立即续费' : '立即开通' }}
      </div>
    </div>

    <!-- 菜单功能分组 -->
    <div class="uc-body">
      <div class="uc-section">
        <div
          class="uc-item"
          @click="$router.push('/stats')"
        >
          <div
            class="uci-icon"
            style="background: var(--primary-bg)"
          >
            📊
          </div>
          <div class="uci-text">
            做题统计
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="$router.push('/wrong')"
        >
          <div
            class="uci-icon"
            style="background: var(--danger-bg)"
          >
            ❌
          </div>
          <div class="uci-text">
            错题本
          </div>
          <div class="uci-value">
            {{ overview.wrongCount || 0 }}题
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="$router.push('/notes')"
        >
          <div
            class="uci-icon"
            style="background: var(--warning-bg)"
          >
            📓
          </div>
          <div class="uci-text">
            我的笔记
          </div>
          <div class="uci-value">
            0条
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="$router.push('/records')"
        >
          <div
            class="uci-icon"
            style="background: var(--cyan-bg)"
          >
            📋
          </div>
          <div class="uci-text">
            做题记录
          </div>
          <div class="uci-value">
            {{ overview.totalAnswered || 0 }}题
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
      </div>

      <div class="uc-section">
        <div
          class="uc-item"
          @click="$router.push('/subject')"
        >
          <div
            class="uci-icon"
            style="background: var(--success-bg)"
          >
            🎯
          </div>
          <div class="uci-text">
            考试科目
          </div>
          <div class="uci-value">
            {{ subjectStore.currentSubject?.name || '选择科目' }}
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="$router.push('/settings')"
        >
          <div
            class="uci-icon"
            style="background: var(--purple-bg)"
          >
            ⚙️
          </div>
          <div class="uci-text">
            系统设置
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="handleOpenAnnouncements"
        >
          <div
            class="uci-icon"
            style="background: var(--pink-bg)"
          >
            🔔
          </div>
          <div class="uci-text">
            消息通知
          </div>
          <div
            v-if="announcementList.length > 0"
            class="uci-value"
          >
            {{ announcementList.length }}条公告
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
      </div>

      <div class="uc-section">
        <div
          class="uc-item"
          @click="showToast('客服微信：ruankao_helper')"
        >
          <div
            class="uci-icon"
            style="background: var(--cyan-bg)"
          >
            ❓
          </div>
          <div class="uci-text">
            帮助与反馈
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
        <div
          class="uc-item"
          @click="showToast('软考刷题系统 · 高效备考一战过关')"
        >
          <div
            class="uci-icon"
            style="background: var(--gray-2)"
          >
            ℹ️
          </div>
          <div class="uci-text">
            关于我们
          </div>
          <div class="uci-arrow">
            ›
          </div>
        </div>
      </div>

      <div class="logout-wrap">
        <button
          class="logout-btn"
          @click="onLogout"
        >
          退出登录
        </button>
      </div>
    </div>

    <!-- 📢 消息通知弹窗 -->
    <van-popup
      v-model:show="noticePopupVisible"
      round
      closeable
      position="bottom"
      :style="{ maxHeight: '75%', minHeight: '300px' }"
    >
      <div class="notice-popup-body">
        <h3 class="np-title">
          📢 官方通知公告
        </h3>
        <div
          v-if="announcementList.length > 0"
          class="np-list"
        >
          <div
            v-for="item in announcementList"
            :key="item.id"
            class="np-card"
          >
            <div class="np-card-header">
              <span class="np-badge">{{ item.type || '公告' }}</span>
              <span class="np-card-title">{{ item.title }}</span>
            </div>
            <div class="np-card-content">
              {{ item.content }}
            </div>
            <div class="np-card-time">
              {{ item.publishAt ? item.publishAt.slice(0, 16).replace('T', ' ') : '' }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="np-empty"
        >
          暂无新通知
        </div>
      </div>
    </van-popup>

    <div style="height: 40px" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useSubjectStore } from '@/stores/subject'
import { getOverview } from '@/api/stats'
import { getAnnouncements, type AnnouncementItem } from '@/api/content'

const router = useRouter()
const userStore = useUserStore()
const subjectStore = useSubjectStore()

const noticePopupVisible = ref(false)
const announcementList = ref<AnnouncementItem[]>([])

const overview = reactive({
  totalAnswered: 0,
  wrongCount: 0,
  favoriteCount: 0,
})

async function fetchAnnouncements() {
  try {
    const res = await getAnnouncements()
    if (res?.data) {
      announcementList.value = res.data
    }
  } catch {
    // ignore
  }
}

function handleOpenAnnouncements() {
  noticePopupVisible.value = true
}

async function fetchStats() {
  try {
    const res = await getOverview(subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined)
    if (res?.data) {
      overview.totalAnswered = res.data.totalAnswered || 0
      overview.wrongCount = res.data.wrongCount || 0
      overview.favoriteCount = res.data.favoriteCount || 0
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchProfile()
  }
  fetchStats()
  fetchAnnouncements()
})

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
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  padding: calc(env(safe-area-inset-top) + 20px) 20px 30px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #fff;
  position: relative;

  .uc-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    border: 2px solid rgba(255, 255, 255, 0.4);
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
      line-height: 1.2;
    }

    .uc-tag {
      display: inline-block;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 6px;
      font-weight: 600;

      &.vip {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff;
      }

      &.free {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }
  }

  .setting-btn {
    font-size: 12px;
    background: rgba(255, 255, 255, 0.15);
    padding: 6px 12px;
    border-radius: 16px;
    cursor: pointer;
  }
}

.vip-banner {
  margin: -16px 14px 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(30, 27, 75, 0.25);
  position: relative;
  z-index: 2;
  cursor: pointer;

  .vb-left {
    .vb-title {
      color: #fbbf24;
      font-size: 14px;
      font-weight: 700;
    }

    .vb-desc {
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      margin-top: 3px;
    }
  }

  .vb-btn {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #78350f;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 16px;
  }
}

.uc-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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
  padding: 12px 0;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--gray-2);

  &:last-child {
    border-bottom: none;
  }

  .uci-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .uci-text {
    flex: 1;
    font-size: 14px;
    color: var(--gray-8);
    font-weight: 500;
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

/* 📢 消息通知弹窗样式 */
.notice-popup-body {
  padding: 20px 16px 30px;

  .np-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--gray-8);
    margin: 0 0 16px;
    text-align: center;
  }

  .np-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .np-card {
    background: var(--gray-1);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    border-left: 3px solid #6366f1;

    .np-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .np-badge {
        background: #eef2ff;
        color: #4f46e5;
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
      }

      .np-card-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--gray-8);
      }
    }

    .np-card-content {
      font-size: 13px;
      color: var(--gray-6);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .np-card-time {
      font-size: 11px;
      color: var(--gray-4);
      margin-top: 8px;
      text-align: right;
    }
  }

  .np-empty {
    text-align: center;
    color: var(--gray-4);
    padding: 40px 0;
    font-size: 14px;
  }
}
</style>
