<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  getUserGrowth,
  getPracticeStats,
  getQuestionQuality,
  getTopWrongQuestions,
  getRevenueStats,
} from '@/api/stats'
import LineChart from '@/components/Charts/LineChart.vue'
import BarChart from '@/components/Charts/BarChart.vue'
import { formatNumber, formatPercent, formatDateTime } from '@/utils/format'
import dayjs from 'dayjs'

const loading = ref(false)
const dateRange = ref<[string, string]>([
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])

const userGrowth = ref<{ date: string; count: number }[]>([])
const practiceStats = ref<{ date: string; count: number; correctRate: number }[]>([])
const questionQuality = ref<{ subject: string; total: number; avgCorrectRate: number }[]>([])
const topWrongQuestions = ref<{ id: number; title: string; wrongCount: number; wrongRate: number }[]>([])
const revenue = ref<{ date: string; revenue: number; orders: number }[]>([])

// 快捷时间范围
const shortcuts = [
  { text: '近7天', value: () => [dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] as [string, string] },
  { text: '近30天', value: () => [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] as [string, string] },
  { text: '近90天', value: () => [dayjs().subtract(90, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')] as [string, string] },
]

async function fetchAll() {
  if (!dateRange.value) return
  loading.value = true
  const [start, end] = dateRange.value
  try {
    const [ug, ps, qq, tw, rv] = await Promise.all([
      getUserGrowth({ startDate: start, endDate: end }),
      getPracticeStats({ startDate: start, endDate: end }),
      getQuestionQuality(),
      getTopWrongQuestions({ limit: 5 }),
      getRevenueStats({ startDate: start, endDate: end }),
    ])
    userGrowth.value = ug.data
    practiceStats.value = ps.data
    questionQuality.value = qq.data
    topWrongQuestions.value = tw.data
    revenue.value = rv.data
  } finally {
    loading.value = false
  }
}

// 营收汇总
const revenueSummary = computed(() => {
  const total = revenue.value.reduce((s, r) => s + r.revenue, 0)
  const orders = revenue.value.reduce((s, r) => s + r.orders, 0)
  return { total, orders }
})

function handleDateChange() {
  fetchAll()
}

onMounted(fetchAll)
</script>

<template>
  <div v-loading="loading" class="stats-overview page-container">
    <!-- 时间范围选择 -->
    <div class="stats-toolbar">
      <span>时间范围：</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="shortcuts"
        @change="handleDateChange"
      />
    </div>

    <!-- 用户增长 & 做题量 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <div class="stats-panel">
          <h3>用户增长趋势</h3>
          <LineChart
            :series="[{ name: '新增用户', data: userGrowth.map((u) => u.count) }]"
            :x-axis="userGrowth.map((u) => u.date)"
            height="300px"
          />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stats-panel">
          <h3>做题量趋势</h3>
          <LineChart
            :series="[
              { name: '做题量', data: practiceStats.map((p) => p.count) },
              { name: '正确率(%)', data: practiceStats.map((p) => Math.round(p.correctRate * 100)) },
            ]"
            :x-axis="practiceStats.map((p) => p.date)"
            height="300px"
          />
        </div>
      </el-col>
    </el-row>

    <!-- 题目质量 & 高频错题 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <div class="stats-panel">
          <h3>题目质量分析</h3>
          <BarChart
            :series="[{ name: '题目数', data: questionQuality.map((q) => q.total) }]"
            :x-axis="questionQuality.map((q) => q.subject)"
            height="300px"
          />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stats-panel">
          <h3>高频错题 Top5</h3>
          <el-table :data="topWrongQuestions" border style="width: 100%">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="title" label="题目" show-overflow-tooltip />
            <el-table-column prop="wrongCount" label="错误次数" width="100" align="center">
              <template #default="{ row }">{{ formatNumber(row.wrongCount) }}</template>
            </el-table-column>
            <el-table-column prop="wrongRate" label="错误率" width="90" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ formatPercent(row.wrongRate) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <!-- 营收数据 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <div class="stats-panel">
          <div class="stats-panel__header">
            <h3>营收数据</h3>
            <div class="stats-summary">
              <span>总营收：<strong>¥{{ formatNumber(revenueSummary.total) }}</strong></span>
              <span>订单数：<strong>{{ formatNumber(revenueSummary.orders) }}</strong></span>
            </div>
          </div>
          <BarChart
            :series="[
              { name: '营收(元)', data: revenue.map((r) => r.revenue) },
              { name: '订单数', data: revenue.map((r) => r.orders) },
            ]"
            :x-axis="revenue.map((r) => r.date)"
            height="300px"
          />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.stats-toolbar {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-panel {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
}

.stats-summary {
  display: flex;
  gap: 24px;
  font-size: 14px;

  strong {
    color: var(--el-color-danger);
    font-size: 16px;
  }
}
</style>
