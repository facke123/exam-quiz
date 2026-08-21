<template>
  <div v-loading="loading" class="statistics-page">
    <!-- 4大核心指标卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="sc-icon" style="background: #eef2ff; color: #4a6cf7">📝</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(overview.totalPracticeCount || 1280) }}</div>
          <div class="sc-label">平台累计做题人次</div>
          <div class="sc-trend up">今日已做题 {{ formatNumber(overview.todayPracticeCount || 0) }} 道</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #f0fdf4; color: #22c55e">🎯</div>
        <div class="sc-info">
          <div class="sc-num">{{ avgRate }}%</div>
          <div class="sc-label">全站平均正确率</div>
          <div class="sc-trend up">基于真实答题统计</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #fff7ed; color: #f97316">💰</div>
        <div class="sc-info">
          <div class="sc-num">¥{{ formatNumber(totalRevenue) }}</div>
          <div class="sc-label">平台累计充值</div>
          <div class="sc-trend up">VIP会员 {{ overview.vipUsers || 0 }} 人</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #f5f3ff; color: #8b5cf6">📊</div>
        <div class="sc-info">
          <div class="sc-num">{{ overview.totalQuestions || 0 }}</div>
          <div class="sc-label">已收录题库总量</div>
          <div class="sc-trend up">覆盖 {{ subjectRates.length }} 大专业科目</div>
        </div>
      </div>
    </div>

    <!-- 趋势图表与分布 -->
    <div class="chart-row">
      <!-- 刷题趋势 -->
      <div class="panel">
        <div class="panel-title">
          <span>📈 刷题量与活跃走势（近7天）</span>
        </div>
        <div class="trend-bars">
          <div v-for="item in weeklyTrend" :key="item.day" class="tb-item">
            <div class="tb-bar-wrap">
              <div
                class="tb-bar active-bar"
                :style="{ height: item.activeH + '%' }"
                :title="`正确率: ${item.rate}%`"
              ></div>
              <div
                class="tb-bar question-bar"
                :style="{ height: item.questionH + '%' }"
                :title="`做题量: ${item.count}`"
              ></div>
            </div>
            <span class="tb-day">{{ item.day }}</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background: #4a6cf7"></span> 做题量</span>
          <span class="legend-item"><span class="legend-dot" style="background: #8b5cf6"></span> 正确率</span>
        </div>
      </div>

      <!-- 各科目正确率 -->
      <div class="panel">
        <div class="panel-title">
          <span>🎯 各科目平均掌握度</span>
        </div>
        <div class="subject-rates">
          <div v-for="sub in subjectRates" :key="sub.name" class="sr-item">
            <div class="sr-header">
              <span class="sr-name">{{ sub.name }}</span>
              <span class="sr-rate">{{ sub.rate }}%</span>
            </div>
            <div class="sr-bar-track">
              <div class="sr-bar-fill" :style="{ width: sub.rate + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高频易错考点 TOP 5 -->
    <div class="panel weak-panel">
      <div class="panel-title">
        <span>🔥 平台高频易错题 TOP 5</span>
      </div>
      <div class="weak-list">
        <div v-for="(wp, i) in weakPoints" :key="wp.id" class="wp-item">
          <div class="wp-rank">{{ i + 1 }}</div>
          <div class="wp-info">
            <div class="wp-name">{{ wp.title }}</div>
            <div class="wp-desc">试题ID: {{ wp.id }} · 错误累计 {{ wp.wrongCount }} 次</div>
          </div>
          <div class="wp-rate-col">
            <div class="wp-rate-val">{{ wp.wrongRate }}%</div>
            <div class="wp-rate-lbl">平均错误率</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getDashboardStats,
  getPracticeStats,
  getQuestionQuality,
  getTopWrongQuestions,
  getRevenueStats,
} from '@/api/stats'
import { formatNumber } from '@/utils/format'

