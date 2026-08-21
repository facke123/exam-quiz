<template>
  <div class="report-page">
    <!-- 头部成绩卡片 -->
    <div class="report-header">
      <div class="rh-label">软考模拟答卷 · 成绩报告</div>
      <div class="score">{{ score }}</div>
      <div class="score-label">分 / 满分100分</div>
      <div class="pass-tag" :class="score >= 45 ? 'pass' : 'fail'">
        {{ score >= 45 ? '✓ 达到合格线（45分合格）' : '✗ 暂未达到合格线' }}
      </div>
    </div>

    <!-- 数据指标统计 -->
    <div class="report-stats">
      <div class="rs-item">
        <div class="rs-num green">{{ correctCount }}</div>
        <div class="rs-label">答对</div>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <div class="rs-num red">{{ wrongCount }}</div>
        <div class="rs-label">答错</div>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <div class="rs-num">{{ correctRate }}<small>%</small></div>
        <div class="rs-label">正确率</div>
      </div>
      <div class="rs-divider"></div>
      <div class="rs-item">
        <div class="rs-num">12<small>分</small></div>
        <div class="rs-label">用时</div>
      </div>
    </div>

    <!-- 题型分布卡片 -->
    <div class="analysis-card">
      <div class="ac-title">📊 题型分布</div>
      <div class="type-breakdown">
        <div class="tb-row">
          <div class="tb-label">单选题</div>
          <div class="tb-bar">
            <div class="tb-correct" style="width: 70%"></div>
            <div class="tb-wrong" style="width: 30%"></div>
          </div>
          <div class="tb-text">7/10 正确</div>
        </div>
        <div class="tb-row">
          <div class="tb-label">多选题</div>
          <div class="tb-bar">
            <div class="tb-correct" style="width: 50%"></div>
            <div class="tb-wrong" style="width: 50%"></div>
          </div>
          <div class="tb-text">1/2 正确</div>
        </div>
        <div class="tb-row">
          <div class="tb-label">判断题</div>
          <div class="tb-bar">
            <div class="tb-correct" style="width: 100%"></div>
          </div>
          <div class="tb-text">3/3 正确</div>
        </div>
      </div>
    </div>

    <!-- 错题回顾卡片 -->
    <div class="analysis-card">
      <div class="ac-title">📌 错题精细回顾</div>
      <div class="wrong-review-item" @click="$router.push('/quiz/analysis/1')">
        <div class="wr-title">1. [多选题] 项目范围管理的主要过程包括哪些？</div>
        <div class="wr-ans">你的答案：ABC ｜ 正确答案：ABCD</div>
        <div class="wr-kp">考点：项目范围管理过程</div>
      </div>
      <div class="wrong-review-item" @click="$router.push('/quiz/analysis/1')">
        <div class="wr-title">2. [单选题] 制定项目章程的输入不包括以下哪项？</div>
        <div class="wr-ans">你的答案：C ｜ 正确答案：B</div>
        <div class="wr-kp">考点：项目章程输入输出</div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="bottom-actions">
      <button class="btn-outline" @click="$router.push('/')">返回首页</button>
      <button class="btn-primary" @click="$router.push('/wrong')">查看错题本</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const score = ref(85)
const correctCount = ref(8)
const wrongCount = ref(2)
const correctRate = ref(80)

onMounted(() => {
  const historyState = window.history.state
  if (historyState?.questions && historyState?.answers) {
    const qs = historyState.questions
    const ans = historyState.answers
    let c = 0
    let w = 0
    qs.forEach((q: any) => {
      const userAns = ans[q.id]
      if (!userAns) {
        w++
      } else if (Array.isArray(q.answer) && Array.isArray(userAns)) {
        if (q.answer.sort().join(',') === userAns.sort().join(',')) c++
        else w++
      } else if (q.answer === userAns) {
        c++
      } else {
        w++
      }
    })
    correctCount.value = c
    wrongCount.value = w
    const total = qs.length || 1
    correctRate.value = Math.round((c / total) * 100)
    score.value = Math.round((c / total) * 100)
  }
})
</script>

<style scoped lang="scss">
.report-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 40px;
}

/* 顶部成绩横幅 */
.report-header {
  background: linear-gradient(140deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%);
  color: #fff;
  text-align: center;
  padding: calc(env(safe-area-inset-top) + 24px) 20px 28px;
  position: relative;

  .rh-label {
    font-size: 13px;
    opacity: 0.85;
  }

  .score {
    font-size: 56px;
    font-weight: 800;
    line-height: 1.1;
    margin: 8px 0 2px;
  }

  .score-label {
    font-size: 12px;
    opacity: 0.8;
  }

  .pass-tag {
    display: inline-block;
    background: rgba(16, 185, 129, 0.25);
    border: 1px solid rgba(16, 185, 129, 0.5);
    color: #a7f3d0;
    font-size: 12px;
    padding: 3px 12px;
    border-radius: 12px;
    margin-top: 10px;
    font-weight: 600;

    &.fail {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
      color: #fca5a5;
    }
  }
}

/* 4项数据矩阵 */
.report-stats {
  margin: -14px 14px 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 8px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: var(--shadow-md);
  position: relative;
  z-index: 10;

  .rs-item {
    text-align: center;
    flex: 1;

    .rs-num {
      font-size: 20px;
      font-weight: 800;
      color: var(--gray-8);

      &.green {
        color: var(--success);
      }
      &.red {
        color: var(--danger);
      }

      small {
        font-size: 11px;
        font-weight: 500;
      }
    }

    .rs-label {
      font-size: 11px;
      color: var(--gray-5);
      margin-top: 2px;
    }
  }

  .rs-divider {
    width: 1px;
    height: 24px;
    background: var(--gray-2);
  }
}

/* 分析卡片 */
.analysis-card {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);

  .ac-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 12px;
  }
}

.type-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .tb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;

    .tb-label {
      width: 48px;
      color: var(--gray-6);
      font-weight: 500;
    }

    .tb-bar {
      flex: 1;
      height: 8px;
      background: var(--gray-2);
      border-radius: 4px;
      display: flex;
      overflow: hidden;

      .tb-correct {
        background: var(--success);
      }

      .tb-wrong {
        background: var(--danger);
      }
    }

    .tb-text {
      width: 65px;
      text-align: right;
      color: var(--gray-5);
    }
  }
}

.wrong-review-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-2);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .wr-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-8);
    line-height: 1.5;
  }

  .wr-ans {
    font-size: 13px;
    color: var(--danger);
    margin: 4px 0 2px;
  }

  .wr-kp {
    font-size: 11px;
    color: var(--gray-5);
  }
}

.bottom-actions {
  padding: 0 14px;
  display: flex;
  gap: 12px;
  margin-top: 18px;

  button {
    flex: 1;
    height: 44px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
  }

  .btn-outline {
    background: var(--gray-0);
    border: 1.5px solid var(--gray-4);
    color: var(--gray-7);
  }

  .btn-primary {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 4px 12px var(--primary-glow);
  }
}
</style>
