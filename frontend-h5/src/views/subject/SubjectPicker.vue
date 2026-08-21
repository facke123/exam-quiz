<template>
  <div class="subject-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">选择考试科目</div>
      <div class="right"></div>
    </div>

    <div class="subject-list">
      <div
        v-for="sub in subjects"
        :key="sub.id"
        class="subject-card"
        :class="{ active: sub.name === currentSubjectName }"
        @click="onSelect(sub)"
      >
        <div class="sc-icon" :style="{ background: sub.bg }">{{ sub.icon }}</div>
        <div class="sc-info">
          <div class="sc-name">{{ sub.name }}</div>
          <div class="sc-meta">{{ sub.level }} · {{ sub.questionCount }}题</div>
        </div>
        <div v-if="sub.name === currentSubjectName" class="sc-check">✓</div>
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

const currentSubjectName = computed(
  () => subjectStore.currentSubject?.name || '系统集成项目管理工程师'
)

const subjects = ref([
  { id: '1', name: '系统集成项目管理工程师', level: '中级', questionCount: 385, icon: '💻', bg: 'var(--primary-bg)' },
  { id: '2', name: '信息系统项目管理师', level: '高级', questionCount: 520, icon: '📊', bg: 'var(--success-bg)' },
  { id: '3', name: '信息系统监理师', level: '中级', questionCount: 320, icon: '🏗️', bg: 'var(--warning-bg)' },
  { id: '4', name: '系统架构设计师', level: '高级', questionCount: 460, icon: '🔒', bg: 'var(--purple-bg)' },
  { id: '5', name: '软件设计师', level: '中级', questionCount: 480, icon: '💻', bg: 'var(--primary-bg)' },
  { id: '6', name: '网络工程师', level: '中级', questionCount: 390, icon: '🌐', bg: 'var(--cyan-bg)' },
  { id: '7', name: '程序员', level: '初级', questionCount: 260, icon: '⌨️', bg: 'var(--gray-2)' },
])

function onSelect(sub: any) {
  subjectStore.switchSubject(sub.id)
  showToast({
    type: 'success',
    message: `已切换至：${sub.name}`,
  })
  setTimeout(() => {
    router.back()
  }, 600)
}
</script>

<style scoped lang="scss">
.subject-page {
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

.subject-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subject-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  transition: all 0.2s;

  &.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  &:active {
    box-shadow: var(--shadow-md);
  }

  .sc-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .sc-info {
    flex: 1;

    .sc-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .sc-meta {
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 3px;
    }
  }

  .sc-check {
    color: var(--primary);
    font-size: 20px;
    font-weight: 800;
  }
}
</style>
