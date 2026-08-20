<script setup lang="ts">
import { ref } from 'vue'
import { getDashboardStats, type DashboardStats } from '@/api/stats'
import { formatNumber, formatPercent, formatRelativeTime } from '@/utils/format'
import LineChart from '@/components/Charts/LineChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'

const loading = ref(false)
const stats = ref<DashboardStats>({
  totalUsers: 0,
  dailyActive: 0,
  totalQuestions: 0,
  payConversionRate: 0,
  userGrowth: [],
  memberDistribution: [],
  hotSubjects: [],
  todoList: [],
})

const cards = computed(() => [
  { title: '注册用户', value: formatNumber(stats.value.totalUsers), icon: 'User', color: '#2f6bff' },
  { title: '日活用户', value: formatNumber(stats.value.dailyActive), icon: 'Aim', color: '#22c55e' },
  { title: '总刷题量', value: formatNumber(stats.value.totalQuestions), icon: 'Document', color: '#f59e0b' },
  { title: '付费转化率', value: formatPercent(stats.value.payConversionRate), icon: 'Money', color: '#ef4444' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// 会员分布饼图数据
const memberPieData = computed(() =>
  stats.value.memberDistribution.map((m) => ({ name: m.level, value: m.count })),
)
</script>

<template>
  <div v-loading="loading" class="dashboard page-container">
    <!-- 指标卡片 -->
    <el-row :gutter="16" class="dashboard__cards">
      <el-col v-for="card in cards" :key="card.title" :xs="12" :sm="12" :md="6">
        <div class="dashboard__card">
          <div class="dashboard__card-icon" :style="{ background: card.color }">
            <el-icon size="24" color="#fff">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="dashboard__card-body">
            <p class="dashboard__card-value">{{ card.value }}</p>
            <p class="dashboard__card-title">{{ card.title }}</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" class="dashboard__charts">
      <el-col :xs="24" :md="16">
        <div class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h3>用户增长趋势</h3>
          </div>
          <LineChart
            :series="[{ name: '新增用户', data: stats.userGrowth.map((u) => u.count) }]"
            :x-axis="stats.userGrowth.map((u) => u.date)"
            height="320px"
          />
        </div>
      </el-col>
      <el-col :xs="24" :md="8">
        <div class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h3>会员转化分布</h3>
          </div>
          <PieChart :data="memberPieData" ring height="320px" />
        </div>
      </el-col>
    </el-row>

    <!-- 待办 & 热门科目 -->
    <el-row :gutter="16" class="dashboard__charts">
      <el-col :xs="24" :md="12">
        <div class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h3>待办事项</h3>
          </div>
          <el-empty v-if="!stats.todoList.length" description="暂无待办" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="todo in stats.todoList"
              :key="todo.id"
              :timestamp="formatRelativeTime(todo.createdAt)"
              placement="top"
            >
              <el-tag size="small" type="warning">{{ todo.type }}</el-tag>
              <span style="margin-left: 8px">{{ todo.title }}</span>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h3>热门科目排行</h3>
          </div>
          <el-empty v-if="!stats.hotSubjects.length" description="暂无数据" />
          <ul v-else class="dashboard__rank">
            <li v-for="(item, idx) in stats.hotSubjects" :key="idx" class="dashboard__rank-item">
              <span class="dashboard__rank-no" :class="{ 'is-top': idx < 3 }">{{ idx + 1 }}</span>
              <span class="dashboard__rank-name">{{ item.subjectName }}</span>
              <span class="dashboard__rank-count">{{ formatNumber(item.count) }} 题</span>
            </li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  &__cards {
    margin-bottom: 16px;
  }

  &__card {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    margin-bottom: 16px;

    &-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--app-text-primary);
    }

    &-title {
      font-size: 13px;
      color: var(--app-text-secondary);
      margin-top: 4px;
    }
  }

  &__charts {
    margin-bottom: 16px;
  }

  &__panel {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

    &-header {
      margin-bottom: 12px;
      h3 {
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  &__rank {
    &-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--app-border-color);
      &:last-child {
        border-bottom: none;
      }
    }

    &-no {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: #e4e7ed;
      color: #909399;
      text-align: center;
      line-height: 24px;
      font-size: 12px;
      flex-shrink: 0;

      &.is-top {
        background: #2f6bff;
        color: #fff;
      }
    }

    &-name {
      flex: 1;
      font-size: 14px;
    }

    &-count {
      font-size: 13px;
      color: var(--app-text-secondary);
    }
  }
}
</style>
