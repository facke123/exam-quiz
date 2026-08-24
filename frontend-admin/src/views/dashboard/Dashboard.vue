<template>
  <div v-loading="loading" class="dashboard-page">
    <!-- 4大核心统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="sc-icon" style="background: #EEF2FF; color: #4A6CF7">📝</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.todayPracticeCount || 0) }}</div>
          <div class="sc-label">今日刷题量</div>
          <div class="sc-trend up">实时动态统计</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #F0FDF4; color: #22C55E">👥</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.dailyActive || 0) }}</div>
          <div class="sc-label">今日活跃学员</div>
          <div class="sc-trend up">总学员 {{ stats.totalUsers || 0 }} 人</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #FFF7ED; color: #FF7A45">💰</div>
        <div class="sc-info">
          <div class="sc-num">¥{{ formatNumber(stats.todayRevenue || 0) }}</div>
          <div class="sc-label">今日新增付费</div>
          <div class="sc-trend up">VIP会员 {{ stats.vipUsers || 0 }} 人</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #F5F3FF; color: #8B5CF6">📚</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.totalQuestions || 0) }}</div>
          <div class="sc-label">题库总题量</div>
          <div class="sc-trend" style="color: var(--primary)">已发布上线试题</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <!-- 刷题趋势图 -->
      <div class="panel">
        <div class="panel-title">
          <span>📈 刷题量近7天趋势</span>
          <div class="pt-actions">
            <span
              v-for="t in trendTabs"
              :key="t.key"
              class="pta"
              :class="{ active: currentTab === t.key }"
              @click="currentTab = t.key"
            >
              {{ t.label }}
            </span>
          </div>
        </div>
        <div class="bar-chart">
          <div v-for="item in (stats.chartData || chartData)" :key="item.day" class="bar-item">
            <div class="bar" :style="{ height: item.height + '%' }">
              <span class="bar-val">{{ item.val || item.count }}</span>
            </div>
            <span class="bar-label">{{ item.day }}</span>
          </div>
        </div>
      </div>

      <!-- 题型分布 -->
      <div class="panel">
        <div class="panel-title">
          <span>题型分布</span>
        </div>
        <div class="donut-box">
          <div class="donut-svg-wrap">
            <svg viewBox="0 0 100 100" class="donut-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" stroke-width="14" />
              <!-- 单选题 -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#4A6CF7"
                stroke-width="14"
                :stroke-dasharray="`${(qDist.singlePercent * 2.38).toFixed(1)} 238`"
                stroke-dashoffset="0"
              />
              <!-- 多选题 -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#22C55E"
                stroke-width="14"
                :stroke-dasharray="`${(qDist.multiplePercent * 2.38).toFixed(1)} 238`"
                :stroke-dashoffset="`-${(qDist.singlePercent * 2.38).toFixed(1)}`"
              />
              <!-- 判断题 -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#F59E0B"
                stroke-width="14"
                :stroke-dasharray="`${(qDist.judgePercent * 2.38).toFixed(1)} 238`"
                :stroke-dashoffset="`-${((qDist.singlePercent + qDist.multiplePercent) * 2.38).toFixed(1)}`"
              />
              <!-- 案例分析 -->
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#8B5CF6"
                stroke-width="14"
                :stroke-dasharray="`${(qDist.casePercent * 2.38).toFixed(1)} 238`"
                :stroke-dashoffset="`-${((qDist.singlePercent + qDist.multiplePercent + qDist.judgePercent) * 2.38).toFixed(1)}`"
              />
            </svg>
            <div class="donut-center">
              <span class="total-num">{{ formatNumber(stats.totalQuestions || 0) }}</span>
              <span class="total-text">总题量</span>
            </div>
          </div>
          <div class="donut-info">
            <div class="di-item">
              <span class="dot" style="background: #4A6CF7" />
              <span>单选题 ({{ qDist.singlePercent || 0 }}%)</span>
              <span class="num">{{ qDist.single || 0 }} 道</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #22C55E" />
              <span>多选题 ({{ qDist.multiplePercent || 0 }}%)</span>
              <span class="num">{{ qDist.multiple || 0 }} 道</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #F59E0B" />
              <span>判断题 ({{ qDist.judgePercent || 0 }}%)</span>
              <span class="num">{{ qDist.judge || 0 }} 道</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #8B5CF6" />
              <span>案例题 ({{ qDist.casePercent || 0 }}%)</span>
              <span class="num">{{ qDist.case || 0 }} 道</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 待办与热门科目 -->
    <div class="chart-row">
      <!-- 待办处理 -->
      <div class="panel">
        <div class="panel-title">
          <span>📋 待处理事项</span>
        </div>
        <div class="todo-list">
          <div
            v-for="item in (stats.todoList || defaultTodoList)"
            :key="item.id"
            class="todo-item"
          >
            <div
              class="ti-icon"
              :style="{
                background: item.type === 'ai_question' ? '#EEF2FF' : item.type === 'error_report' ? '#FEF2F2' : '#FFFBEB',
                color: item.type === 'ai_question' ? '#4A6CF7' : item.type === 'error_report' ? '#EF4444' : '#F59E0B',
              }"
            >
              {{ item.type === 'ai_question' ? '🤖' : item.type === 'error_report' ? '⚠️' : '🔔' }}
            </div>
            <div class="ti-text">
              <div class="t">{{ item.title }}</div>
              <div class="d">{{ item.desc }}</div>
            </div>
            <button class="ti-btn" @click="$router.push(item.route)">
              {{ item.btnText || '去处理' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 热门软考科目 -->
      <div class="panel">
        <div class="panel-title">
          <span>🔥 热门软考科目</span>
        </div>
        <div class="hot-subjects">
          <div
            v-for="(sub, i) in (stats.hotSubjects || hotSubjects)"
            :key="sub.name"
            class="hs-item"
          >
            <span class="hs-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <span class="hs-name">{{ sub.name }}</span>
            <div class="hs-bar-wrap">
              <div class="hs-bar" :style="{ width: (sub.percent || 50) + '%' }" />
            </div>
            <span class="hs-count">{{ sub.count }} 次刷题</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDashboardStats } from '@/api/stats'
import { formatNumber } from '@/utils/format'

const loading = ref(false)
const stats = ref<any>({})
const currentTab = ref('7d')

const trendTabs = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'month', label: '本月' },
]

