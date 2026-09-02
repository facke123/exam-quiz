<template>
  <div v-loading="loading" class="dashboard-page">
    <!-- 顶部欢迎与快速操作栏 -->
    <div class="dash-header">
      <div class="dh-left">
        <h2 class="dh-title">软考在线题库运营中枢</h2>
        <p class="dh-desc">
          数据直连生产数据库实时统计 · 最后同步时间：{{ lastSyncTime }}
        </p>
      </div>
      <div class="dh-right">
        <el-button
          type="primary"
          plain
          size="default"
          :loading="loading"
          @click="fetchData(currentTab)"
        >
          🔄 刷新实时数据
        </el-button>
        <el-button
          v-if="stats.pendingOrderCount > 0"
          type="danger"
          size="default"
          @click="$router.push('/user/vip')"
        >
          ⚡ 有 {{ stats.pendingOrderCount }} 笔待审核转账
        </el-button>
      </div>
    </div>

    <!-- 4大核心统计卡片 -->
    <div class="stat-cards">
      <!-- 1. 今日刷题量 -->
      <div class="stat-card">
        <div class="sc-icon bg-indigo">📝</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.todayPracticeCount || 0) }}</div>
          <div class="sc-label">今日刷题量 (题)</div>
          <div class="sc-sub">
            累计刷题 <b>{{ formatNumber(stats.totalPracticeCount || 0) }}</b> 次 · 共
            <b>{{ formatNumber(stats.totalQuestionsAnswered || 0) }}</b> 题
          </div>
        </div>
      </div>

      <!-- 2. 今日活跃学员 -->
      <div class="stat-card">
        <div class="sc-icon bg-green">👥</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.dailyActive || 0) }}</div>
          <div class="sc-label">今日活跃学员 (人)</div>
          <div class="sc-sub">
            注册学员 <b>{{ formatNumber(stats.totalUsers || 0) }}</b> 人 (今日新增
            <b>+{{ stats.todayNewUsers || 0 }}</b>)
          </div>
        </div>
      </div>

      <!-- 3. 今日新增付费 -->
      <div class="stat-card">
        <div class="sc-icon bg-orange">💰</div>
        <div class="sc-info">
          <div class="sc-num">¥{{ formatNumber(stats.todayRevenue || 0) }}</div>
          <div class="sc-label">今日新增营收 (元)</div>
          <div class="sc-sub">
            VIP会员 <b>{{ formatNumber(stats.vipUsers || 0) }}</b> 人 · 累计营收
            <b>¥{{ formatNumber(stats.totalRevenue || 0) }}</b>
          </div>
        </div>
      </div>

      <!-- 4. 题库总题量 -->
      <div class="stat-card">
        <div class="sc-icon bg-purple">📚</div>
        <div class="sc-info">
          <div class="sc-num">{{ formatNumber(stats.totalQuestions || 0) }}</div>
          <div class="sc-label">题库总题量 (道)</div>
          <div class="sc-sub">
            已上线 <b>{{ stats.totalPapers || 0 }}</b> 套试卷 ·
            <b>{{ stats.totalKnowledgePoints || stats.totalChapters || 0 }}</b> 个知识考点
          </div>
        </div>
      </div>
    </div>

    <!-- 核心图表区域 -->
    <div class="chart-row">
      <!-- 刷题趋势图 (动态 7天 / 30天 / 本月) -->
      <div class="panel">
        <div class="panel-title">
          <span>📈 刷题量做题趋势分析</span>
          <div class="pt-actions">
            <span
              v-for="t in trendTabs"
              :key="t.key"
              class="pta"
              :class="{ active: currentTab === t.key }"
              @click="handleTabChange(t.key)"
            >
              {{ t.label }}
            </span>
          </div>
        </div>

        <div v-if="stats.chartData && stats.chartData.length > 0" class="bar-chart-wrap">
          <div class="bar-chart">
            <div
              v-for="(item, idx) in stats.chartData"
              :key="item.date || item.day || idx"
              class="bar-item"
            >
              <div
                class="bar"
                :style="{ height: item.height + '%' }"
                :title="`${item.day || item.date} 答题: ${item.count} 道`"
              >
                <span class="bar-val">{{ item.val || item.count }}</span>
              </div>
              <span class="bar-label">{{ item.day || item.date }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-chart">暂无刷题数据记录</div>
      </div>

      <!-- 题型真实分布环形图 -->
      <div class="panel">
        <div class="panel-title">
          <span>📊 题库题型分布</span>
        </div>
        <div class="donut-box">
          <div class="donut-svg-wrap">
            <svg viewBox="0 0 100 100" class="donut-svg">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" stroke-width="14" />
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
              <span>案例分析 ({{ qDist.casePercent || 0 }}%)</span>
              <span class="num">{{ qDist.case || 0 }} 道</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 待办处理与会员构成 -->
    <div class="chart-row">
      <!-- 待办运营事项 -->
      <div class="panel">
        <div class="panel-title">
          <span>📋 运营待办事项与审核</span>
          <span class="pt-sub">直连各业务模块一键处理</span>
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
                background:
                  item.type === 'vip_order'
                    ? '#FEF3C7'
                    : item.type === 'error_report'
                      ? '#FEF2F2'
                      : item.type === 'paper'
                        ? '#F0FDF4'
                        : '#EEF2FF',
                color:
                  item.type === 'vip_order'
                    ? '#D97706'
                    : item.type === 'error_report'
                      ? '#EF4444'
                      : item.type === 'paper'
                        ? '#16A34A'
                        : '#4A6CF7',
              }"
            >
              {{
                item.type === 'vip_order'
                  ? '💳'
                  : item.type === 'error_report'
                    ? '⚠️'
                    : item.type === 'paper'
                      ? '📑'
                      : '🤖'
              }}
            </div>
            <div class="ti-text">
              <div class="t">
                {{ item.title }}
                <el-tag
                  v-if="item.count > 0"
                  :type="item.type === 'vip_order' ? 'warning' : 'danger'"
                  size="small"
                  style="margin-left: 6px;"
                >
                  {{ item.count }}
                </el-tag>
              </div>
              <div class="d">{{ item.desc }}</div>
            </div>
            <button
              class="ti-btn"
              :class="{ urgent: item.count > 0 && item.type === 'vip_order' }"
              @click="$router.push(item.route)"
            >
              {{ item.btnText || '去处理' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 会员等级真实分布 -->
      <div class="panel">
        <div class="panel-title">
          <span>👑 学员与 VIP 构成分布</span>
          <span class="pt-sub">总注册 {{ stats.totalUsers || 0 }} 人</span>
        </div>
        <div class="member-dist-box">
          <div
            v-for="m in (stats.memberDistribution || defaultMemberDist)"
            :key="m.level"
            class="md-row"
          >
            <div class="md-header">
              <span class="md-name">{{ m.level }}</span>
              <span class="md-count">{{ m.count }} 人 ({{ m.percent || 0 }}%)</span>
            </div>
            <div class="md-bar-bg">
              <div
                class="md-bar-fill"
                :class="getMemberLevelClass(m.level)"
                :style="{ width: (m.percent || 0) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门科目排行与最新充值流水 -->
    <div class="chart-row">
      <!-- 热门软考科目 -->
      <div class="panel">
        <div class="panel-title">
          <span>🔥 热门软考科目排行</span>
          <span class="pt-sub">按学员做题与题库容量排序</span>
        </div>
        <div v-if="stats.hotSubjects && stats.hotSubjects.length > 0" class="hot-subjects">
          <div
            v-for="(sub, i) in stats.hotSubjects"
            :key="sub.name"
            class="hs-item"
          >
            <span class="hs-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <span class="hs-name" :title="sub.name">{{ sub.name }}</span>
            <div class="hs-bar-wrap">
              <div class="hs-bar" :style="{ width: (sub.percent || 10) + '%' }" />
            </div>
            <span class="hs-count">
              <b>{{ sub.practiceCount || 0 }}</b> 次做题 · {{ sub.questionCount || 0 }} 题
            </span>
          </div>
        </div>
        <div v-else class="empty-chart">暂无科目统计数据</div>
      </div>

      <!-- 最新 VIP 充值与流水记录 -->
      <div class="panel">
        <div class="panel-title">
          <span>💳 最新充值订单流水</span>
          <el-button link type="primary" size="small" @click="$router.push('/user/vip')">
            查看全部 &gt;
          </el-button>
        </div>
        <div v-if="stats.recentOrders && stats.recentOrders.length > 0" class="recent-orders-list">
          <div
            v-for="order in stats.recentOrders"
            :key="order.id"
            class="ro-item"
          >
            <div class="ro-left">
              <div class="ro-user">
                <span class="username">{{ order.username }}</span>
                <el-tag size="small" effect="plain" style="margin-left: 6px;">{{ order.planName }}</el-tag>
              </div>
              <div class="ro-sub">
                单号: {{ order.orderNo }} · {{ order.createdAt }}
              </div>
            </div>
            <div class="ro-right">
              <div class="ro-amount">¥{{ order.amount }}</div>
              <el-tag
                :type="order.payStatus === 'paid' ? 'success' : order.payStatus === 'pending' ? 'warning' : 'info'"
                size="small"
              >
                {{ order.payStatus === 'paid' ? '已支付' : order.payStatus === 'pending' ? '待审核' : '已退款' }}
              </el-tag>
            </div>
          </div>
        </div>
        <div v-else class="empty-chart">暂无充值订单流水</div>
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
const lastSyncTime = ref('')

const trendTabs = [
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: 'month', label: '本月' },
]

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
    title: '待审核 VIP 充值转账（0笔）',
    desc: '考生通过个人微信/支付宝扫码转账提交的开通核销申请',
    type: 'vip_order',
    route: '/user/vip',
    btnText: '去核销',
    count: 0,
  },
  {
    id: 2,
    title: '考生纠错反馈待处理（0条）',
    desc: '考生提交的题干疑问与解析异议反馈待核实答复',
    type: 'error_report',
    route: '/question/error-report',
    btnText: '去处理',
    count: 0,
  },
  {
    id: 3,
    title: '草稿/未发布试卷待上线（0套）',
    desc: '真题及模拟试卷组卷完成后待审核发布上线',
    type: 'paper',
    route: '/exam/paper',
    btnText: '去发布',
    count: 0,
  },
  {
    id: 4,
    title: '待审核 AI 生成题目（0道）',
    desc: '由大模型智能命题生成，等待人工复核校验入库',
    type: 'ai_question',
    route: '/ai/generate',
    btnText: '去审核',
    count: 0,
  },
]

