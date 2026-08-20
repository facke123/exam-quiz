<template>
  <div class="records-page">
    <van-nav-bar title="做题记录" left-arrow @click-left="$router.back()" />

    <div class="filter-row">
      <van-tabs v-model:active="activeTab" shrink color="#6366F1" @change="loadList">
        <van-tab title="全部" name="all" />
        <van-tab title="章节练习" name="chapter" />
        <van-tab title="真题" name="real" />
        <van-tab title="模拟" name="mock" />
      </van-tabs>
    </div>

    <div class="records-list">
      <div
        v-for="r in list"
        :key="r.id"
        class="record-card"
        @click="$router.push(`/quiz/report/${r.id}`)"
      >
        <div class="rec-left">
          <div class="mode-tag" :class="r.mode">{{ modeText(r.mode) }}</div>
        </div>
        <div class="rec-info">
          <p class="rec-title">{{ r.subjectName }}</p>
          <div class="rec-meta">
            <span>{{ formatDate(r.createdAt, 'MM-DD HH:mm') }}</span>
            <span class="dot">·</span>
            <span>{{ formatDurationText(r.duration) }}</span>
          </div>
        </div>
        <div class="rec-score">
          <p class="score-num" :class="{ pass: r.correctRate >= 0.6 }">
            {{ r.correctRate >= 0.6 ? r.score : Math.round(r.correctRate * 100) }}
          </p>
          <p class="score-label">{{ r.correctRate >= 0.6 ? '分' : '%' }}</p>
        </div>
      </div>
    </div>

    <EmptyState v-if="!list.length" text="暂无做题记录" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRecords, type RecordItem } from '@/api/user'
import { formatDate, formatDurationText } from '@/utils/format'
import EmptyState from '@/components/EmptyState.vue'

const activeTab = ref('all')
const list = ref<RecordItem[]>([])

function modeText(mode: string): string {
  const map: Record<string, string> = {
    chapter: '章节',
    real: '真题',
    mock: '模拟',
    daily: '每日',
    case: '案例'
  }
  return map[mode] || mode
}

async function loadList() {
  try {
    const res = await getRecords({ page: 1, pageSize: 30, mode: activeTab.value === 'all' ? undefined : activeTab.value })
    list.value = res.data.list
  } catch {
    list.value = [
      { id: '1', mode: 'chapter', subjectName: '第3章 操作系统', score: 85, total: 100, correctRate: 0.85, duration: 1800, createdAt: '2026-08-19T10:30:00' },
      { id: '2', mode: 'mock', subjectName: '模拟卷一', score: 72, total: 100, correctRate: 0.72, duration: 5400, createdAt: '2026-08-18T14:00:00' },
      { id: '3', mode: 'daily', subjectName: '每日一练', score: 8, total: 10, correctRate: 0.8, duration: 600, createdAt: '2026-08-17T09:15:00' }
    ]
  }
}

onMounted(loadList)
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.records-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.filter-row {
  background: var(--bg-card);
}

.records-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.record-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.rec-left {
  flex-shrink: 0;
}

.mode-tag {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  @include flex-center;
  font-size: 11px;
  font-weight: 600;

  &.chapter { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
  &.real { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  &.mock { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  &.daily { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
  &.case { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
}

.rec-info {
  flex: 1;
}

.rec-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.rec-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;

  .dot {
    color: var(--border-light);
  }
}

.rec-score {
  text-align: center;
}

.score-num {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);

  &.pass {
    color: var(--color-success);
  }
}

.score-label {
  font-size: 10px;
  color: var(--text-secondary);
}
</style>
