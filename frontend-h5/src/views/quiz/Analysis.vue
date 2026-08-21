<template>
  <div class="analysis-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">题目解析</div>
      <div class="right">{{ currentIndex + 1 }}/{{ totalCount }}</div>
    </div>

    <div v-if="analysis" class="analysis-body">
      <div class="analysis-result-card">
        <!-- 结果横幅 -->
        <div class="result-banner" :class="isCorrect ? 'correct' : 'wrong'">
          <div class="rb-icon">{{ isCorrect ? '✓' : '✗' }}</div>
          <div class="rb-text">{{ isCorrect ? '回答正确' : '回答错误' }}</div>
        </div>

        <span class="question-type-tag">{{ typeText }}</span>
        <div class="question-content">{{ analysis.question?.title }}</div>

        <!-- 选项对比 -->
        <div class="options-list">
          <div
            v-for="opt in analysis.question?.options || []"
            :key="opt.key"
            class="option-item"
            :class="{
              correct: isOptionCorrect(opt.key),
              wrong: isOptionWrong(opt.key),
            }"
          >
            <div class="opt-letter">{{ opt.key }}</div>
            <div class="opt-text">{{ opt.content }}</div>
            <div v-if="isOptionCorrect(opt.key)" class="opt-icon correct">✓</div>
            <div v-else-if="isOptionWrong(opt.key)" class="opt-icon wrong">✗</div>
          </div>
        </div>

        <!-- 标准解析 -->
        <div class="analysis-content">
          <div class="ac-label">💡 正确答案</div>
          <div class="ac-body">
            <strong>{{ Array.isArray(analysis.correctAnswer) ? analysis.correctAnswer.join(', ') : analysis.correctAnswer }}</strong>
            <span v-if="analysis.myAnswer" class="my-ans" :class="{ wrong: !isCorrect }">
              （你的答案：{{ Array.isArray(analysis.myAnswer) ? analysis.myAnswer.join(', ') : analysis.myAnswer }}）
            </span>
          </div>

          <div class="ac-label">📖 试题解析</div>
          <div class="ac-body">{{ analysis.analysis }}</div>

          <div v-if="analysis.knowledgePoints?.length" class="ac-label">🏷️ 核心考点</div>
          <div v-if="analysis.knowledgePoints?.length" class="tag-row">
            <span v-for="kp in analysis.knowledgePoints" :key="kp" class="tag">{{ kp }}</span>
          </div>
        </div>
      </div>

      <!-- AI 深度分析卡片 -->
      <div class="ai-analysis-card">
        <div class="ai-analysis-header">
          <div class="ai-icon">🤖</div>
          <div class="ai-title-wrap">
            <div class="ai-title">AI 智能深度解析</div>
            <div class="ai-sub">基于大模型智能解析 · 个性化解题思路</div>
          </div>
          <div class="ai-badge" @click="onRegenAI">↻ 重新生成</div>
        </div>

        <div class="ai-analysis-body">
          <div class="ai-section">
            <div class="ai-section-label">📊 题目难度评估</div>
            <div class="ai-difficulty">
              <span class="diff-label">难度等级</span>
              <div class="diff-stars">
                <span class="diff-star active">★</span>
                <span class="diff-star active">★</span>
                <span class="diff-star active">★</span>
                <span class="diff-star">☆</span>
                <span class="diff-star">☆</span>
              </div>
              <span class="diff-rate">正确率 68%</span>
            </div>
          </div>

          <div class="ai-section">
            <div class="ai-section-label">🧠 AI 解题思路与技巧</div>
            <div class="ai-section-text">
              本题考查核心知识点的掌握。解题关键在于准确把握概念本质与典型特征。<br /><br />
              💡 <strong>解题技巧</strong>：排除法与概念特征对比是提高答题速度和准确率的有效方法。
            </div>
          </div>

          <div class="ai-section">
            <div class="ai-section-label">⚠️ 易错点剖析</div>
            <div class="ai-mistake-item">
              <div class="mi-icon">!</div>
              <div class="mi-text">容易混淆相近概念的适用边界，注意审清题干的限定词与否定式问法。</div>
            </div>
          </div>

          <div class="ai-section">
            <div class="ai-section-label">📚 AI 学习与备考建议</div>
            <div class="ai-suggest-item">
              <div class="si-icon">1</div>
              <div class="si-text">建议回顾该章节核心考点思维导图，理清脉络。</div>
            </div>
            <div class="ai-suggest-item">
              <div class="si-icon">2</div>
              <div class="si-text">错题已自动加入艾宾浩斯智能复习库，系统将在最佳遗忘节点提醒复习。</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作条 -->
    <div class="quiz-footer">
      <div class="footer-icon" :class="{ active: favorited }" @click="favorited = !favorited">
        <span>{{ favorited ? '⭐' : '☆' }}</span>
        <span>{{ favorited ? '已收藏' : '收藏' }}</span>
      </div>
      <div class="footer-icon" @click="onNote">
        <span>📓</span>
        <span>笔记</span>
      </div>
      <button class="btn-submit" @click="$router.push('/quiz/report/1')">查看报告</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getAnalysis } from '@/api/question'
import { questionTypeText } from '@/utils/format'

const route = useRoute()
const currentIndex = ref(0)
const totalCount = ref(10)
const favorited = ref(false)

