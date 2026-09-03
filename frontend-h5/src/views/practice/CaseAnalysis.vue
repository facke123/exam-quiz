<template>
  <div class="case-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        案例分析
      </div>
      <div class="right">
        {{ currentCaseIdx + 1 }}/{{ caseList.length }}
      </div>
    </div>

    <div class="quiz-body">
      <span class="question-type-tag">案例分析题</span>
      <div class="case-hint">
        📖 阅读以下案例材料，回答下方问题
      </div>

      <!-- 案例背景材料 -->
      <div class="analysis-content">
        <div class="ac-body">
          <p class="case-sub-title">
            <strong>【案例背景】</strong>
          </p>
          <p>{{ currentCase.background }}</p>
          <div class="case-points">
            <p
              v-for="(p, i) in currentCase.points"
              :key="i"
            >
              {{ i + 1 }}. {{ p }}
            </p>
          </div>
          <p class="case-summary">
            {{ currentCase.summary }}
          </p>
        </div>
      </div>

      <!-- 问答列表 -->
      <div
        v-for="(q, idx) in currentCase.questions"
        :key="idx"
        class="question-box"
      >
        <div class="q-title">
          问题{{ idx + 1 }}：{{ q.title }}（{{ q.score }}分）
        </div>
        <textarea
          v-model="answers[idx]"
          class="subjective-input"
          placeholder="请输入你的作答要点..."
          rows="4"
        />
        <div class="subjective-hint">
          {{ (answers[idx] || '').length }} / 1000字
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="quiz-footer">
      <div
        class="footer-icon"
        :class="{ active: isFavorited }"
        @click="onToggleFavorite"
      >
        <span>{{ isFavorited ? '⭐' : '☆' }}</span>
        <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
      </div>
      <div
        class="footer-icon"
        @click="notePopupVisible = true"
      >
        <span>📓</span>
        <span>笔记</span>
      </div>
      <button
        class="btn-submit"
        @click="onSubmit"
      >
        提交答案
      </button>
    </div>

    <!-- 题目笔记弹窗 -->
    <NotePopup
      v-model:show="notePopupVisible"
      :question-id="currentCase?.id"
      :question-title="currentCase?.background || '案例分析题'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { useQuizStore } from '@/stores/quiz'
import { getQuestions, type Question } from '@/api/question'
import NotePopup from '@/components/NotePopup.vue'

const router = useRouter()
const subjectStore = useSubjectStore()
const quizStore = useQuizStore()

const currentCaseIdx = ref(0)
const answers = ref<Record<number, string>>({})
const loading = ref(false)
const notePopupVisible = ref(false)

const isFavorited = computed(() => {
  return currentCase.value ? quizStore.isFavorited(currentCase.value.id) : false
})

async function onToggleFavorite() {
  if (currentCase.value) {
    const isNowFav = await quizStore.toggleFavorite(currentCase.value.id)
    showToast(isNowFav ? '已加入收藏' : '已取消收藏')
  }
}

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

interface CaseModel {
  id: string
  background: string
  points: string[]
  summary: string
  questions: Array<{ title: string; score: number }>
  analysis?: string
}

const defaultCases: CaseModel[] = [
  {
    id: '1',
    background: '某公司承接了一个信息化集成项目，项目预算500万元，工期6个月。项目经理在项目启动后，制定了详细的项目计划，但在执行过程中发现：',
    points: [
      '客户频繁变更需求，导致项目范围不断扩大；',
      '团队成员对需求理解不一致，产生严重返工；',
      '进度已经延误2周，成本超支10%。',
    ],
    summary: '项目经理认为主要原因是需求管理不当，需要重新梳理项目范围与变更管理流程。',
    questions: [
      { title: '请指出该项目在项目范围管理方面存在哪些问题？', score: 10 },
      { title: '针对上述问题，请给出具体的改进建议与应对措施。', score: 10 },
    ],
    analysis: '【参考要点】1. 缺少规范的变更控制流程（CCB审批机制缺失）；2. 范围说明书定义不清晰；3. 需求跟踪矩阵缺失；4. 应对客户做好需求基线控制。',
  },
]

const caseList = ref<CaseModel[]>(defaultCases)

const currentCase = computed<CaseModel>(() => {
  return caseList.value[currentCaseIdx.value] || defaultCases[0]
})

async function fetchCaseQuestions() {
  loading.value = true
  try {
    const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
    const res = await getQuestions({
      subjectId: subId,
      type: 'case',
      count: 10,
    })
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const parsedCases: CaseModel[] = res.data.map((q: Question, idx: number) => {
        const text = q.title || ''
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
        const bg = lines.length > 0 ? lines[0] : text
        const pts = lines.length > 1 ? lines.slice(1) : ['请结合项目管理知识，分析材料并给出解决方案。']
        return {
          id: String(q.id || idx + 1),
          background: bg,
          points: pts,
          summary: '请根据上述实际背景，进行专业分析作答。',
          questions: [
            { title: '请指出背景材料中存在的关键问题并说明原因', score: 10 },
            { title: '针对上述问题，请列出具体的改进措施与解决方案', score: 10 },
          ],
          analysis: q.analysis || '【参考解析】详见官方大纲及教材标准考点。',
        }
      })
      caseList.value = parsedCases
    }
  } catch {
    // fallback to default
  } finally {
    loading.value = false
  }
}

function onSubmit() {
  const current = currentCase.value
  showDialog({
    title: '作答已提交',
    message: current.analysis || '【参考要点】1. 缺少规范的变更控制流程；2. 范围说明书定义不清晰；3. 需求跟踪矩阵缺失。已为您记录本次答卷！',
  })
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    fetchCaseQuestions()
  }
)

onMounted(() => {
  quizStore.fetchFavorites()
  fetchCaseQuestions()
})
</script>

<style scoped lang="scss">
.case-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 80px;
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
    font-size: 13px;
    color: var(--gray-5);
  }
}

.quiz-body {
  padding: 14px;
}

.question-type-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--pink-bg);
  color: var(--pink);
}

.case-hint {
  font-size: 13px;
  color: var(--gray-5);
  margin: 8px 0 10px;
}

.analysis-content {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;

  .ac-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--gray-8);
    background: var(--gray-1);
    padding: 12px 14px;
    border-radius: var(--radius-xs);
    border-left: 3px solid var(--pink);

    .case-sub-title {
      color: var(--gray-9);
      margin-bottom: 4px;
    }

    .case-points {
      margin: 6px 0;
      color: var(--gray-7);
    }

    .case-summary {
      color: var(--gray-6);
      font-size: 13px;
    }
  }
}

.question-box {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 14px;

  .q-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 10px;
    line-height: 1.5;
  }
}

.subjective-input {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--gray-3);
  font-size: 14px;
  line-height: 1.6;
  background: var(--gray-1);
  box-sizing: border-box;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: var(--primary);
    background: var(--gray-0);
  }
}

.subjective-hint {
  font-size: 11px;
  color: var(--gray-5);
  text-align: right;
  margin-top: 4px;
}

.quiz-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--gray-0);
  border-top: 1px solid var(--gray-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;

  .footer-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    color: var(--gray-5);
    cursor: pointer;

    span:first-child {
      font-size: 18px;
    }

    &.active {
      color: var(--primary);
    }
  }

  .btn-submit {
    background: var(--primary);
    color: #fff;
    border: none;
    height: 38px;
    padding: 0 24px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 10px var(--primary-glow);
  }
}
</style>
