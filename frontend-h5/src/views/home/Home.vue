<template>
  <div class="home-page">
    <!-- 顶部渐变 Header -->
    <div class="home-header">
      <div class="subject-bar">
        <div class="subject-selector" @click="$router.push('/subject')">
          <span>{{ subjectStore.currentSubject?.name || '系统集成项目管理工程师' }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <div class="top-actions">
          <div class="icon-btn" @click="$router.push('/chapter')">
            <span>🔍</span>
            <span>题库</span>
          </div>
          <div class="icon-btn" @click="$router.push('/mine')">
            <span>👤</span>
            <span>我的</span>
          </div>
        </div>
      </div>

      <!-- 倒计时 + 复习卡片组合 -->
      <div class="hero-cards">
        <div class="countdown-card">
          <div class="label">距离考试还有</div>
          <div class="days">{{ examDays }}<span>天</span></div>
          <div class="sub">2026年软考统一认证</div>
        </div>
        <div class="review-card-mini" @click="$router.push('/review')">
          <div class="rm-icon">🧠</div>
          <div class="rm-num">{{ reviewCount }}</div>
          <div class="rm-label">待复习题目</div>
        </div>
      </div>

      <!-- 核心数据三卡片 -->
      <div class="data-cards">
        <div class="data-card">
          <div class="num">{{ stats.todayDone }}<small>题</small></div>
          <div class="label">今日刷题</div>
        </div>
        <div class="data-card">
          <div class="num">{{ stats.correctRate }}<small>%</small></div>
          <div class="label">正确率</div>
        </div>
        <div class="data-card">
          <div class="num">{{ stats.totalQuestions }}<small>题</small></div>
          <div class="label">总题数</div>
        </div>
      </div>
    </div>

    <!-- 📢 官方通知公告条（后台内容管理同步） -->
    <div v-if="announcements.length > 0" class="announcement-bar" @click="handleAnnouncementClick(announcements[0])">
      <div class="ann-speaker">📢</div>
      <div class="ann-content">
        <span class="ann-badge">公告</span>
        <span class="ann-title">{{ announcements[0].title }}</span>
      </div>
      <div class="ann-arrow">›</div>
    </div>

    <!-- 🖼️ 移动端轮播 Banner 模块（后台内容管理同步） -->
    <div v-if="banners.length > 0" class="banner-carousel-wrap">
      <van-swipe class="banner-swipe" :autoplay="4500" indicator-color="#6366f1" lazy-render>
        <van-swipe-item v-for="b in banners" :key="b.id" @click="handleBannerClick(b)">
          <div class="banner-card">
            <img :src="b.imageUrl" :alt="b.title" class="banner-image" />
            <div class="banner-gradient-mask">
              <span class="banner-card-title">{{ b.title }}</span>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 核心功能网格 (8格现代风格) -->
    <div class="section-title">
      <h3>核心功能</h3>
      <span class="more" @click="$router.push('/chapter')">全部题库 ›</span>
    </div>
    <div class="function-grid">
      <div class="func-item" @click="$router.push('/daily')">
        <div class="func-icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a)">📝</div>
        <span class="name">每日一练</span>
        <span class="badge">5题</span>
      </div>
      <div class="func-item" @click="$router.push('/quiz/practice')">
        <div class="func-icon" style="background: linear-gradient(135deg, #cffafe, #a5f3fc)">🎯</div>
        <span class="name">自主练习</span>
      </div>
      <div class="func-item" @click="$router.push('/chapter')">
        <div class="func-icon" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0)">📚</div>
        <span class="name">章节练习</span>
      </div>
      <div class="func-item" @click="$router.push('/real')">
        <div class="func-icon" style="background: linear-gradient(135deg, #fee2e2, #fecaca)">📋</div>
        <span class="name">历年真题</span>
      </div>
      <div class="func-item" @click="$router.push('/review')">
        <div class="func-icon" style="background: linear-gradient(135deg, #fed7aa, #fdba74)">🧠</div>
        <span class="name">艾宾浩斯</span>
        <span class="vip-tag">VIP</span>
      </div>
      <div class="func-item" @click="$router.push('/mock')">
        <div class="func-icon" style="background: linear-gradient(135deg, #e9d5ff, #c4b5fd)">⏱️</div>
        <span class="name">模拟考试</span>
      </div>
      <div class="func-item" @click="$router.push('/case')">
        <div class="func-icon" style="background: linear-gradient(135deg, #fbcfe8, #f9a8d4)">📊</div>
        <span class="name">案例分析</span>
        <span class="vip-tag">VIP</span>
      </div>
      <div class="func-item" @click="$router.push('/vip')">
        <div class="func-icon" style="background: linear-gradient(135deg, #a7f3d0, #6ee7b7)">👑</div>
        <span class="name">会员中心</span>
        <span class="vip-tag">VIP</span>
      </div>
    </div>

    <!-- 做题统计与能力雷达预览 -->
    <div class="stat-section" @click="$router.push('/stats')">
      <div class="stat-row">
        <div>
          <div class="stat-title">做题统计与知识图谱</div>
          <div class="stat-desc">查看刷题走势、能力雷达与薄弱考点诊断</div>
        </div>
        <div class="arrow">›</div>
      </div>
      <div class="radar-preview">
        <svg class="radar-chart" viewBox="0 0 100 100">
          <polygon
            points="50,10 85,30 85,70 50,90 15,70 15,30"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1"
          />
          <polygon
            points="50,25 72,35 72,65 50,75 28,65 28,35"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1"
          />
          <polygon
            points="50,20 68,38 75,60 50,80 25,58 30,35"
            fill="rgba(99,102,241,0.18)"
            stroke="#6366F1"
            stroke-width="1.5"
          />
        </svg>
        <div class="radar-info">
          <div class="item"><div class="dot" style="background: #6366f1"></div>项目管理基础 78%</div>
          <div class="item"><div class="dot" style="background: #10b981"></div>项目范围管理 85%</div>
          <div class="item"><div class="dot" style="background: #f59e0b"></div>项目进度管理 52%</div>
          <div class="item"><div class="dot" style="background: #ef4444"></div>项目成本管理 38%</div>
        </div>
      </div>
    </div>

    <!-- 快捷入口卡片 (笔记与记录) -->
    <div class="note-record-section">
      <div class="note-card" @click="$router.push('/notes')">
        <div class="nr-icon">📓</div>
        <div class="nr-text">
          <div class="t">我的笔记</div>
          <div class="d">高频知识点随记</div>
        </div>
      </div>
      <div class="record-card" @click="$router.push('/records')">
        <div class="nr-icon">📋</div>
        <div class="nr-text">
          <div class="t">做题记录</div>
          <div class="d">历史答卷回溯</div>
        </div>
      </div>
    </div>

    <!-- 📢 公告详情底部弹窗 -->
    <van-popup
      v-model:show="announcementPopupVisible"
      round
      closeable
      position="bottom"
      :style="{ maxHeight: '75%', minHeight: '280px' }"
    >
      <div v-if="selectedAnnouncement" class="ann-popup-body">
        <div class="ap-header">
          <div class="ap-type-badge">{{ selectedAnnouncement.type || '官方公告' }}</div>
          <h3 class="ap-title">{{ selectedAnnouncement.title }}</h3>
          <div class="ap-date">发布于：{{ formatDate(selectedAnnouncement.publishAt || selectedAnnouncement.createdAt) }}</div>
        </div>
        <div class="ap-content">
          {{ selectedAnnouncement.content }}
        </div>
        <div class="ap-footer">
          <button class="ap-confirm-btn" @click="announcementPopupVisible = false">我已了解</button>
        </div>
      </div>
    </van-popup>

    <div style="height: 20px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { useUserStore } from '@/stores/user'