const defaultMemberDist = [
  { level: '免费学员', count: 0, percent: 100 },
  { level: '月卡会员', count: 0, percent: 0 },
  { level: '季卡会员', count: 0, percent: 0 },
  { level: '年卡会员', count: 0, percent: 0 },
  { level: '永久尊享会员', count: 0, percent: 0 },
]

function getMemberLevelClass(level: string) {
  if (level.includes('永久')) return 'fill-gold'
  if (level.includes('年卡')) return 'fill-purple'
  if (level.includes('季卡')) return 'fill-blue'
  if (level.includes('月卡')) return 'fill-green'
  return 'fill-gray'
}

function handleTabChange(tabKey: string) {
  currentTab.value = tabKey
  fetchData(tabKey)
}

async function fetchData(range: string = '7d') {
  loading.value = true
  try {
    const res = await getDashboardStats(range)
    if (res?.data) {
      stats.value = res.data
      lastSyncTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  lastSyncTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  fetchData('7d')
})
</script>

<style scoped lang="scss">
.dashboard-page {
  padding: 24px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .dh-left {
    .dh-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .dh-desc {
      font-size: 12.5px;
      color: #64748b;
      margin: 4px 0 0;
    }
  }

  .dh-right {
    display: flex;
    gap: 10px;
  }
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
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;

  .sc-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;

    &.bg-indigo {
      background: #eef2ff;
      color: #4f46e5;
    }
    &.bg-green {
      background: #f0fdf4;
      color: #16a34a;
    }
    &.bg-orange {
      background: #fff7ed;
      color: #ea580c;
    }
    &.bg-purple {
      background: #f5f3ff;
      color: #9333ea;
    }
  }

  .sc-info {
    flex: 1;
    min-width: 0;

    .sc-num {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .sc-label {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
    }

    .sc-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      b {
        color: #334155;
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
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .pt-sub {
      font-size: 12px;
      font-weight: 400;
      color: #94a3b8;
    }

    .pt-actions {
      display: flex;
      gap: 6px;

      .pta {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        background: #f1f5f9;
        font-weight: 500;
        transition: all 0.2s;

        &.active {
          background: #4a6cf7;
          color: #fff;
          font-weight: 600;
        }

        &:hover:not(.active) {
          background: #e2e8f0;
        }
      }
    }
  }
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: #94a3b8;
  font-size: 13px;
}

.bar-chart-wrap {
  width: 100%;
  overflow-x: auto;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding-top: 24px;
  gap: 8px;
  min-width: 280px;

  .bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    height: 100%;
    justify-content: flex-end;
    gap: 8px;

    .bar {
      width: 100%;
      max-width: 32px;
      background: linear-gradient(180deg, #4a6cf7 0%, rgba(74, 108, 247, 0.25) 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 4px;

      &:hover {
        background: linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.4) 100%);
      }

      .bar-val {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        white-space: nowrap;
      }
    }

    .bar-label {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
    }
  }
}

