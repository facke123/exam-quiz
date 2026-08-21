<template>
  <div v-loading="loading" class="dashboard-page">
    <!-- 4大核心统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="sc-icon" style="background: #EEF2FF; color: #4A6CF7">📝</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.totalQuestions || 12850) }}</div>
          <div class="sc-label">今日刷题量</div>
          <div class="sc-trend up">较昨日 ↑ 15.3%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #F0FDF4; color: #22C55E">👥</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.dailyActive || 3420) }}</div>
          <div class="sc-label">今日活跃用户</div>
          <div class="sc-trend up">较昨日 ↑ 8.7%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #FFF7ED; color: #FF7A45">💰</div>
        <div class="sc-info">
          <div class="sc-num">¥{{ formatNumber(4680) }}</div>
          <div class="sc-label">今日新增付费</div>
          <div class="sc-trend up">较昨日 ↑ 22.4%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #F5F3FF; color: #8B5CF6">📚</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(3850) }}</div>
          <div class="sc-label">题库总题量</div>
          <div class="sc-trend" style="color: var(--primary)">近7天新增 120道</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <!-- 刷题趋势图 -->
      <div class="panel">
        <div class="panel-title">
          <span>📈 刷题量趋势</span>
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
          <div v-for="item in chartData" :key="item.day" class="bar-item">
            <div class="bar" :style="{ height: item.height + '%' }">
              <span class="bar-val">{{ item.val }}</span>
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
              <!-- 单选题 52% -->
              <circle cx="50" cy="50" r="38" fill="none" stroke="#4A6CF7" stroke-width="14" stroke-dasharray="124 238" stroke-dashoffset="0" />
              <!-- 多选题 24% -->
              <circle cx="50" cy="50" r="38" fill="none" stroke="#22C55E" stroke-width="14" stroke-dasharray="57 238" stroke-dashoffset="-124" />
              <!-- 判断题 14% -->
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" stroke-width="14" stroke-dasharray="33 238" stroke-dashoffset="-181" />
              <!-- 案例题 10% -->
              <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" stroke-width="14" stroke-dasharray="24 238" stroke-dashoffset="-214" />
            </svg>
            <div class="donut-center">
              <span class="total-num">3,850</span>
              <span class="total-text">总题量</span>
            </div>
          </div>
          <div class="donut-info">
            <div class="di-item">
              <span class="dot" style="background: #4A6CF7"></span>
              <span>单选题 (52%)</span>
              <span class="num">2,002</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #22C55E"></span>
              <span>多选题 (24%)</span>
              <span class="num">924</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #F59E0B"></span>
              <span>判断题 (14%)</span>
              <span class="num">539</span>
            </div>
            <div class="di-item">
              <span class="dot" style="background: #8B5CF6"></span>
              <span>案例分析 (10%)</span>
              <span class="num">385</span>
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
          <span>📋 待处理待办</span>
        </div>
        <div class="todo-list">
          <div class="todo-item">
            <div class="ti-icon" style="background: #EEF2FF; color: #4A6CF7">🤖</div>
            <div class="ti-text">
              <div class="t">待审核 AI 生成题目（12道）</div>
              <div class="d">由 Gemini 2.5 自动命题，等待人工复核校验入库</div>
            </div>
            <button class="ti-btn" @click="$router.push('/ai/generate')">去审核</button>
          </div>

          <div class="todo-item">
            <div class="ti-icon" style="background: #FEF2F2; color: #EF4444">⚠️</div>
            <div class="ti-text">
              <div class="t">用户纠错反馈待处理（5条）</div>
              <div class="d">涉及“项目范围管理”第28题答案异议反馈</div>
            </div>
            <button class="ti-btn" @click="$router.push('/question/error-report')">去处理</button>
          </div>

          <div class="todo-item">
            <div class="ti-icon" style="background: #FFFBEB; color: #F59E0B">🔔</div>
            <div class="ti-text">
              <div class="t">本周真题卷待发布（2套）</div>
              <div class="d">2025年下半年系统集成真题解析已校对完毕</div>
            </div>
            <button class="ti-btn" @click="$router.push('/exam/paper')">去发布</button>
          </div>
        </div>
      </div>

      <!-- 热门软考科目 -->
      <div class="panel">
        <div class="panel-title">
          <span>🔥 热门软考科目</span>
        </div>
        <div class="hot-subjects">
          <div v-for="(sub, i) in hotSubjects" :key="sub.name" class="hs-item">
            <span class="hs-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <span class="hs-name">{{ sub.name }}</span>
            <div class="hs-bar-wrap">
              <div class="hs-bar" :style="{ width: sub.percent + '%' }"></div>
            </div>
            <span class="hs-count">{{ sub.count }}人刷题</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  { day: '周一', val: '8.2k', height: 45 },
  { day: '周二', val: '9.8k', height: 55 },
  { day: '周三', val: '11.2k', height: 65 },
  { day: '周四', val: '10.5k', height: 60 },
  { day: '周五', val: '13.4k', height: 78 },
  { day: '周六', val: '16.8k', height: 95 },
  { day: '周日', val: '15.2k', height: 86 },
])

