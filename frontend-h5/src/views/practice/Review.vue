<template>
  <div class="review-page">
    <van-nav-bar title="艾宾浩斯复习" left-arrow @click-left="$router.back()" />

    <div class="intro-card">
      <div class="intro-left">
        <van-icon name="underway-o" class="intro-icon" />
        <div>
          <p class="intro-title">记忆曲线复习</p>
          <p class="intro-desc">基于艾宾浩斯遗忘曲线智能复习</p>
        </div>
      </div>
      <van-circle :current-rate="20" :rate="20" :speed="100" :stroke-width="80" color="#6366F1">
        <template #default>
          <div class="circle-text">{{ todayCount }}</div>
        </template>
      </van-circle>
    </div>

    <div class="tabs">
      <van-tabs v-model:active="activeTab" shrink color="#6366F1">
        <van-tab title="今日待复习" />
        <van-tab title="即将复习" />
        <van-tab title="已完成" />
      </van-tabs>
    </div>

    <div class="review-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="review-card"
      >
        <div class="review-left">
          <p class="review-title text-ellipsis-2">{{ item.title }}</p>
          <div class="review-meta">
            <van-tag plain size="medium">{{ item.chapterName }}</van-tag>
            <span v-if="item.reviewCount > 0">已复习 {{ item.reviewCount }} 次</span>
          </div>
        </div>
        <div class="review-right">
          <p class="interval">{{ item.interval }}</p>
          <van-button size="mini" type="primary" round @click="onReview(item)">复习</van-button>
        </div>
      </div>
    </div>

    <EmptyState v-if="!list.length" text="今日复习已完成！" icon="checked" action-text="去刷题" @action="$router.push('/quiz/chapter')" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const activeTab = ref(0)
const todayCount = ref(8)

const list = ref([
  { id: '1', title: '下列关于虚拟存储器的描述，正确的是？', chapterName: '第3章 操作系统', reviewCount: 1, interval: '今日' },
  { id: '2', title: 'TCP 三次握手的详细过程是什么？', chapterName: '第5章 网络', reviewCount: 0, interval: '今日' },
  { id: '3', title: '数据库第三范式的定义是什么？', chapterName: '第4章 数据库', reviewCount: 2, interval: '今日' },
  { id: '4', title: '瀑布模型的优缺点有哪些？', chapterName: '第6章 软件工程', reviewCount: 0, interval: '明日' }
])

function onReview(item: any) {
  router.push(`/quiz/analysis/${item.id}`)
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.review-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.intro-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: var(--space-lg);
  padding: var(--space-lg);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  border-radius: var(--radius-lg);
}

.intro-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.intro-icon {
  font-size: 32px;
  color: var(--color-primary);
}

.intro-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
}

.intro-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

.circle-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.tabs {
  background: var(--bg-card);
}

.review-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.review-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.review-left {
  flex: 1;
}

.review-title {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.5;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.review-right {
  text-align: center;

  .interval {
    font-size: 11px;
    color: var(--color-primary);
    font-weight: 600;
    margin-bottom: 4px;
  }
}
</style>
