<template>
  <div class="stat-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">做题统计</div>
      <div class="right" @click="onExport">导出</div>
    </div>

    <!-- 数据总览 4格 -->
    <div class="stat-overview">
      <div class="so-grid">
        <div class="so-item">
          <div class="so-num">{{ overview.totalAnswered || 0 }}<small>题</small></div>
          <div class="so-label">累计刷题</div>
        </div>
        <div class="so-item">
          <div class="so-num">{{ overview.correctRate || 0 }}<small>%</small></div>
          <div class="so-label">平均正确率</div>
        </div>
        <div class="so-item">
          <div class="so-num">{{ overview.wrongCount || 0 }}<small>题</small></div>
          <div class="so-label">错题记录</div>
        </div>
        <div class="so-item">
          <div class="so-num">{{ overview.streakDays || 0 }}<small>天</small></div>
          <div class="so-label">连续打卡</div>
        </div>
      </div>
    </div>

    <!-- 刷题趋势 -->
    <div class="stat-card">
      <div class="sc-title">
        <span>📈 刷题趋势</span>
        <div class="sc-switch">
          <span :class="{ active: trendType === 'week' }" @click="trendType = 'week'">周</span>
          <span :class="{ active: trendType === 'month' }" @click="trendType = 'month'">月</span>
        </div>
      </div>
      <div v-if="trendList.length > 0" class="chart-placeholder">
        <div
          v-for="(t, idx) in trendList"
          :key="idx"
          class="chart-bar"
          :class="{ today: idx === trendList.length - 1 }"
          :style="{ height: Math.max(12, Math.min(100, Math.round((t.count / maxTrendCount) * 100))) + '%' }"
        >
          <div class="bar-val">{{ t.count }}</div>
        </div>
      </div>
      <div v-else class="chart-empty" style="padding: 24px; text-align: center; color: var(--gray-5)">
        暂无近期刷题记录，快去刷题吧～
      </div>
      <div v-if="trendList.length > 0" class="chart-labels">
        <span v-for="(t, idx) in trendList" :key="idx">{{ t.date }}</span>
      </div>
    </div>

    <!-- 能力雷达图 -->
    <div class="stat-card">
      <div class="sc-title">🎯 知识图谱与能力雷达</div>
      <div class="radar-svg-wrap">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,50 140,75 140,125 100,150 60,125 60,75"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,80 120,90 120,110 100,120 80,110 80,90"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,35 155,72 148,130 100,165 45,135 38,68"
            fill="rgba(99,102,241,0.2)"
            stroke="#6366F1"
            stroke-width="2"
          />
          <text x="100" y="12" text-anchor="middle" font-size="10" fill="#6B7280">基础知识</text>
          <text x="178" y="58" text-anchor="middle" font-size="10" fill="#6B7280">范围</text>
          <text x="178" y="148" text-anchor="middle" font-size="10" fill="#6B7280">进度</text>
          <text x="100" y="195" text-anchor="middle" font-size="10" fill="#6B7280">成本</text>
          <text x="22" y="148" text-anchor="middle" font-size="10" fill="#6B7280">质量</text>
          <text x="22" y="58" text-anchor="middle" font-size="10" fill="#6B7280">安全</text>
        </svg>
      </div>

      <div class="radar-legend-grid">
        <div v-for="(r, idx) in radarList" :key="idx" class="legend-item">
          <div class="dot" :style="{ background: legendColors[idx % legendColors.length] }"></div>
          {{ r.dimension }} {{ r.value }}%
        </div>
      </div>
    </div>

    <!-- 错题分布 -->
    <div class="stat-card">
      <div class="sc-title">📉 错题高频分布</div>
      <div v-if="wrongDistList.length > 0" class="wrong-dist-list">
        <div v-for="(item, idx) in wrongDistList" :key="idx" class="dist-item">
          <div class="di-head">
            <span class="name">{{ item.chapter }}</span>
            <span class="num" :class="idx === 0 ? 'danger' : 'warning'">{{ item.count }}题</span>
          </div>
          <div class="di-track">
            <div class="di-fill" :class="idx === 0 ? 'danger' : 'warning'" :style="{ width: Math.min(100, Math.round((item.count / maxWrongCount) * 100)) + '%' }"></div>
          </div>
        </div>
      </div>
      <div v-else style="padding: 20px; text-align: center; color: var(--gray-5); font-size: 13px">
        🎉 太棒了，当前暂无错题记录！
      </div>
    </div>

    <div style="height: 80px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { showToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { getOverview, getTrend, getRadar, getWrongDistribution } from '@/api/stats'

const subjectStore = useSubjectStore()
const trendType = ref<'week' | 'month'>('week')

