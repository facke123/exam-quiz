<template>
  <div class="subject-page">
    <van-nav-bar title="选择科目" left-arrow @click-left="$router.back()" />

    <div class="intro">
      <h2 class="intro-title">选择你的考试科目</h2>
      <p class="intro-desc">我们将为你推荐匹配的题库与考点</p>
    </div>

    <div class="level-tabs">
      <van-tabs v-model:active="activeLevel" shrink color="#6366F1" @change="filterByLevel">
        <van-tab v-for="lv in levels" :key="lv" :title="lv" />
      </van-tabs>
    </div>

    <div class="subject-list">
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="subject-card"
        :class="{ active: item.id === currentId }"
        @click="onSelect(item.id)"
      >
        <span class="sub-icon">{{ item.icon }}</span>
        <div class="sub-info">
          <p class="sub-name">{{ item.name }}</p>
          <p class="sub-meta">{{ item.level }} · {{ item.category }}</p>
          <p v-if="item.examDate" class="sub-exam">考试：{{ item.examDate }}</p>
        </div>
        <van-icon v-if="item.id === currentId" name="success" class="check-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'

const router = useRouter()
const subjectStore = useSubjectStore()

const levels = ['全部', '初级', '中级', '高级']
const activeLevel = ref('全部')
const currentId = ref(subjectStore.currentSubjectId)

const filteredList = computed(() => {
  if (activeLevel.value === '全部') return subjectStore.subjectList
  return subjectStore.subjectList.filter((s) => s.level === activeLevel.value)
})

function filterByLevel() {
  // 仅触发响应式更新
}

function onSelect(id: string) {
  subjectStore.switchSubject(id)
  currentId.value = id
  showToast({ type: 'success', message: '已切换科目' })
  setTimeout(() => router.back(), 600)
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.subject-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.intro {
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
}

.intro-title {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
}

.intro-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}

.level-tabs {
  background: var(--bg-card);
  margin-bottom: var(--space-lg);
}

.subject-list {
  padding: 0 var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.subject-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-card);
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);

  &.active {
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.06);
    .check-icon {
      color: var(--color-primary);
    }
  }
}

.sub-icon {
  font-size: 32px;
}

.sub-info {
  flex: 1;
}

.sub-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.sub-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}

.sub-exam {
  font-size: 11px;
  color: var(--color-warning);
  margin-top: 2px;
}

.check-icon {
  font-size: 22px;
  color: var(--text-placeholder);
}
</style>
