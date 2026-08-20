<template>
  <div class="mock-exam">
    <van-nav-bar title="模拟考试" left-arrow @click-left="$router.back()" />

    <div class="mock-banner">
      <div class="banner-bg"></div>
      <div class="banner-content">
        <van-icon name="medal-o" class="banner-icon" />
        <div>
          <p class="banner-title">全真模拟</p>
          <p class="banner-desc">仿真出题 · 模拟实战 · 检验学习</p>
        </div>
      </div>
    </div>

    <div class="mock-list">
      <div
        v-for="mock in mocks"
        :key="mock.id"
        class="mock-card"
        @click="enterMock(mock)"
      >
        <div class="mock-head">
          <span class="mock-name">{{ mock.name }}</span>
          <van-tag v-if="mock.isNew" color="#6366F1" size="medium">NEW</van-tag>
        </div>
        <p class="mock-desc">{{ mock.desc }}</p>
        <div class="mock-meta">
          <span><van-icon name="clock-o" /> {{ mock.duration }}分钟</span>
          <span><van-icon name="description" /> {{ mock.questionCount }}题</span>
          <span><van-icon name="user-o" /> {{ mock.attendCount }}人参加</span>
        </div>
        <div v-if="mock.done" class="mock-result">
          <span>上次成绩</span>
          <span class="result-score">{{ mock.score }}分</span>
        </div>
      </div>
    </div>

    <EmptyState v-if="!mocks.length" text="暂无模拟卷" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()

const mocks = ref([
  { id: '1', name: '模拟卷一 · 基础篇', desc: '覆盖计算机基础、数据结构等高频考点', duration: 90, questionCount: 50, attendCount: 1280, done: false, score: 0, isNew: true },
  { id: '2', name: '模拟卷二 · 强化篇', desc: '操作系统、数据库、网络综合考查', duration: 120, questionCount: 75, attendCount: 980, done: true, score: 72, isNew: false },
  { id: '3', name: '模拟卷三 · 冲刺篇', desc: '软件工程、项目管理、案例分析', duration: 150, questionCount: 75, attendCount: 654, done: false, score: 0, isNew: true }
])

function enterMock(mock: any) {
  router.push(`/quiz/mock?examId=${mock.id}`)
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.mock-exam {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.mock-banner {
  position: relative;
  margin: var(--space-lg);
  padding: var(--space-xl) var(--space-lg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--gradient-primary);
  color: #fff;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2), transparent 60%);
}

.banner-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.banner-icon {
  font-size: 36px;
}

.banner-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.banner-desc {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  margin-top: 2px;
}

.mock-list {
  padding: 0 var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.mock-card {
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.99);
  }
}

.mock-head {
  @include flex-between;
  margin-bottom: 6px;
}

.mock-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.mock-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.mock-meta {
  display: flex;
  gap: var(--space-md);
  font-size: 11px;
  color: var(--text-secondary);

  span {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
}

.mock-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-light);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.result-score {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-success);
}
</style>
