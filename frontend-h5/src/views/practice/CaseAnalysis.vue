<template>
  <div class="case-page">
    <van-nav-bar title="案例分析" left-arrow @click-left="$router.back()" />

    <div class="case-banner">
      <van-icon name="records" class="banner-icon" />
      <div>
        <p class="banner-title">案例专项训练</p>
        <p class="banner-desc">下午案例题 · 实战突破</p>
      </div>
    </div>

    <div class="filter-row">
      <van-tabs v-model:active="activeTab" shrink color="#6366F1">
        <van-tab v-for="t in topics" :key="t" :title="t" />
      </van-tabs>
    </div>

    <div class="case-list">
      <div
        v-for="item in cases"
        :key="item.id"
        class="case-card"
        @click="$router.push(`/quiz/case?caseId=${item.id}`)"
      >
        <div class="case-head">
          <span class="case-no">案例 {{ item.no }}</span>
          <van-tag plain type="warning" size="medium">{{ item.topic }}</van-tag>
        </div>
        <p class="case-title text-ellipsis-2">{{ item.title }}</p>
        <div class="case-meta">
          <span><van-icon name="question-o" /> {{ item.questionCount }}小题</span>
          <span><van-icon name="clock-o" /> {{ item.duration }}分钟</span>
          <span><van-icon name="star-o" /> {{ item.difficulty }}</span>
        </div>
      </div>
    </div>

    <EmptyState v-if="!cases.length" text="暂无案例题" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'

const activeTab = ref(0)
const topics = ['全部', '软件工程', '数据库设计', '系统架构', '网络规划']

const cases = ref([
  { id: '1', no: '一', title: '某网上书店系统案例：分析需求并设计E-R图', topic: '数据库设计', questionCount: 5, duration: 30, difficulty: '中等' },
  { id: '2', no: '二', title: '企业OA系统重构案例：采用微服务架构分析', topic: '系统架构', questionCount: 4, duration: 35, difficulty: '较难' },
  { id: '3', no: '三', title: '校园网络规划设计案例：VLAN与路由配置', topic: '网络规划', questionCount: 3, duration: 25, difficulty: '中等' },
  { id: '4', no: '四', title: '软件项目风险管理案例：识别与应对策略', topic: '软件工程', questionCount: 4, duration: 30, difficulty: '简单' }
])
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.case-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.case-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-lg);
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: var(--radius-lg);
}

.banner-icon {
  font-size: 32px;
  color: var(--color-warning);
}

.banner-title {
  font-size: var(--font-size-md);
  font-weight: 600;
}

.banner-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

.filter-row {
  background: var(--bg-card);
}

.case-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.case-card {
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);

  &:active {
    transform: scale(0.99);
  }
}

.case-head {
  @include flex-between;
  margin-bottom: var(--space-sm);
}

.case-no {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.case-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: 1.5;
}

.case-meta {
  display: flex;
  gap: var(--space-md);
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: var(--space-md);

  span {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
}
</style>
