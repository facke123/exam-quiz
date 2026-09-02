<template>
  <div class="daily-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title">每日一练 · 智能打卡</div>
      <div class="subject-tag">{{ currentSubjectName }}</div>
    </div>

    <div class="daily-content">
      <!-- 1. 今日打卡状态与进度 Hero 卡片 (极大增强状态区分) -->
      <div class="daily-hero-card" :class="{ completed: isCompleted }">
        <div class="dh-top">
          <div class="date-badge" :class="{ 'date-done': isCompleted }">
            <div class="date-day">{{ currentDay }}</div>
            <div class="date-month">{{ currentMonth }}月</div>
            <div v-if="isCompleted" class="date-crown">✓</div>
          </div>
          <div class="dh-info">
            <div class="dh-status-tag" :class="{ 'status-done': isCompleted }">
              {{ isCompleted ? '🎉 今日打卡已达成！' : '⏳ 今日待打卡 · 核心考点精选' }}
            </div>
            <div class="dh-title">
              {{ isCompleted ? `今日战绩：${todayScore !== undefined ? todayScore + '分' : '已完成自测'}` : `今日精选 ${selectedCount} 题核心考点` }}
            </div>
            <div class="dh-desc">
              {{ isCompleted ? `今日已答 ${completedCount} 题 · 知识点巩固达成` : '智能覆盖软考高频易错点 · 碎片时间高效提分' }}
            </div>
          </div>
        </div>

        <div class="dh-progress-box">
          <div class="dp-track">
            <div
              class="dp-fill"
              :class="{ 'fill-done': isCompleted }"
              :style="{ width: `${isCompleted ? 100 : progress}%` }"
            />
          </div>
          <div class="dp-labels">
            <span class="dpl-left">
              {{ isCompleted ? `今日已完成打卡 (${completedCount}/20题)` : `打卡进度: ${completedCount}/${selectedCount} 题` }}
            </span>
            <span class="dpl-right">
              {{ isCompleted ? '🎯 100% 达成' : `${progress}%` }}
            </span>
          </div>
        </div>

        <!-- 已完成状态快捷操作 -->
        <div v-if="isCompleted" class="dh-actions">
          <button class="dh-btn report" @click="onViewReport">
            📊 查看今日答题报告
          </button>
          <button class="dh-btn poster" @click="showPoster = true">
            🏆 分享打卡成就
          </button>
        </div>
      </div>

      <!-- 2. 本周打卡日历（当前周真实状态与高精度高亮） -->
      <div class="streak-card">
        <div class="sc-header">
          <div class="sc-title">
            <span class="fire-icon">🔥</span>
            <span>坚持打卡 · 每日提分</span>
          </div>
          <div class="sc-stats">
            <span class="sc-badge fire">已连续 <b>{{ streakDays }}</b> 天</span>
            <span class="sc-badge total">累计 <b>{{ totalCheckinDays }}</b> 天</span>
          </div>
        </div>

        <!-- 7天周历网格 -->
        <div class="streak-grid">
          <div
            v-for="(d, i) in weekDays"
            :key="i"
            class="streak-item"
            :class="{
              done: d.done,
              'today-done': d.isToday && d.done,
              'today-pending': d.isToday && !d.done,
              past: d.isPast && !d.done,
              future: d.isFuture,
            }"
            @click="onDayClick(d)"
          >
            <span class="streak-day" :class="{ 'text-today': d.isToday }">
              {{ d.isToday ? '今天' : d.label }}
            </span>

            <div class="streak-mark-wrap">
              <div class="streak-mark">
                <!-- 今日已完成 -->
                <span v-if="d.isToday && d.done" class="mark-icon done-check">✓</span>
                <!-- 今日待完成 -->
                <span v-else-if="d.isToday && !d.done" class="mark-icon today-target">🎯</span>
                <!-- 历史已完成 -->
                <span v-else-if="d.done" class="mark-icon past-check">✓</span>
                <!-- 历史漏打卡 -->
                <span v-else-if="d.isPast" class="mark-icon past-missed">○</span>
                <!-- 未来锁定 -->
                <span v-else class="mark-icon future-lock">🔒</span>
              </div>
            </div>

            <span class="streak-sub-label">
              {{ d.isToday ? (d.done ? '已打卡' : '待打卡') : (d.done ? `${d.count || 1}题` : (d.isPast ? '未打卡' : '待开启')) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. 题量模式切换（碎片时间定制） -->
      <div class="mode-select-card">
        <div class="msc-title">⏱️ 答题模式定制</div>
        <div class="msc-grid">
          <div
            class="msc-item"
            :class="{ active: selectedCount === 10 }"
            @click="selectedCount = 10"
          >
            <div class="msc-count">⚡ 快速 10 题</div>
            <div class="msc-desc">约 5 分钟 · 晨读速测</div>
          </div>
          <div
            class="msc-item"
            :class="{ active: selectedCount === 20 }"
            @click="selectedCount = 20"
          >
            <div class="msc-badge">推荐</div>
            <div class="msc-count">🎯 标准 20 题</div>
            <div class="msc-desc">约 10 分钟 · 全面考点</div>
          </div>
          <div
            class="msc-item"
            :class="{ active: selectedCount === 30 }"
            @click="selectedCount = 30"
          >
            <div class="msc-count">🚀 深度 30 题</div>
            <div class="msc-desc">约 15 分钟 · 高分强化</div>
          </div>
        </div>
      </div>

      <!-- 4. 今日精选考点雷达 -->
      <div v-if="todayTopics && todayTopics.length > 0" class="topics-card">
        <div class="tc-header">
          <span class="tc-title">📚 今日考点精选分布</span>
          <span class="tc-tip">按软考考纲高频命题</span>
        </div>
        <div class="tc-tags">
          <div
            v-for="(t, idx) in todayTopics"
            :key="t.id || idx"
            class="tc-tag"
          >
            <span class="tct-dot" />
            <span class="tct-name">{{ t.name }}</span>
          </div>
        </div>
      </div>

      <!-- 5. 趣味连胜里程碑成就 -->
      <div class="milestones-card">
        <div class="mc-header">
          <span class="mc-title">🏆 打卡里程碑与成长勋章</span>
          <span class="mc-sub">坚持打卡解锁专属勋章</span>
        </div>
        <div class="milestones-grid">
          <div
            v-for="m in milestones"
            :key="m.days"
            class="milestone-item"
            :class="{ reached: m.reached }"
          >
            <div class="ms-icon-wrap">
              <span class="ms-icon">{{ m.icon }}</span>
              <span v-if="m.reached" class="ms-check">✓</span>
            </div>
            <span class="ms-name">{{ m.title }}</span>
            <span class="ms-days">{{ m.days }}天连胜</span>
          </div>
        </div>
      </div>

      <!-- 6. 艾宾浩斯抗遗忘备考贴士 -->
      <div class="tips-banner">
        <span class="tb-icon">🧠</span>
        <div class="tb-text">
          <b>艾宾浩斯记忆定律</b>：每日坚持完成 {{ selectedCount }} 题智能自测，30 天考点复习覆盖率超 85%，有效降低遗忘率 60%+！
        </div>
      </div>

      <!-- 7. 开始刷题操作按钮 -->
      <div class="bottom-bar">
        <button class="start-btn" :class="{ 'btn-secondary': isCompleted }" @click="onStart">
          {{ isCompleted ? `🔄 再次自测刷题（${selectedCount}题）` : `🎯 开启今日打卡挑战（${selectedCount}题）` }}
        </button>
      </div>
    </div>

    <!-- 打卡成就分享弹窗 -->
    <van-popup
      v-model:show="showPoster"
      round
      closeable
      position="center"
      :style="{ width: '85%', maxWidth: '340px' }"
    >
      <div class="poster-card">
        <div class="pc-header">
          <div class="pc-badge">🏆 软考备考打卡成功</div>
          <div class="pc-date">{{ currentMonth }}月{{ currentDay }}日 · 今日成就</div>
        </div>
        <div class="pc-body">
          <div class="pc-avatar-wrap">
            <span class="pc-avatar-icon">👑</span>
          </div>
          <div class="pc-username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '软考学霸' }}</div>
          <div class="pc-streak-num">
            已连续打卡 <strong>{{ streakDays }}</strong> 天
          </div>
          <div class="pc-stats-row">
            <div class="pcs-item">
              <div class="pcs-val">{{ totalCheckinDays }}</div>
              <div class="pcs-lbl">累计打卡(天)</div>
            </div>
            <div class="pcs-item">
              <div class="pcs-val">{{ completedCount || selectedCount }}</div>
              <div class="pcs-lbl">今日刷题(道)</div>
            </div>
            <div class="pcs-item">
              <div class="pcs-val">{{ todayScore !== undefined ? todayScore : 100 }}</div>
              <div class="pcs-lbl">今日得分(分)</div>
            </div>
          </div>
          <div class="pc-quote">
            “不积跬步，无以至千里。每一次坚持刷题，都是通往软考通过的坚定基石！”
          </div>
        </div>
        <div class="pc-footer">
          <van-button
            type="primary"
            round
            block
            color="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            @click="onCopyPosterText"
          >
            📋 复制打卡文案发朋友圈 / 社群
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useSubjectStore } from '@/stores/subject'
import { useUserStore } from '@/stores/user'
import { getDailyStatus } from '@/api/quiz'

const router = useRouter()
const subjectStore = useSubjectStore()
const userStore = useUserStore()

const currentSubjectName = computed(() => {
  return subjectStore.currentSubject?.name || '系统集成项目管理工程师'
})

const now = new Date()
const currentDay = ref(now.getDate())
const currentMonth = ref(now.getMonth() + 1)
const completedCount = ref(0)
const progress = ref(0)
const isCompleted = ref(false)
const streakDays = ref(0)
const totalCheckinDays = ref(0)
const todayScore = ref<number | undefined>(undefined)
const todayCorrect = ref<number | undefined>(undefined)
const todayRecordId = ref<number | undefined>(undefined)

const selectedCount = ref<number>(20)
const showPoster = ref(false)

const todayTopics = ref<Array<{ id: number; name: string }>>([
  { id: 1, name: '项目范围与WBS分解' },
  { id: 2, name: '关键路径法 (CPM) 进度计算' },
  { id: 3, name: '挣值分析 (EV/PV/AC/CPI/SPI)' },
  { id: 4, name: '配置管理与变更控制流程' },
])

const milestones = ref<Array<{ days: number; title: string; reached: boolean; icon: string }>>([
  { days: 3, title: '初露锋芒', reached: false, icon: '🌱' },
  { days: 7, title: '七日连胜', reached: false, icon: '🔥' },
  { days: 14, title: '备考先锋', reached: false, icon: '⚡' },
  { days: 21, title: '习惯养成', reached: false, icon: '🏅' },
  { days: 30, title: '考霸传说', reached: false, icon: '👑' },
])

// 本地实时生成本周（周一至周日）精准日期
function generateCurrentWeek() {
  const n = new Date()
  const year = n.getFullYear()
  const month = n.getMonth()
  const date = n.getDate()
  const dayOfWeek = n.getDay() // 0 是周日，1..6 是周一至周六
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(year, month, date + mondayOffset)
  const todayZero = new Date(year, month, date).getTime()

  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return labels.map((label, idx) => {
    const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx)
    const curZero = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).getTime()
    const isToday = curZero === todayZero
    const isPast = curZero < todayZero
    const isFuture = curZero > todayZero
    return {
      label,
      date: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`,
      day: cur.getDate(),
      month: cur.getMonth() + 1,
      isToday,
      isPast,
      isFuture,
      done: false,
      count: 0,
      score: undefined as number | undefined,
    }
  })
}

interface DayItem {
  label: string
  date: string
  day: number
  month: number
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  done: boolean
  count: number
  score?: number
}

const weekDays = ref<DayItem[]>(generateCurrentWeek())

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

async function loadData() {
  try {
    const subId = subjectStore.currentSubjectId || undefined
    const res = await getDailyStatus(subId)
    if (res?.data) {
      const data = res.data
      if (data.today) {
        currentDay.value = data.today.day
        currentMonth.value = data.today.month
        completedCount.value = data.today.completedCount
        progress.value = data.today.progress
        isCompleted.value = Boolean(data.today.isCompleted)
        todayScore.value = data.today.todayScore
        todayCorrect.value = data.today.todayCorrect
        todayRecordId.value = data.today.todayRecordId
      }
      if (data.streakDays !== undefined) {
        streakDays.value = data.streakDays
      }
      if (data.totalCheckinDays !== undefined) {
        totalCheckinDays.value = data.totalCheckinDays
      }
      if (Array.isArray(data.weekList) && data.weekList.length === 7) {
        weekDays.value = data.weekList
      }
      if (Array.isArray(data.milestones) && data.milestones.length > 0) {
        milestones.value = data.milestones
      }
      if (Array.isArray(data.todayTopics) && data.todayTopics.length > 0) {
        todayTopics.value = data.todayTopics
      }
    }
  } catch {
    // 保留本地精确计算的时间与日历
  }
}

function onDayClick(d: any) {
  if (d.isToday) {
    onStart()
  } else if (d.done) {
    showToast(`📅 ${d.date} 已打卡完成，共完成 ${d.count || 1} 题！`)
  } else if (d.isPast) {
    showToast(`📅 ${d.date} 未打卡，今日坚持刷题保持连续打卡！`)
  } else {
    showToast(`🔒 ${d.date} 为未来日期，请按计划当日完成打卡~`)
  }
}

function onStart() {
  const subId = subjectStore.currentSubjectId || '1'
  router.push(`/quiz/daily?mode=daily&subjectId=${subId}&count=${selectedCount.value}`)
}

function onViewReport() {
  if (todayRecordId.value) {
    router.push(`/quiz/report/${todayRecordId.value}`)
  } else {
    router.push(`/quiz/daily?mode=daily&subjectId=${subjectStore.currentSubjectId || '1'}&count=${selectedCount.value}`)
  }
}

function onCopyPosterText() {
  const text = `🏆 我正在【软考通】坚持每日一练备考！\n🔥 今日已成功打卡，已连续打卡 ${streakDays.value} 天（累计 ${totalCheckinDays.value} 天）！\n💪 一起刷题冲刺，软考必过！`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('🎉 打卡文案已复制到剪贴板！')
      showPoster.value = false
    })
  } else {
    showToast('🎉 打卡成功！继续加油！')
    showPoster.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.daily-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 30px;
}

.nav-bar {
  height: 48px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;

  .back {
    font-size: 24px;
    color: #334155;
    cursor: pointer;
    width: 32px;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .subject-tag {
    font-size: 11px;
    color: #4f46e5;
    background: #eef2ff;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 600;
    max-width: 110px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.daily-content {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 1. 今日打卡 Hero 卡片 */
.daily-hero-card {
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
  border: 1px solid #fde68a;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.08);
  transition: all 0.3s;

  &.completed {
    background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
    border-color: #a7f3d0;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
  }

  .dh-top {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .date-badge {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

    &.date-done {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .date-day {
      font-size: 24px;
      font-weight: 800;
      line-height: 1;
    }

    .date-month {
      font-size: 11px;
      font-weight: 700;
      margin-top: 2px;
      opacity: 0.95;
    }

    .date-crown {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      background: #ffffff;
      color: #059669;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
  }

  .dh-info {
    flex: 1;
    min-width: 0;

    .dh-status-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 6px;
      margin-bottom: 4px;

      &.status-done {
        color: #047857;
        background: #d1fae5;
      }
    }

    .dh-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dh-desc {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .dh-progress-box {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed rgba(203, 213, 225, 0.6);

    .dp-track {
      height: 7px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;

      .dp-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        border-radius: 4px;
        transition: width 0.4s ease;

        &.fill-done {
          background: linear-gradient(90deg, #10b981, #34d399);
        }
      }
    }

    .dp-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
      font-weight: 500;
    }
  }

  .dh-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;

    .dh-btn {
      flex: 1;
      height: 36px;
      border-radius: 18px;
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;

      &.report {
        background: #10b981;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
      }

      &.poster {
        background: #ffffff;
        color: #047857;
        border: 1px solid #a7f3d0;
      }
    }
  }
}

/* 2. 连续打卡日历卡片 */
.streak-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .sc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .sc-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .sc-stats {
      display: flex;
      gap: 6px;

      .sc-badge {
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 600;

        &.fire {
          color: #ea580c;
          background: #ffedd5;
        }

        &.total {
          color: #4f46e5;
          background: #eef2ff;
        }

        b {
          font-weight: 800;
        }
      }
    }
  }
}

.streak-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;

  .streak-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 6px 2px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;

    .streak-day {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;

      &.text-today {
        color: #4f46e5;
        font-weight: 800;
      }
    }

    .streak-mark-wrap {
      position: relative;
    }

    .streak-mark {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      transition: all 0.2s;
      border: 2px solid transparent;

      .mark-icon {
        line-height: 1;

        &.done-check {
          color: #ffffff;
          font-size: 16px;
        }
        &.today-target {
          font-size: 16px;
        }
        &.past-check {
          color: #10b981;
          font-size: 14px;
        }
        &.past-missed {
          color: #cbd5e1;
          font-size: 12px;
        }
        &.future-lock {
          font-size: 12px;
          opacity: 0.5;
        }
      }
    }

    .streak-sub-label {
      font-size: 10px;
      color: #94a3b8;
      transform: scale(0.9);
      white-space: nowrap;
    }

    /* 历史已打卡 */
    &.done:not(.today-done) {
      .streak-mark {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }
      .streak-sub-label {
        color: #059669;
        font-weight: 600;
      }
    }

    /* 今日已打卡 */
    &.today-done {
      background: #ecfdf5;

      .streak-mark {
        background: #10b981;
        border-color: #059669;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
      }
      .streak-sub-label {
        color: #059669;
        font-weight: 700;
      }
    }

    /* 今日待打卡 (呼吸闪烁效果，绝不混淆) */
    &.today-pending {
      background: #eef2ff;

      .streak-mark {
        background: #ffffff;
        border: 2px solid #6366f1;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.35);
        animation: pulse 1.8s infinite;
      }
      .streak-sub-label {
        color: #4f46e5;
        font-weight: 800;
      }
    }

    &.past {
      opacity: 0.7;
    }

    &.future {
      opacity: 0.5;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

/* 3. 题量定制卡片 */
.mode-select-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .msc-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .msc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    .msc-item {
      position: relative;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px 6px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;

      .msc-badge {
        position: absolute;
        top: -7px;
        right: 8px;
        background: #ef4444;
        color: #ffffff;
        font-size: 9px;
        font-weight: 800;
        padding: 1px 5px;
        border-radius: 6px;
      }

      .msc-count {
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }

      .msc-desc {
        font-size: 10px;
        color: #64748b;
        margin-top: 3px;
      }

      &.active {
        background: #eef2ff;
        border-color: #6366f1;

        .msc-count {
          color: #4f46e5;
        }
        .msc-desc {
          color: #6366f1;
          font-weight: 500;
        }
      }
    }
  }
}

/* 4. 今日考点雷达 */
.topics-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .tc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .tc-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .tc-tip {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .tc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tc-tag {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11.5px;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;

      .tct-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #6366f1;
      }
    }
  }
}

/* 5. 连胜里程碑成就 */
.milestones-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .mc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .mc-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .mc-sub {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .milestones-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;

    .milestone-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 8px 2px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;

      .ms-icon-wrap {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-bottom: 4px;

        .ms-check {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          font-size: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .ms-name {
        font-size: 10.5px;
        font-weight: 700;
        color: #64748b;
      }

      .ms-days {
        font-size: 9.5px;
        color: #94a3b8;
        margin-top: 1px;
      }

      &.reached {
        background: #fefce8;
        border-color: #fde047;

        .ms-icon-wrap {
          background: #fef08a;
          box-shadow: 0 2px 6px rgba(234, 179, 8, 0.25);
        }

        .ms-name {
          color: #854d0e;
        }

        .ms-days {
          color: #a16207;
          font-weight: 600;
        }
      }
    }
  }
}

/* 6. 记忆贴士 */
.tips-banner {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  .tb-icon {
    font-size: 18px;
    line-height: 1.2;
  }

  .tb-text {
    font-size: 11.5px;
    color: #3730a3;
    line-height: 1.5;

    b {
      font-weight: 700;
    }
  }
}

/* 7. 底部开始刷题按钮 */
.bottom-bar {
  margin-top: 6px;

  .start-btn {
    width: 100%;
    height: 48px;
    border-radius: 24px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    border: none;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35);
    transition: all 0.2s;

    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }

    &.btn-secondary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
    }
  }
}

/* 打卡成就弹窗 */
.poster-card {
  padding: 20px;
  text-align: center;
  background: #ffffff;

  .pc-header {
    margin-bottom: 14px;

    .pc-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      background: linear-gradient(135deg, #f59e0b, #ea580c);
      padding: 3px 12px;
      border-radius: 12px;
    }

    .pc-date {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }
  }

  .pc-body {
    .pc-avatar-wrap {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #eef2ff;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      border: 2px solid #c7d2fe;
    }

    .pc-username {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .pc-streak-num {
      font-size: 13px;
      color: #ea580c;
      margin: 6px 0 14px;

      strong {
        font-size: 20px;
        font-weight: 900;
      }
    }

    .pc-stats-row {
      display: flex;
      justify-content: space-around;
      background: #f8fafc;
      border-radius: 12px;
      padding: 10px;
      margin-bottom: 14px;

      .pcs-item {
        .pcs-val {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .pcs-lbl {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 2px;
        }
      }
    }

    .pc-quote {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.5;
      background: #fefce8;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 16px;
      font-style: italic;
    }
  }
}
</style>

