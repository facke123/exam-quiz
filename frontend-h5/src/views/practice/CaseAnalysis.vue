<template>
  <div class="case-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">案例分析</div>
      <div class="right">{{ currentCaseIdx + 1 }}/{{ caseList.length }}</div>
    </div>

    <div class="quiz-body">
      <span class="question-type-tag">案例分析题</span>
      <div class="case-hint">📖 阅读以下案例材料，回答下方问题</div>

      <!-- 案例背景材料 -->
      <div class="analysis-content">
        <div class="ac-body">
          <p class="case-sub-title"><strong>【案例背景】</strong></p>
          <p>{{ currentCase.background }}</p>
          <div class="case-points">
            <p v-for="(p, i) in currentCase.points" :key="i">{{ i + 1 }}. {{ p }}</p>
          </div>
          <p class="case-summary">{{ currentCase.summary }}</p>
        </div>
      </div>

      <!-- 问答列表 -->
      <div v-for="(q, idx) in currentCase.questions" :key="idx" class="question-box">
        <div class="q-title">问题{{ idx + 1 }}：{{ q.title }}（{{ q.score }}分）</div>
        <textarea
          v-model="answers[idx]"
          class="subjective-input"
          placeholder="请输入你的作答要点..."
          rows="4"
        ></textarea>
        <div class="subjective-hint">{{ (answers[idx] || '').length }} / 1000字</div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="quiz-footer">
      <div class="footer-icon" :class="{ active: favorited }" @click="favorited = !favorited">
        <span>{{ favorited ? '⭐' : '☆' }}</span>
        <span>{{ favorited ? '已收藏' : '收藏' }}</span>
      </div>
      <div class="footer-icon" @click="showToast('笔记已保存')">
        <span>📓</span>
        <span>笔记</span>
      </div>
      <button class="btn-submit" @click="onSubmit">提交答案</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const currentCaseIdx = ref(0)
const favorited = ref(false)
const answers = ref<Record<number, string>>({})

const caseList = ref([
  {
    id: '1',
    background: '某公司承接了一个信息化集成项目，项目预算500万元，工期6个月。项目经理小李在项目启动后，制定了详细的项目计划，但在执行过程中发现：',
    points: [
      '客户频繁变更需求，导致项目范围不断扩大；',
      '团队成员对需求理解不一致，产生严重返工；',
      '进度已经延误2周，成本超支10%。',
    ],
    summary: '小李认为主要原因是需求管理不当，需要重新梳理项目范围管理流程。',
    questions: [
      { title: '请指出该项目在项目范围管理方面存在哪些问题？', score: 10 },
      { title: '针对上述问题，请给出具体的改进建议。', score: 10 },
    ],
  },
])

const currentCase = computed(() => caseList.value[currentCaseIdx.value])

function onSubmit() {
  showDialog({
    title: '提交成功',
    message: '【参考要点】1. 缺少规范的变更控制流程；2. 范围说明书定义不清晰；3. 需求跟踪矩阵缺失。已为您记录本次答卷！',
  })
}
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