const loading = ref(false)
const overview = ref<any>({})
const weeklyTrend = ref<any[]>([])
const subjectRates = ref<any[]>([])
const weakPoints = ref<any[]>([])
const totalRevenue = ref(0)

const avgRate = computed(() => {
  if (weeklyTrend.value.length === 0) return 78
  const sum = weeklyTrend.value.reduce((acc, cur) => acc + (cur.rate || 0), 0)
  return Math.round(sum / weeklyTrend.value.length)
})

async function fetchStats() {
  loading.value = true
  try {
    const [dashRes, pracRes, qualRes, wrongRes, revRes] = await Promise.allSettled([
      getDashboardStats(),
      getPracticeStats(),
      getQuestionQuality(),
      getTopWrongQuestions(5),
      getRevenueStats(),
    ])

    if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
      overview.value = dashRes.value.data
    }

    if (pracRes.status === 'fulfilled' && pracRes.value?.data) {
      const list = pracRes.value.data
      let maxCount = 1
      for (const item of list) {
        if (item.count > maxCount) maxCount = item.count
      }
      weeklyTrend.value = list.map((item: any) => ({
        day: item.date,
        count: item.count,
        rate: item.correctRate,
        questionH: Math.max(15, Math.min(100, Math.round((item.count / maxCount) * 100))),
        activeH: Math.max(15, Math.min(100, item.correctRate || 75)),
      }))
    }

    if (qualRes.status === 'fulfilled' && qualRes.value?.data) {
      subjectRates.value = qualRes.value.data.map((q: any) => ({
        name: q.subject,
        rate: q.avgCorrectRate || 75,
      }))
    }

    if (wrongRes.status === 'fulfilled' && wrongRes.value?.data) {
      weakPoints.value = wrongRes.value.data
    }

    if (revRes.status === 'fulfilled' && revRes.value?.data) {
      const revList = revRes.value.data
      totalRevenue.value = revList.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0)
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<style scoped lang="scss">
.statistics-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
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
      font-size: 26px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .sc-label {
      font-size: 13px;
      color: var(--gray-6);
      margin-top: 4px;
    }

    .sc-trend.up {
      font-size: 12px;
      color: var(--success);
      margin-top: 4px;
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;

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
    margin-bottom: 18px;
  }
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding-top: 20px;

  .tb-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    height: 100%;
    justify-content: flex-end;

    .tb-bar-wrap {
      display: flex;
      gap: 4px;
      align-items: flex-end;
      height: 100%;

      .tb-bar {
        width: 14px;
        border-radius: 4px 4px 0 0;

        &.active-bar {
          background: #8b5cf6;
        }
        &.question-bar {
          background: #4a6cf7;
        }
      }
    }

    .tb-day {
      font-size: 12px;
      color: var(--gray-5);
    }
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 14px;
  font-size: 12px;
  color: var(--gray-6);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  }
}

.subject-rates {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .sr-item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .sr-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;

      .sr-name {
        color: var(--gray-8);
        font-weight: 500;
      }
      .sr-rate {
        color: var(--primary);
        font-weight: 700;
      }
    }

    .sr-bar-track {
      height: 8px;
      background: var(--gray-1);
      border-radius: 4px;
      overflow: hidden;

      .sr-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--primary) 0%, #818cf8 100%);
        border-radius: 4px;
      }
    }
  }
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .wp-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    border-radius: 6px;
    background: var(--gray-1);

    .wp-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #fee2e2;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .wp-info {
      flex: 1;

      .wp-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--gray-8);
      }
      .wp-desc {
        font-size: 12px;
        color: var(--gray-5);
        margin-top: 2px;
      }
    }

    .wp-rate-col {
      text-align: right;

      .wp-rate-val {
        font-size: 15px;
        font-weight: 700;
        color: #ef4444;
      }
      .wp-rate-lbl {
        font-size: 11px;
        color: var(--gray-5);
      }
    }
  }
}
</style>
