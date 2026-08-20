<template>
  <div class="stats-page">
    <van-nav-bar title="数据统计" :border="false" />

    <!-- 四项总览 -->
    <div class="overview-grid">
      <div class="ov-card" v-for="item in overviews" :key="item.label">
        <p class="ov-num">{{ item.value }}</p>
        <p class="ov-label">{{ item.label }}</p>
      </div>
    </div>

    <!-- 刷题趋势 -->
    <div class="card section-block">
      <div class="block-title-row">
        <h4 class="block-title">刷题趋势</h4>
        <van-tabs v-model:active="trendTab" shrink type="card" @change="loadTrend">
          <van-tab title="7天" name="7" />
          <van-tab title="30天" name="30" />
        </van-tabs>
      </div>
      <div class="trend-chart">
        <div
          v-for="(t, i) in trendData"
          :key="i"
          class="trend-col"
        >
          <div class="trend-bar-wrap">
            <div class="trend-bar" :style="{ height: barHeight(t.count) + '%' }"></div>
          </div>
          <span class="trend-label">{{ t.date.slice(5) }}</span>
          <span class="trend-num">{{ t.count }}</span>
        </div>
      </div>
    </div>

    <!-- 能力雷达图 -->
    <div class="card section-block">
      <h4 class="block-title">能力雷达</h4>
      <div class="radar-bars">
        <div v-for="(d, i) in radarData" :key="i" class="radar-bar-item">
          <div class="bar-track">
            <div class="bar-fill" :style="{ height: (d.value / d.full) * 100 + '%' }"></div>
          </div>
          <span class="bar-label">{{ d.dimension }}</span>
          <span class="bar-num">{{ Math.round((d.value / d.full) * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 错题分布 -->
    <div class="card section-block">
      <h4 class="block-title">错题分布</h4>
      <div
        v-for="w in wrongDist"
        :key="w.chapter"
        class="dist-row"
      >
        <span class="dist-name text-ellipsis">{{ w.chapter }}</span>
        <van-progress
          :percentage="Math.round((w.count / maxWrong) * 100)"
          stroke-width="6"
          color="#EF4444"
          :show-pivot="false"
        />
        <span class="dist-num">{{ w.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getOverview, getTrend, getRadar, getWrongDistribution } from '@/api/stats'
import { toPercent, formatDurationText } from '@/utils/format'

const overview = ref({ totalQuestions: 2400, totalAnswered: 326, correctRate: 0.78, duration: 10800, streakDays: 12, todayCount: 25 })
const trendTab = ref('7')
const trendData = ref<Array<{ date: string; count: number }>>([])
const radarData = ref<Array<{ dimension: string; value: number; full: number }>>([])
const wrongDist = ref<Array<{ chapter: string; count: number }>>([])

const maxWrong = computed(() => Math.max(...wrongDist.value.map((w) => w.count), 1))
const maxTrend = computed(() => Math.max(...trendData.value.map((t) => t.count), 1))

const overviews = computed(() => [
  { label: '总题数', value: overview.value.totalAnswered },
  { label: '正确率', value: toPercent(overview.value.correctRate, 0) },
  { label: '做题时长', value: formatDurationText(overview.value.duration) },
  { label: '连续天数', value: overview.value.streakDays + '天' }
])

function barHeight(count: number) {
  return maxTrend.value ? Math.round((count / maxTrend.value) * 100) : 0
}

async function loadTrend() {
  try {
    const res = await getTrend({ days: Number(trendTab.value) })
    trendData.value = res.data
  } catch {
    trendData.value = [
      { date: '08-14', count: 30 },
      { date: '08-15', count: 45 },
      { date: '08-16', count: 20 },
      { date: '08-17', count: 60 },
      { date: '08-18', count: 50 },
      { date: '08-19', count: 40 },
      { date: '08-20', count: 25 }
    ]
  }
}

onMounted(async () => {
  try {
    const [o, r, w] = await Promise.all([getOverview(), getRadar(), getWrongDistribution()])
    overview.value = o.data
    radarData.value = r.data
    wrongDist.value = w.data
  } catch {
    radarData.value = [
      { dimension: '计算机基础', value: 80, full: 100 },
      { dimension: '数据结构', value: 65, full: 100 },
      { dimension: '操作系统', value: 72, full: 100 },
      { dimension: '网络', value: 55, full: 100 },
      { dimension: '数据库', value: 70, full: 100 },
      { dimension: '软件工程', value: 85, full: 100 }
    ]
    wrongDist.value = [
      { chapter: '第6章 软件工程', count: 15 },
      { chapter: '第5章 计算机网络', count: 12 },
      { chapter: '第3章 操作系统', count: 8 },
      { chapter: '第2章 数据结构', count: 6 }
    ]
  }
  loadTrend()
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.stats-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding: 0 var(--space-lg) calc(var(--tabbar-height) + var(--safe-bottom) + var(--space-lg));
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  margin: var(--space-lg) 0;
}

.ov-card {
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--gradient-primary);
  }
}

.ov-num {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.ov-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

.section-block {
  margin-bottom: var(--space-lg);
  padding: var(--space-lg);
}

.block-title-row {
  @include flex-between;
  margin-bottom: var(--space-lg);

  .block-title {
    margin: 0;
  }

  :deep(.van-tabs) {
    width: auto;
  }
}

.block-title {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

/* Trend chart */
.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  gap: 4px;
}

.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.trend-bar-wrap {
  width: 16px;
  height: 110px;
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-end;
}

.trend-bar {
  width: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-sm);
  min-height: 2px;
  transition: height var(--transition-base);
}

.trend-label {
  font-size: 9px;
  color: var(--text-secondary);
}

.trend-num {
  font-size: 10px;
  color: var(--color-primary);
  font-weight: 600;
}

/* Radar */
.radar-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 140px;
}

.radar-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 14%;
}

.bar-track {
  width: 18px;
  height: 100px;
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-sm);
  transition: height var(--transition-slow);
}

.bar-label {
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  @include text-ellipsis(1);
  width: 100%;
}

.bar-num {
  font-size: 10px;
  color: var(--color-primary);
  font-weight: 600;
}

/* Dist */
.dist-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);

  &:last-child {
    margin: 0;
  }
}

.dist-name {
  width: 100px;
  font-size: var(--font-size-sm);
  color: var(--text-regular);
  flex-shrink: 0;
}

.dist-row :deep(.van-progress) {
  flex: 1;
}

.dist-num {
  width: 30px;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}
</style>