const chartData = ref([
  { day: '周一', val: '45', height: 45, count: 45 },
  { day: '周二', val: '65', height: 65, count: 65 },
  { day: '周三', val: '80', height: 80, count: 80 },
  { day: '周四', val: '75', height: 75, count: 75 },
  { day: '周五', val: '95', height: 95, count: 95 },
  { day: '周六', val: '120', height: 100, count: 120 },
  { day: '周日', val: '110', height: 92, count: 110 },
])

const qDist = computed(() => {
  if (stats.value?.questionDistribution) {
    return stats.value.questionDistribution
  }
  return {
    single: 0,
    multiple: 0,
    judge: 0,
    case: 0,
    singlePercent: 0,
    multiplePercent: 0,
    judgePercent: 0,
    casePercent: 0,
  }
})

const defaultTodoList = [
  {
    id: 1,
    title: '待审核 AI 生成题目',
    desc: '由大模型智能命题生成，等待人工复核校验入库',
    type: 'ai_question',
    route: '/ai/generate',
    btnText: '去审核',
  },
  {
    id: 2,
    title: '用户纠错反馈待处理',
    desc: '考生提交的题干疑问与解析异议反馈待核实答复',
    type: 'error_report',
    route: '/question/error-report',
    btnText: '去处理',
  },
  {
    id: 3,
    title: '未发布/草稿试卷待发布',
    desc: '真题及模拟试卷组卷完成后待审核上线',
    type: 'paper',
    route: '/exam/paper',
    btnText: '去发布',
  },
]

const hotSubjects = ref([
  { name: '系统集成项目管理工程师 (中级)', count: 240, percent: 90 },
  { name: '信息系统项目管理师 (高级)', count: 180, percent: 75 },
  { name: '软件设计师 (中级)', count: 120, percent: 55 },
  { name: '网络工程师 (中级)', count: 90, percent: 40 },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    if (res?.data) {
      stats.value = res.data
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: 24px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .sc-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .sc-info {
    flex: 1;

    .sc-num {
      font-size: 24px;
      font-weight: 700;
      color: var(--gray-8);
      line-height: 1.2;
    }

    .sc-label {
      font-size: 13px;
      color: var(--gray-5);
      margin-top: 4px;
    }

    .sc-trend {
      font-size: 12px;
      margin-top: 4px;

      &.up {
        color: var(--success);
      }
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .panel-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .pt-actions {
      display: flex;
      gap: 8px;

      .pta {
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 4px;
        color: var(--gray-6);
        cursor: pointer;
        background: var(--gray-1);

        &.active {
          background: var(--primary);
          color: #fff;
        }
      }
    }
  }
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding-top: 20px;

  .bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
    justify-content: flex-end;
    gap: 8px;

    .bar {
      width: 28px;
      background: linear-gradient(180deg, var(--primary) 0%, rgba(74, 108, 247, 0.3) 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s;
      min-height: 8px;

      .bar-val {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        color: var(--gray-5);
        white-space: nowrap;
      }
    }

    .bar-label {
      font-size: 12px;
      color: var(--gray-5);
    }
  }
}

.donut-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .donut-svg-wrap {
    width: 140px;
    height: 140px;
    position: relative;

    .donut-svg {
      transform: rotate(-90deg);
    }

    .donut-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .total-num {
        font-size: 18px;
        font-weight: 700;
        color: var(--gray-8);
      }
      .total-text {
        font-size: 11px;
        color: var(--gray-5);
      }
    }
  }

  .donut-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .di-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--gray-6);

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      .num {
        margin-left: auto;
        font-weight: 600;
        color: var(--gray-8);
      }
    }
  }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--gray-1);
    border-radius: 8px;

    .ti-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .ti-text {
      flex: 1;

      .t {
        font-size: 13px;
        font-weight: 600;
        color: var(--gray-8);
      }
      .d {
        font-size: 12px;
        color: var(--gray-5);
        margin-top: 2px;
      }
    }

    .ti-btn {
      padding: 6px 14px;
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      flex-shrink: 0;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.hot-subjects {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .hs-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;

    .hs-rank {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      background: var(--gray-2);
      color: var(--gray-6);

      &.rank-1 {
        background: #FEE2E2;
        color: #EF4444;
      }
      &.rank-2 {
        background: #FFEDD5;
        color: #F97316;
      }
      &.rank-3 {
        background: #FEF3C7;
        color: #F59E0B;
      }
    }

    .hs-name {
      width: 180px;
      color: var(--gray-8);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hs-bar-wrap {
      flex: 1;
      height: 8px;
      background: var(--gray-1);
      border-radius: 4px;
      overflow: hidden;

      .hs-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--primary) 0%, #818CF8 100%);
        border-radius: 4px;
      }
    }

    .hs-count {
      font-size: 12px;
      color: var(--gray-5);
      min-width: 65px;
      text-align: right;
    }
  }
}
</style>
