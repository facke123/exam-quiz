<template>
  <div class="home-page">
    <!-- 顶部渐变 Header -->
    <div class="header">
      <div class="header-bg">
        <div class="circle c1"></div>
        <div class="circle c2"></div>
      </div>
      <div class="header-content">
        <div class="top-row">
          <div class="subject-switch" @click="showSubject = true">
            <span class="subject-icon">{{ subjectStore.currentSubject.icon }}</span>
            <div class="subject-text">
              <p class="sub-label">当前科目</p>
              <p class="sub-name">{{ subjectStore.currentSubject.name }}</p>
            </div>
            <van-icon name="arrow-down" />
          </div>
          <div class="avatar" @click="$router.push('/mine')">
            <van-image
              round
              width="40"
              height="40"
              :src="userStore.userInfo?.avatar || ''"
            >
              <template #error>
                <van-icon name="user-o" class="avatar-default" />
              </template>
            </van-image>
          </div>
        </div>

        <div class="exam-countdown">
          <div class="countdown-left">
            <p class="cd-label">距考试还有</p>
            <p class="cd-days"><span class="num">{{ examDays }}</span> 天</p>
          </div>
          <div class="countdown-right">
            <van-button size="mini" plain class="cd-btn" @click="$router.push('/subject')">
              切换科目
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="stats-cards">
      <div class="stat-item">
        <p class="stat-num">{{ overview.totalAnswered }}</p>
        <p class="stat-label">已刷题</p>
      </div>
      <div class="stat-item">
        <p class="stat-num">{{ percent(overview.correctRate) }}</p>
        <p class="stat-label">正确率</p>
      </div>
      <div class="stat-item">
        <p class="stat-num">{{ overview.totalQuestions }}</p>
        <p class="stat-label">总题数</p>
      </div>
      <div class="stat-item">
        <p class="stat-num">{{ overview.streakDays }}</p>
        <p class="stat-label">连续天数</p>
      </div>
    </div>

    <!-- 艾宾浩斯复习提醒 -->
    <div class="review-banner" @click="$router.push('/review')">
      <div class="review-icon"><van-icon name="underway-o" /></div>
      <div class="review-text">
        <p class="review-title">艾宾浩斯复习提醒</p>
        <p class="review-desc">有 {{ reviewCount }} 道题需要今日复习</p>
      </div>
      <van-icon name="arrow" />
    </div>

    <!-- 9宫格功能入口 -->
    <div class="section-title">
      <span>功能入口</span>
    </div>
    <div class="grid-entrance">
      <div
        v-for="item in entrances"
        :key="item.path"
        class="grid-item"
        @click="$router.push(item.path)"
      >
        <div class="grid-icon" :style="{ background: item.bg }">
          <van-icon :name="item.icon" />
        </div>
        <span class="grid-text">{{ item.name }}</span>
      </div>
    </div>

    <!-- 知识雷达图预览 -->
    <div class="section-title">
      <span>知识掌握</span>
      <span class="more" @click="$router.push('/stats')">查看详情</span>
    </div>
    <div class="radar-preview card">
      <div class="radar-bars">
        <div v-for="(d, i) in radarPreview" :key="i" class="radar-bar-item">
          <div class="bar-track">
            <div class="bar-fill" :style="{ height: d.value + '%' }"></div>
          </div>
          <span class="bar-label">{{ d.dimension }}</span>
        </div>
      </div>
    </div>

    <!-- 每日推荐题目 -->
    <div class="section-title">
      <span>每日推荐</span>
      <span class="more" @click="$router.push('/daily')">更多</span>
    </div>
    <div class="daily-rec card" v-if="dailyQuestion" @click="$router.push('/quiz/daily')">
      <div class="rec-tag">推荐</div>
      <p class="rec-title">{{ dailyQuestion }}</p>
      <div class="rec-foot">
        <van-tag plain type="primary" size="medium">单选题</van-tag>
        <span class="rec-action">去练习 <van-icon name="arrow" /></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useSubjectStore } from '@/stores/subject'
import { toPercent } from '@/utils/format'
import SubjectPicker from '@/components/SubjectPicker.vue'

const userStore = useUserStore()
const subjectStore = useSubjectStore()
const showSubject = ref(false)

const examDays = ref(120)
const reviewCount = ref(8)

const overview = reactive({
  totalAnswered: 326,
  correctRate: 0.78,
  totalQuestions: 2400,
  streakDays: 12
})