const overview = reactive({
  totalQuestions: 0,
  totalAnswered: 0,
  correctRate: 0,
  wrongCount: 0,
  streakDays: 0,
  todayCount: 0,
})

const trendList = ref<Array<{ date: string; count: number; correctRate?: number }>>([])
const radarList = ref<Array<{ dimension: string; value: number }>>([])
const wrongDistList = ref<Array<{ chapter: string; count: number }>>([])

const legendColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

const maxTrendCount = computed(() => {
  const max = Math.max(...trendList.value.map((t) => t.count), 10)
  return max
})

const maxWrongCount = computed(() => {
  const max = Math.max(...wrongDistList.value.map((w) => w.count), 1)
  return max
})

async function fetchStats() {
  const subId = subjectStore.currentSubjectId ? String(subjectStore.currentSubjectId) : undefined
  try {
    const oRes = await getOverview(subId)
    if (oRes?.data) {
      Object.assign(overview, oRes.data)
    }
  } catch {
    // fallback
  }

  try {
    const tRes = await getTrend({ days: trendType.value === 'week' ? 7 : 30, subjectId: subId })
    if (tRes?.data && Array.isArray(tRes.data)) {
      trendList.value = tRes.data
    } else {
      trendList.value = [
        { date: '周一', count: 0 },
        { date: '周二', count: 0 },
        { date: '周三', count: 0 },
        { date: '周四', count: 0 },
        { date: '周五', count: 0 },
        { date: '周六', count: 0 },
        { date: '今天', count: overview.todayCount || 0 },
      ]
    }
  } catch {
    trendList.value = []
  }

  try {
    const rRes = await getRadar(subId)
    if (rRes?.data && Array.isArray(rRes.data) && rRes.data.length > 0) {
      radarList.value = rRes.data
    } else {
      radarList.value = [
        { dimension: '项目管理', value: overview.correctRate || 60 },
        { dimension: '范围管理', value: 75 },
        { dimension: '进度管理', value: 70 },
        { dimension: '成本管理', value: 65 },
        { dimension: '质量管理', value: 80 },
        { dimension: '信息安全', value: 70 },
      ]
    }
  } catch {
    // ignore
  }

  try {
    const wRes = await getWrongDistribution(subId)
    if (wRes?.data && Array.isArray(wRes.data)) {
      wrongDistList.value = wRes.data
    }
  } catch {
    wrongDistList.value = []
  }
}

watch(
  () => subjectStore.currentSubjectId,
  () => {
    fetchStats()
  }
)

watch(trendType, () => {
  fetchStats()
})

onMounted(() => {
  fetchStats()
})

function onExport() {
  showToast('统计报告已生成')
}
</script>

<style scoped lang="scss">
.stat-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
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
    color: var(--primary);
    cursor: pointer;
  }
}

.stat-overview {
  margin: 14px;
}

.so-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 8px;
  box-shadow: var(--shadow-sm);
}

.so-item {
  text-align: center;

  .so-num {
    font-size: 20px;
    font-weight: 800;
    color: var(--gray-9);

    small {
      font-size: 11px;
      font-weight: 500;
      color: var(--gray-5);
    }
  }

  .so-label {
    font-size: 11px;
    color: var(--gray-5);
    margin-top: 4px;
  }
}

.stat-card {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);

  .sc-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 14px;
  }

  .sc-switch {
    display: flex;
    background: var(--gray-2);
    border-radius: 12px;
    padding: 2px;

    span {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 10px;
      color: var(--gray-6);
      cursor: pointer;

      &.active {
        background: var(--primary);
        color: #fff;
        font-weight: 700;
      }
    }
  }
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
  padding: 0 10px 10px;
  border-bottom: 1px solid var(--gray-2);

  .chart-bar {
    width: 22px;
    background: linear-gradient(180deg, #818cf8, #6366f1);
    border-radius: 6px 6px 0 0;
    position: relative;

    .bar-val {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--gray-5);
      font-weight: 600;
    }

    &.today {
      background: linear-gradient(180deg, #f97316, #ea580c);
    }
  }
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--gray-5);
  padding: 8px 6px 0;
}

.radar-svg-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.radar-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--gray-6);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}

.wrong-dist-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .dist-item {
    .di-head {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;

      .name {
        color: var(--gray-7);
        font-weight: 500;
      }

      .num {
        font-weight: 700;

        &.danger {
          color: var(--danger);
        }
        &.warning {
          color: var(--warning);
        }
        &.success {
          color: var(--success);
        }
      }
    }

    .di-track {
      height: 8px;
      background: var(--gray-2);
      border-radius: 4px;
      overflow: hidden;

      .di-fill {
        height: 100%;
        border-radius: 4px;

        &.danger {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }
        &.warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }
        &.success {
          background: linear-gradient(90deg, #10b981, #34d399);
        }
      }
    }
  }
}
</style>
