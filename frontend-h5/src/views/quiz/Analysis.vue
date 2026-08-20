<template>
  <div class="analysis-page">
    <van-nav-bar title="题目解析" left-arrow @click-left="$router.back()" />

    <div v-if="analysis" class="analysis-body">
      <AnalysisCard
        :my-answer="analysis.myAnswer"
        :correct-answer="analysis.correctAnswer"
        :analysis="analysis.analysis"
        :ai-analysis="analysis.aiAnalysis"
        :knowledge-points="analysis.knowledgePoints"
      />

      <!-- 题目原文 -->
      <div class="section-card card">
        <h4 class="title">题目原文</h4>
        <QuestionCard :question="analysis.question" :show-result="true" />
      </div>

      <!-- 底部操作 -->
      <div class="action-row">
        <van-button plain icon="edit" type="primary" size="small" @click="onNote">写笔记</van-button>
        <van-button plain icon="warning-o" type="danger" size="small" @click="onReport">报错</van-button>
        <van-button plain icon="share-o" type="primary" size="small" @click="onShare">分享</van-button>
      </div>
    </div>

    <LoadingState v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { getAnalysis } from '@/api/question'
import { addNote, feedback } from '@/api/user'
import AnalysisCard from '@/components/AnalysisCard.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const analysis = ref<Awaited<ReturnType<typeof getAnalysis>>['data'] | null>(null)

function onNote() {
  showDialog({
    title: '写笔记',
    message: '该功能开发中',
    showCancelButton: true
  })
}

function onReport() {
  showDialog({
    title: '题目报错',
    message: '请描述问题',
    showCancelButton: true,
    confirmButtonText: '提交'
  }).then(() => {
    feedback({ type: 'error', content: '题目有误', questionId: route.params.id as string })
    showToast({ type: 'success', message: '已提交' })
  }).catch(() => {})
}

function onShare() {
  showToast('已复制链接')
}

onMounted(async () => {
  try {
    const res = await getAnalysis(route.params.id as string)
    analysis.value = res.data
  } catch {
    analysis.value = {
      question: {
        id: 'q1',
        type: 'single',
        title: '在软件开发过程中，瀑布模型的主要优点是什么？',
        options: [
          { key: 'A', content: '需求明确，阶段清晰' },
          { key: 'B', content: '灵活应对需求变更' },
          { key: 'C', content: '快速交付原型' },
          { key: 'D', content: '支持迭代开发' }
        ],
        analysis: '瀑布模型强调阶段顺序。',
        answer: 'A',
        knowledgePoint: '软件工程',
        difficulty: 2,
        score: 1
      },
      correctAnswer: 'A',
      analysis: '瀑布模型是一种线性顺序的软件开发模型，强调阶段清晰、文档完善，适用于需求明确的项目。',
      aiAnalysis:
        '该题考查软件开发生命周期模型的基础知识。瀑布模型由 W. Royce 提出，核心特点是阶段顺序执行、文档驱动。掌握各种模型的适用场景是软考重点。',
      knowledgePoints: ['软件工程', '开发模型', '瀑布模型'],
      myAnswer: 'B'
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.analysis-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.analysis-body {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.section-card {
  padding: var(--space-lg);

  .title {
    font-size: var(--font-size-md);
    margin-bottom: var(--space-md);
    color: var(--text-primary);
  }
}

.action-row {
  display: flex;
  justify-content: space-around;
  gap: var(--space-sm);

  :deep(.van-button) {
    flex: 1;
    border-radius: var(--radius-full);
  }
}
</style>