import { getOverview } from '@/api/stats'
import { getBanners, getAnnouncements, type BannerItem, type AnnouncementItem } from '@/api/content'

const router = useRouter()
const subjectStore = useSubjectStore()
const userStore = useUserStore()

// 倒计时计算（距离下次软考，假设为2026年11月统考）
const targetExamDate = new Date('2026-11-08T09:00:00')
const now = new Date()
const diffDays = Math.max(1, Math.ceil((targetExamDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
const examDays = ref(diffDays)
const reviewCount = ref(0)

// 后台内容管理数据
const banners = ref<BannerItem[]>([])
const announcements = ref<AnnouncementItem[]>([])
const selectedAnnouncement = ref<AnnouncementItem | null>(null)
const announcementPopupVisible = ref(false)

const stats = reactive({
  todayDone: 0,
  correctRate: 0,
  totalQuestions: 0,
})

function formatDate(d?: string) {
  if (!d) return '近期'
  try {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  } catch {
    return d
  }
}

async function fetchContentData() {
  try {
    const [bRes, aRes] = await Promise.allSettled([
      getBanners(),
      getAnnouncements(),
    ])
    if (bRes.status === 'fulfilled' && bRes.value?.data) {
      banners.value = (bRes.value.data as any[]).filter(
        (b) => b.status === 1 || b.status === '1' || b.status === 'online' || b.status === 'enabled'
      )
    }
    if (aRes.status === 'fulfilled' && aRes.value?.data) {
      announcements.value = aRes.value.data
    }
  } catch {
    // ignore
  }
}

function handleBannerClick(banner: BannerItem) {
  const url = banner.linkUrl || (banner as any).url || (banner as any).targetUrl
  if (!url) return
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.location.href = url
  } else {
    router.push(url)
  }
}

function handleAnnouncementClick(item?: AnnouncementItem) {
  if (item) {
    selectedAnnouncement.value = item
  } else if (announcements.value.length > 0) {
    selectedAnnouncement.value = announcements.value[0]
  }
  if (selectedAnnouncement.value) {
    announcementPopupVisible.value = true
  }
}

async function fetchHomeStats() {
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
    const res = await getOverview(subId)
    if (res?.data) {
      stats.todayDone = res.data.todayCount ?? res.data.totalAnswered ?? 0
      stats.correctRate = res.data.correctRate ?? 0
      stats.totalQuestions = res.data.totalQuestions || subjectStore.currentSubject?.questionCount || 0
      reviewCount.value = res.data.totalQuestions || 0
    } else {
      stats.totalQuestions = subjectStore.currentSubject?.questionCount || 0
      reviewCount.value = stats.totalQuestions
    }
  } catch {
    stats.totalQuestions = subjectStore.currentSubject?.questionCount || 0
    reviewCount.value = stats.totalQuestions
  }
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    fetchHomeStats()
  }
)