const hotSubjects = ref([
  { name: '系统集成项目管理工程师 (中级)', count: '4,280', percent: 92 },
  { name: '信息系统项目管理师 (高级)', count: '3,650', percent: 80 },
  { name: '软件设计师 (中级)', count: '2,920', percent: 64 },
  { name: '网络工程师 (中级)', count: '2,410', percent: 52 },
  { name: '系统架构设计师 (高级)', count: '1,890', percent: 40 },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    if (res?.data) {
      stats.value = res.data
    }
  } catch {
    // mock fallback
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
    font-size: 26px;
    flex-shrink: 0;
  }

  .sc-info {
    flex: 1;

    .sc-num {
      font-size: 28px;
      font-weight: 700;
      color: var(--gray-8);
      line-height: 1.1;
    }

    .sc-label {
      font-size: 13px;
      color: var(--gray-6);
      margin-top: 4px;
    }

    .sc-trend {
      font-size: 12px;
      margin-top: 4px;

      &.up {
        color: var(--success);
      }
      &.down {
        color: var(--danger);
      }
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .pt-actions {
      display: flex;
      gap: 6px;

      .pta {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 4px;
        background: var(--gray-2);
        color: var(--gray-6);
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: var(--primary);
          color: #fff;
          font-weight: 600;
        }
      }
    }
  }
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  gap: 12px;
  padding: 20px 0 0;

  .bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
    height: 100%;
    justify-content: flex-end;

    .bar {
      width: 100%;
      max-width: 36px;
      background: linear-gradient(180deg, var(--primary) 0%, #a5b4fc 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s;

      .bar-val {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        color: var(--gray-7);
        font-weight: 600;
        white-space: nowrap;
      }
    }

    .bar-label {
      font-size: 12px;
      color: var(--gray-6);
    }
  }
}

.donut-box {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px 0;
  gap: 16px;

  .donut-svg-wrap {
    position: relative;
    width: 130px;
    height: 130px;

    .donut-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .donut-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .total-num {
        font-size: 16px;
        font-weight: 800;
        color: var(--gray-8);
      }

      .total-text {
        font-size: 11px;
        color: var(--gray-5);
      }
    }
  }

  .donut-info {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .di-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--gray-7);

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .num {
        margin-left: 12px;
        font-weight: 600;
        color: var(--gray-8);
      }
    }
  }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 6px;
    background: var(--gray-1);

    .ti-icon {
      width: 36px;
      height: 36px;
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
        font-size: 11px;
        color: var(--gray-5);
        margin-top: 2px;
      }
    }

    .ti-btn {
      font-size: 12px;
      color: var(--primary);
      background: #fff;
      cursor: pointer;
      padding: 4px 12px;
      border: 1px solid var(--primary);
      border-radius: 4px;
      font-weight: 600;
      transition: all 0.2s;

      &:hover {
        background: var(--primary);
        color: #fff;
      }
    }
  }
}

.hot-subjects {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .hs-item {
    display: flex;
    align-items: center;
    gap: 10px;
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
      color: var(--gray-6);
      background: var(--gray-2);

      &.rank-1 {
        background: #fee2e2;
        color: #ef4444;
      }
      &.rank-2 {
        background: #ffedd5;
        color: #f97316;
      }
      &.rank-3 {
        background: #fef3c7;
        color: #d97706;
      }
    }

    .hs-name {
      flex: 1;
      font-weight: 500;
      color: var(--gray-8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hs-bar-wrap {
      width: 80px;
      height: 6px;
      background: var(--gray-2);
      border-radius: 3px;
      overflow: hidden;

      .hs-bar {
        height: 100%;
        background: var(--primary);
        border-radius: 3px;
      }
    }

    .hs-count {
      font-size: 12px;
      color: var(--gray-5);
      width: 70px;
      text-align: right;
    }
  }
}
</style>