.donut-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .donut-svg-wrap {
    width: 130px;
    height: 130px;
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
        font-weight: 800;
        color: #0f172a;
      }
      .total-text {
        font-size: 11px;
        color: #64748b;
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
      color: #475569;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }

      .num {
        margin-left: auto;
        font-weight: 700;
        color: #0f172a;
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
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #f1f5f9;

    .ti-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
    }

    .ti-text {
      flex: 1;
      min-width: 0;

      .t {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
      }
      .d {
        font-size: 11.5px;
        color: #64748b;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .ti-btn {
      padding: 5px 12px;
      background: #4a6cf7;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      transition: opacity 0.2s;

      &.urgent {
        background: #ea580c;
      }

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.member-dist-box {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .md-row {
    .md-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 5px;

      .md-name {
        color: #334155;
        font-weight: 600;
      }

      .md-count {
        color: #64748b;
      }
    }

    .md-bar-bg {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;

      .md-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease;

        &.fill-gold {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }
        &.fill-purple {
          background: linear-gradient(90deg, #8b5cf6, #a78bfa);
        }
        &.fill-blue {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        &.fill-green {
          background: linear-gradient(90deg, #10b981, #34d399);
        }
        &.fill-gray {
          background: #cbd5e1;
        }
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
    font-size: 12.5px;

    .hs-rank {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      flex-shrink: 0;

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
        color: #f59e0b;
      }
    }

    .hs-name {
      width: 170px;
      color: #1e293b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }

    .hs-bar-wrap {
      flex: 1;
      height: 7px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;

      .hs-bar {
        height: 100%;
        background: linear-gradient(90deg, #4a6cf7 0%, #818cf8 100%);
        border-radius: 4px;
      }
    }

    .hs-count {
      font-size: 11.5px;
      color: #64748b;
      min-width: 120px;
      text-align: right;
      flex-shrink: 0;

      b {
        color: #0f172a;
      }
    }
  }
}

.recent-orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .ro-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #f1f5f9;

    .ro-left {
      .ro-user {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
        display: flex;
        align-items: center;
      }
      .ro-sub {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 3px;
      }
    }

    .ro-right {
      text-align: right;

      .ro-amount {
        font-size: 14px;
        font-weight: 800;
        color: #ea580c;
        margin-bottom: 3px;
      }
    }
  }
}
</style>

