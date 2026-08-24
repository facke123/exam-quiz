<template>
  <div class="subject-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        选择考试科目
      </div>
      <div class="right" />
    </div>

    <div
      v-if="subjectStore.loading"
      class="loading-state"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        加载科目列表中...
      </van-loading>
    </div>

    <div
      v-else-if="subjects.length === 0"
      class="empty-state"
    >
      <van-empty description="暂无可用的考试科目" />
    </div>

    <div
      v-else
      class="subject-list"
    >
      <div
        v-for="sub in subjects"
        :key="sub.id"
        class="subject-card"
        :class="{ active: String(sub.id) === String(currentSubjectId) }"
        @click="onSelect(sub)"
      >
        <div
          class="sc-icon"
          :style="{ background: sub.bg || 'var(--primary-bg)' }"
        >
          {{ sub.icon || '💻' }}
        </div>
        <div class="sc-info">
          <div class="sc-name">
            {{ sub.name }}
          </div>
          <div class="sc-meta">
            {{ sub.level }} · {{ sub.questionCount || 0 }}题
          </div>
        </div>
        <div
          v-if="String(sub.id) === String(currentSubjectId)"
          class="sc-check"
        >
          ✓
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'

const router = useRouter()
const subjectStore = useSubjectStore()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const subjects = computed(() => subjectStore.subjectList)
const currentSubjectId = computed(() => subjectStore.currentSubjectId)

onMounted(async () => {
  if (subjectStore.subjectList.length === 0) {
    await subjectStore.fetchSubjects()
  }
})

function onSelect(sub: any) {
  subjectStore.switchSubject(sub.id)
  showToast({
    type: 'success',
    message: `已切换至：${sub.name}`,
  })
  setTimeout(() => {
    router.back()
  }, 400)
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

.loading-state,
.empty-state {
  padding: 40px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
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