onMounted(async () => {
  if (subjectStore.subjectList.length === 0) {
    await subjectStore.fetchSubjects()
  }
  await Promise.all([fetchHomeStats(), fetchContentData()])
  if (userStore.token && !userStore.userInfo) {
    try {
      await userStore.fetchProfile()
    } catch {
      // ignore
    }
  }
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 16px);
}

/* Header - 沉浸式渐变背景 */
.home-header {
  background: linear-gradient(140deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 18px 24px;
  color: #fff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -30px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
}

.subject-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0 16px;
  position: relative;
  z-index: 1;
}

.subject-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.85;
  }
}

.top-actions {
  display: flex;
  gap: 16px;

  .icon-btn {
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    opacity: 0.9;
    transition: opacity 0.2s;

    span:first-child {
      font-size: 16px;
    }

    &:hover {
      opacity: 1;
    }
  }
}

/* 倒计时 + 复习卡片组合 */
.hero-cards {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.countdown-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 12px;
    opacity: 0.85;
  }

  .days {
    font-size: 32px;
    font-weight: 800;
    line-height: 1.1;

    span {
      font-size: 14px;
      font-weight: 500;
      margin-left: 2px;
    }
  }

  .sub {
    font-size: 11px;
    opacity: 0.75;
  }
}

.review-card-mini {
  flex: 0.85;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.9), rgba(251, 146, 60, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover,
  &:active {
    transform: translateY(-2px);
  }

  .rm-icon {
    font-size: 24px;
  }

  .rm-num {
    font-size: 24px;
    font-weight: 800;
  }

  .rm-label {
    font-size: 11px;
    opacity: 0.9;
  }
}

