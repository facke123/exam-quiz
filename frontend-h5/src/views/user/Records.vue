<template>
  <div class="records-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        做题记录
      </div>
      <div class="right" />
    </div>

    <div class="records-list">
      <div
        v-for="r in list"
        :key="r.id"
        class="record-card"
        @click="$router.push(`/quiz/report/${r.id}`)"
      >
        <div class="rc-header">
          <span class="rc-title">{{ r.title }}</span>
          <span class="rc-time">{{ r.time }}</span>
        </div>
        <div class="rc-meta">
          <span>{{ r.questionCount }}题</span>
          <span class="rc-rate">正确率 {{ r.correctRate }}%</span>
          <span>用时 {{ r.duration }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const list = ref([
  {
    id: '1',
    title: '章节练习 · 信息化与发展',
    time: '今天 10:32',
    questionCount: 10,
    correctRate: 80,
    duration: '8分钟',
  },
  {
    id: '2',
    title: '全真模拟考试 · 2026综合模拟卷一',
    time: '昨天 14:15',
    questionCount: 75,
    correctRate: 72,
    duration: '65分钟',
  },
  {
    id: '3',
    title: '每日一练 · 核心精选题',
    time: '3天前',
    questionCount: 5,
    correctRate: 100,
    duration: '3分钟',
  },
])
</script>

<style scoped lang="scss">
.records-page {
  min-height: 100vh;
  background: var(--gray-1);
}

.nav-bar {
  height: 48px;
  background: var(--gray-0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--gray-2);
  position: sticky;
  top: 0;
  z-index: 50;

  .back {
    font-size: 24px;
    color: var(--gray-7);
    cursor: pointer;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .right {
    width: 24px;
  }
}

.records-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:active {
    box-shadow: var(--shadow-md);
  }

  .rc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .rc-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .rc-time {
      font-size: 12px;
      color: var(--gray-5);
    }
  }

  .rc-meta {
    display: flex;
    gap: 14px;
    font-size: 13px;
    color: var(--gray-6);

    .rc-rate {
      color: var(--success);
      font-weight: 600;
    }
  }
}
</style>