const radarPreview = ref([
  { dimension: '计算机基础', value: 80 },
  { dimension: '数据结构', value: 65 },
  { dimension: '软件工程', value: 72 },
  { dimension: '网络', value: 55 },
  { dimension: '数据库', value: 70 }
])

const dailyQuestion = ref('在软件开发过程中，瀑布模型的主要优点是什么？')

const entrances = [
  { name: '每日一练', icon: 'calendar-o', path: '/daily', bg: 'rgba(99,102,241,0.1)' },
  { name: '章节练习', icon: 'bookmark-o', path: '/chapter', bg: 'rgba(139,92,246,0.1)' },
  { name: '历年真题', icon: 'description', path: '/real', bg: 'rgba(16,185,129,0.1)' },
  { name: '模拟考试', icon: 'completed', path: '/mock', bg: 'rgba(245,158,11,0.1)' },
  { name: '自主练习', icon: 'edit', path: '/quiz/chapter', bg: 'rgba(236,72,153,0.1)' },
  { name: '案例分析', icon: 'records', path: '/case', bg: 'rgba(59,130,246,0.1)' },
  { name: '艾宾浩斯', icon: 'underway-o', path: '/review', bg: 'rgba(168,85,247,0.1)' },
  { name: '知识库', icon: 'search', path: '/chapter', bg: 'rgba(20,184,166,0.1)' },
  { name: '考后估分', icon: 'chart-trending-o', path: '/stats', bg: 'rgba(244,63,94,0.1)' }
]

function percent(n: number): string {
  return toPercent(n, 0)
}

onMounted(async () => {
  if (userStore.token && !userStore.userInfo) {
    try {
      await userStore.fetchProfile()
    } catch {
      // ...
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.home-page {
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + var(--space-lg));
}

/* Header */
.header {
  position: relative;
  padding: calc(env(safe-area-inset-top) + var(--space-lg)) var(--space-lg) var(--space-xl);
  background: var(--gradient-primary);
  overflow: hidden;
}

.header-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);

    &.c1 {
      width: 200px;
      height: 200px;
      top: -60px;
      right: -60px;
    }
    &.c2 {
      width: 150px;
      height: 150px;
      bottom: -50px;
      left: -40px;
    }
  }
}

.header-content {
  position: relative;
  color: #fff;
}

.top-row {
  @include flex-between;
  margin-bottom: var(--space-lg);
}

.subject-switch {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.subject-icon {
  font-size: 24px;
}

.sub-label {
  font-size: 11px;
  opacity: 0.8;
}

.sub-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  max-width: 150px;
  @include text-ellipsis(1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  @include flex-center;
}

.avatar-default {
  font-size: 20px;
  color: #fff;
}

.exam-countdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
}

.cd-label {
  font-size: var(--font-size-xs);
  opacity: 0.85;
}

.cd-days {
  font-size: var(--font-size-base);
  margin-top: 2px;

  .num {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-right: 2px;
  }
}

.cd-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  color: #fff !important;
}

/* Stats */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: -var(--space-xl) var(--space-lg) 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-lg) var(--space-sm);
  position: relative;
  z-index: 2;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Review banner */
.review-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1));
  border-radius: var(--radius-md);
}

.review-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-warning);
  color: #fff;
  @include flex-center;

  .van-icon {
    font-size: 20px;
  }
}

.review-text {
  flex: 1;
}

.review-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.review-desc {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Section title */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-lg);
  margin: var(--space-xl) 0 var(--space-md);

  span:first-child {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
  }

  .more {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

/* Grid */
.grid-entrance {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  padding: 0 var(--space-lg);
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md) 0;
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.96);
  }
}

.grid-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  @include flex-center;

  .van-icon {
    font-size: 22px;
    color: var(--color-primary);
  }
}

.grid-text {
  font-size: var(--font-size-xs);
  color: var(--text-regular);
}

/* Radar preview */
.radar-preview {
  margin: 0 var(--space-lg);
  padding: var(--space-lg);
}

.radar-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 120px;
}

.radar-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  width: 16%;
}

.bar-track {
  width: 20px;
  height: 80px;
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-sm);
  transition: height var(--transition-slow);
}

.bar-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
}

/* Daily rec */
.daily-rec {
  margin: 0 var(--space-lg);
  position: relative;
}

.rec-tag {
  position: absolute;
  top: var(--space-md);
  right: var(--space-lg);
  padding: 2px 8px;
  background: var(--gradient-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
}

.rec-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: var(--space-md);
  padding-right: 40px;
}

.rec-foot {
  @include flex-between;
}

.rec-action {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