/* 数据卡片 */
.data-cards {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.data-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  padding: 12px 8px;
  text-align: center;

  .num {
    font-size: 22px;
    font-weight: 800;

    small {
      font-size: 12px;
      font-weight: 500;
    }
  }

  .label {
    font-size: 11px;
    opacity: 0.75;
    margin-top: 2px;
  }
}

/* 区块标题 */
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 10px;

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .more {
    font-size: 13px;
    color: var(--gray-5);
    cursor: pointer;
  }
}

/* 功能网格 */
.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px 4px;
  background: var(--gray-0);
  margin: 0 14px;
  border-radius: var(--radius);
  padding: 18px 8px;
  box-shadow: var(--shadow-md);
}

.func-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 4px;
  position: relative;
  transition: transform 0.2s;

  &:active {
    transform: translateY(-2px);
  }

  .func-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    position: relative;
    box-shadow: var(--shadow-sm);
  }

  .name {
    font-size: 12px;
    color: var(--gray-7);
    font-weight: 500;
  }

  .badge {
    position: absolute;
    top: 2px;
    right: 50%;
    margin-right: -24px;
    background: var(--danger);
    color: #fff;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 10px;
    line-height: 1.2;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  }

  .vip-tag {
    position: absolute;
    top: 2px;
    right: 50%;
    margin-right: -26px;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #fff;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 6px;
    font-weight: 700;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
  }
}

/* 统计卡片与雷达图 */
.stat-section {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .stat-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .stat-desc {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 4px;
  }

  .arrow {
    color: var(--gray-4);
    font-size: 20px;
  }
}

.radar-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-2);

  .radar-chart {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  .radar-info {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--gray-6);

      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }
    }
  }
}

/* 笔记与记录双卡片 */
.note-record-section {
  margin: 0 14px;
  display: flex;
  gap: 12px;
}

.note-card,
.record-card {
  flex: 1;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-md);
  cursor: pointer;

  .nr-icon {
    font-size: 24px;
  }

  .nr-text {
    .t {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-8);
    }
    .d {
      font-size: 11px;
      color: var(--gray-5);
      margin-top: 2px;
    }
  }
}

/* 📢 官方通知公告条 */
.announcement-bar {
  margin: 10px 14px 0;
  background: #fff;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  border: 1px solid rgba(99, 102, 241, 0.12);

  .ann-speaker {
    font-size: 16px;
    animation: bounce 2s infinite;
  }

  .ann-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    white-space: nowrap;
  }

  .ann-badge {
    background: #eef2ff;
    color: #4f46e5;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .ann-title {
    font-size: 13px;
    color: var(--gray-8);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ann-arrow {
    color: var(--gray-4);
    font-size: 16px;
  }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* 🖼️ 轮播 Banner 模块 */
.banner-carousel-wrap {
  margin: 12px 14px 0;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);

  .banner-swipe {
    width: 100%;
    height: 130px;
    border-radius: var(--radius);
  }

  .banner-slide {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
  }

  .banner-card {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
  }

  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .banner-gradient-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px 14px 8px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
    display: flex;
    align-items: flex-end;
  }

  .banner-card-title {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 📢 公告弹窗内容区 */
.ann-popup-body {
  padding: 20px 20px 30px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .ap-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--gray-2);

    .ap-type-badge {
      display: inline-block;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .ap-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--gray-8);
      line-height: 1.4;
      margin: 0 0 6px;
    }

    .ap-date {
      font-size: 12px;
      color: var(--gray-5);
    }
  }

  .ap-content {
    font-size: 14px;
    color: var(--gray-7);
    line-height: 1.7;
    white-space: pre-wrap;
    flex: 1;
    overflow-y: auto;
    padding: 4px 0 20px;
  }

  .ap-footer {
    padding-top: 10px;

    .ap-confirm-btn {
      width: 100%;
      height: 44px;
      border-radius: 22px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      border: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      cursor: pointer;

      &:active {
        opacity: 0.9;
        transform: scale(0.98);
      }
    }
  }
}
</style>
