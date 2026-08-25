<template>
  <div class="mock-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        全真模拟考试
      </div>
      <div class="right-subj" @click="$router.push('/subject/picker')">
        <span>{{ currentSubjectName }}</span>
        <span class="change-icon">⇄</span>
      </div>
    </div>

    <!-- 顶部横幅 -->
    <div class="mock-hero">
      <div class="mh-icon">
        ⏱️
      </div>
      <div class="mh-info">
        <div class="mh-title">
          全真考场模拟
        </div>
        <div class="mh-desc">
          仿真出题 · 严格限时 · 考后精准估分
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="state-container">
      <van-loading type="spinner" color="var(--primary)" vertical>
        正在加载模拟试卷...
      </van-loading>
    </div>

    <!-- 空数据 -->
    <div v-else-if="mocks.length === 0" class="state-container">
      <van-empty description="当前科目暂无模拟试卷">
        <van-button
          type="primary"
          size="small"
          round
          @click="$router.push('/subject/picker')"
        >
          切换其他科目
        </van-button>
      </van-empty>
    </div>

    <!-- 模拟卷列表 -->
    <div v-else class="mock-list">
      <div
        v-for="mock in mocks"
        :key="mock.id"
        class="mock-card"
        @click="enterMock(mock)"
      >
        <div class="mc-head">
          <div class="mc-title">
            {{ mock.name }}
          </div>
          <span class="mc-tag new">全真模拟</span>
        </div>
        <div class="mc-desc">
          {{ mock.description || `考试时长 ${mock.duration || 150} 分钟，满分 ${mock.totalScore || 75} 分，及格线 ${mock.passScore || 45} 分` }}
        </div>
        <div class="mc-footer">
          <div class="mc-meta">
            <span>⏱️ {{ mock.duration || mock.totalTime || 150 }}分钟</span>
            <span>📝 {{ mock.questionCount || 0 }}题</span>
            <span>🎯 满分{{ mock.totalScore || 75 }}分</span>
          </div>
          <button class="mc-btn">
            开始模考
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { getPaperList, type PaperItem } from '@/api/exam'

const router = useRouter()
const subjectStore = useSubjectStore()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const currentSubjectName = computed(() => {
  return subjectStore.currentSubject?.name || '系统集成管理工程师'
})

const loading = ref(false)
const mocks = ref<PaperItem[]>([])

async function fetchMockPapers() {
  loading.value = true
  try {
    const res = await getPaperList({
      subjectId: subjectStore.currentSubjectId,
      type: 'mock',
      pageSize: 50,
    })
    if (res?.data?.list) {
      mocks.value = res.data.list
    } else if (Array.isArray(res?.data)) {
      mocks.value = res.data
    } else {
      mocks.value = []
    }
  } catch {
    mocks.value = []
  } finally {
    loading.value = false
  }
}

function enterMock(mock: PaperItem) {
  router.push(
    `/quiz/mock?examId=${mock.id}&paperId=${mock.id}&subjectId=${mock.subjectId || subjectStore.currentSubjectId}&duration=${mock.duration || 150}&title=${encodeURIComponent(mock.name)}`
  )
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    fetchMockPapers()
  }
)

onMounted(() => {
  fetchMockPapers()
})
</script>

<style scoped lang="scss">
.mock-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 40px;
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
    line-height: 1;
    width: 24px;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .right-subj {
    font-size: 12px;
    color: var(--primary);
    background: var(--primary-bg);
    padding: 3px 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .change-icon {
      font-size: 13px;
    }
  }
}

.mock-hero {
  margin: 14px;
  background: linear-gradient(140deg, #6366f1 0%, #7c3aed 100%);
  border-radius: var(--radius);
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-md);

  .mh-icon {
    font-size: 32px;
  }

  .mh-title {
    font-size: 18px;
    font-weight: 800;
  }

  .mh-desc {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }
}

.state-container {
  padding: 60px 16px;
  text-align: center;
}

.mock-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.99);
  }

  .mc-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .mc-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .mc-tag.new {
      font-size: 10px;
      font-weight: 700;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  .mc-desc {
    font-size: 12px;
    color: var(--gray-5);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .mc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;

    .mc-meta {
      display: flex;
      gap: 10px;
      font-size: 11px;
      color: var(--gray-5);
    }

    .mc-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
    }
  }
}
</style>
