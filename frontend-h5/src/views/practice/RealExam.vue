<template>
  <div class="real-exam-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        历年真题
      </div>
      <div class="right-subj" @click="$router.push('/subject/picker')">
        <span>{{ currentSubjectName }}</span>
        <span class="change-icon">⇄</span>
      </div>
    </div>

    <!-- 年份与类型筛选 -->
    <div v-if="yearList.length > 1" class="filter-header">
      <div
        v-for="y in yearList"
        :key="y"
        class="filter-tab"
        :class="{ active: currentYear === y }"
        @click="currentYear = y"
      >
        {{ y }}
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="state-container">
      <van-loading type="spinner" color="var(--primary)" vertical>
        正在加载历年真题试卷...
      </van-loading>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="filteredExams.length === 0" class="state-container">
      <van-empty description="当前科目暂无已收录的历年真题">
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

    <!-- 真题试卷列表 -->
    <div v-else class="exam-list">
      <div
        v-for="exam in filteredExams"
        :key="exam.id"
        class="exam-card"
        @click="enterExam(exam)"
      >
        <div class="ec-left">
          <div class="ec-year">
            {{ exam.year }}
          </div>
          <div class="ec-season">
            {{ exam.season || '真题' }}
          </div>
        </div>
        <div class="ec-info">
          <div class="ec-title">
            {{ exam.name }}
          </div>
          <div class="ec-meta">
            <span class="ec-tag">{{ getPaperTypeLabel(exam) }}</span>
            <span>⏱️ {{ exam.duration || exam.totalTime || 150 }}分钟</span>
            <span>📝 {{ exam.questionCount || 0 }}题</span>
          </div>
          <div class="ec-sub-meta">
            <span>满分 {{ exam.totalScore || 75 }}分</span>
            <span class="sep">·</span>
            <span class="pass-text">{{ exam.passScore || Math.round((exam.totalScore || 75) * 0.6) }}分及格</span>
          </div>
        </div>
        <div class="ec-btn">
          开始
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
const paperList = ref<PaperItem[]>([])
const currentYear = ref('全部')

// 动态提取年份列表
const yearList = computed(() => {
  const years = new Set<string>()
  paperList.value.forEach((p) => {
    if (p.year) {
      years.add(`${p.year}年`)
    }
  })
  if (years.size === 0) return ['全部']
  const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a))
  return ['全部', ...sortedYears]
})

const filteredExams = computed(() => {
  if (currentYear.value === '全部') return paperList.value
  const y = currentYear.value.replace('年', '')
  return paperList.value.filter((e) => String(e.year) === y)
})

function getPaperTypeLabel(exam: PaperItem) {
  if (exam.name.includes('案例')) return '案例分析'
  if (exam.name.includes('论文')) return '论文专科'
  if (exam.name.includes('下午')) return '下午试题'
  if (exam.name.includes('综合') || exam.name.includes('上午')) return '上午综合'
  return '历年真题'
}

async function fetchRealPapers() {
  loading.value = true
  try {
    const res = await getPaperList({
      subjectId: subjectStore.currentSubjectId,
      type: 'real',
      pageSize: 100,
    })
    if (res?.data?.list) {
      paperList.value = res.data.list
    } else if (Array.isArray(res?.data)) {
      paperList.value = res.data
    } else {
      paperList.value = []
    }
  } catch {
    paperList.value = []
  } finally {
    loading.value = false
  }
}

function enterExam(exam: PaperItem) {
  router.push(
    `/quiz/real?examId=${exam.id}&paperId=${exam.id}&subjectId=${exam.subjectId || subjectStore.currentSubjectId}&duration=${exam.duration || 150}&title=${encodeURIComponent(exam.name)}`
  )
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    currentYear.value = '全部'
    fetchRealPapers()
  }
)

onMounted(() => {
  fetchRealPapers()
})
</script>

<style scoped lang="scss">
.real-exam-page {
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

.filter-header {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .filter-tab {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 13px;
    color: var(--gray-6);
    background: var(--gray-2);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    &.active {
      background: var(--primary-bg);
      color: var(--primary);
      font-weight: 700;
    }
  }
}

.state-container {
  padding: 60px 16px;
  text-align: center;
}

.exam-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exam-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.99);
    box-shadow: var(--shadow-md);
  }

  .ec-left {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: var(--primary-bg);
    color: var(--primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .ec-year {
      font-size: 13px;
      font-weight: 800;
      line-height: 1.1;
    }

    .ec-season {
      font-size: 10px;
      opacity: 0.85;
      margin-top: 2px;
    }
  }

  .ec-info {
    flex: 1;
    min-width: 0;

    .ec-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .ec-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--gray-5);
      margin-top: 5px;

      .ec-tag {
        color: var(--primary);
        font-weight: 600;
        background: var(--primary-bg);
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 11px;
      }
    }

    .ec-sub-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--gray-4);
      margin-top: 4px;

      .sep {
        color: var(--gray-3);
      }

      .pass-text {
        color: var(--success);
        font-weight: 500;
      }
    }
  }

  .ec-btn {
    background: var(--primary);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 14px;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }
}
</style>