const analysis = ref<any>(null)

const isCorrect = computed(() => {
  if (!analysis.value) return false
  const { myAnswer, correctAnswer } = analysis.value
  if (Array.isArray(correctAnswer) && Array.isArray(myAnswer)) {
    return correctAnswer.sort().join(',') === myAnswer.sort().join(',')
  }
  return myAnswer === correctAnswer
})

const typeText = computed(() => questionTypeText(analysis.value?.question?.type || 'single'))

function isOptionCorrect(key: string) {
  const ans = analysis.value?.correctAnswer
  if (Array.isArray(ans)) return ans.includes(key)
  return ans === key
}

function isOptionWrong(key: string) {
  const my = analysis.value?.myAnswer
  const isSelected = Array.isArray(my) ? my.includes(key) : my === key
  return isSelected && !isOptionCorrect(key)
}

function onRegenAI() {
  showToast('AI 正在重新生成解析...')
}

function onNote() {
  showDialog({
    title: '添加题目笔记',
    message: '笔记已保存至“我的笔记”。',
  })
}

onMounted(async () => {
  try {
    const res = await getAnalysis(route.params.id as string)
    analysis.value = res.data
  } catch {
    analysis.value = {
      question: {
        id: '1',
        type: 'single',
        title: '在项目生命周期中，哪个阶段的项目成本和人员投入水平通常最高？',
        options: [
          { key: 'A', content: '启动阶段' },
          { key: 'B', content: '执行阶段' },
          { key: 'C', content: '规划阶段' },
          { key: 'D', content: '收尾阶段' },
        ],
      },
      correctAnswer: 'B',
      myAnswer: 'B',
      analysis:
        '在项目生命周期的执行阶段，项目成本和人员投入水平通常达到最高。执行阶段是项目资源投入最多的阶段，大部分预算和人力都集中在此阶段完成实际交付。启动和收尾阶段资源投入相对较低。',
      knowledgePoints: ['项目生命周期', '执行阶段', '资源投入模型'],
    }
  }
})
</script>

<style scoped lang="scss">
.analysis-page {
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

.analysis-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.analysis-result-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);
}

.result-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
  font-weight: 700;
  font-size: 15px;

  &.correct {
    background: var(--success-bg);
    color: var(--success);
  }

  &.wrong {
    background: var(--danger-bg);
    color: var(--danger);
  }

  .rb-icon {
    font-size: 18px;
  }
}

.question-type-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--primary-bg);
  color: var(--primary);
  margin-bottom: 8px;
}

.question-content {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
  color: var(--gray-9);
  margin-bottom: 14px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--gray-1);
  border: 1.5px solid var(--gray-3);
  border-radius: var(--radius-sm);

  .opt-letter {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--gray-2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
  }

  .opt-text {
    flex: 1;
    font-size: 14px;
    color: var(--gray-8);
  }

  &.correct {
    border-color: var(--success);
    background: var(--success-bg);

    .opt-letter {
      background: var(--success);
      color: #fff;
    }

    .opt-icon {
      color: var(--success);
      font-weight: 800;
    }
  }

  &.wrong {
    border-color: var(--danger);
    background: var(--danger-bg);

    .opt-letter {
      background: var(--danger);
      color: #fff;
    }

    .opt-icon {
      color: var(--danger);
      font-weight: 800;
    }
  }
}

.analysis-content {
  border-top: 1px solid var(--gray-2);
  padding-top: 14px;

  .ac-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--gray-7);
    margin-bottom: 6px;
    margin-top: 12px;

    &:first-child {
      margin-top: 0;
    }
  }

  .ac-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--gray-8);
    background: var(--gray-1);
    padding: 10px 12px;
    border-radius: var(--radius-xs);
    border-left: 3px solid var(--primary);

    .my-ans {
      font-size: 13px;
      margin-left: 8px;

      &.wrong {
        color: var(--danger);
      }
    }
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;

    .tag {
      font-size: 12px;
      background: var(--purple-bg);
      color: var(--purple);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 500;
    }
  }
}

/* AI 深度分析卡片 */
.ai-analysis-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(99, 102, 241, 0.2);

  .ai-analysis-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;

    .ai-icon {
      font-size: 24px;
    }

    .ai-title-wrap {
      flex: 1;

      .ai-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--primary-dark);
      }

      .ai-sub {
        font-size: 11px;
        color: var(--gray-5);
      }
    }

    .ai-badge {
      font-size: 11px;
      color: var(--primary);
      background: var(--primary-bg);
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
  }

  .ai-section {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .ai-section-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-8);
      margin-bottom: 6px;
    }

    .ai-section-text {
      font-size: 13px;
      line-height: 1.6;
      color: var(--gray-7);
      background: var(--gray-1);
      padding: 10px;
      border-radius: var(--radius-xs);
    }
  }

  .ai-difficulty {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--gray-6);

    .diff-stars {
      color: #f59e0b;
      font-size: 14px;
    }

    .diff-rate {
      color: var(--success);
      font-weight: 600;
      margin-left: auto;
    }
  }

  .ai-mistake-item,
  .ai-suggest-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--gray-7);
    margin-top: 6px;

    .mi-icon,
    .si-icon {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--primary-bg);
      color: var(--primary);
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

/* 底部操作栏 */
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
