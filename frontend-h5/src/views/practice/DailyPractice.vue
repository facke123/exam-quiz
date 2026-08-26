<template>
  <div class="daily-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        每日一练
      </div>
      <div class="right" />
    </div>

    <div class="daily-content">
      <!-- 每日一练日期与进度卡片 -->
      <div class="daily-card">
        <div class="date-badge">
          <div class="date-day">
            {{ currentDay }}
          </div>
          <div class="date-month">
            {{ currentMonth }}月
          </div>
        </div>
        <div class="daily-info">
          <div class="daily-title">
            {{ isCompleted ? '今日已完成 20 题打卡' : '今日 20 道核心考点精选题' }}
          </div>
          <div class="daily-desc">
            智能抽取全科核心考点 · 碎片时间高效提分
          </div>
          <div class="daily-progress">
            <div class="dp-track">
              <div
                class="dp-fill"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <span class="dp-text">
              {{ progress >= 100 ? '已达成 20/20 题' : (completedCount > 0 ? `已完成 ${completedCount}/20 题` : '每日精选 20 题随机自测') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 连续打卡日历（当前周真实实时数据） -->
      <div class="streak-card">
        <div class="sc-header">
          <div class="sc-title">
            🔥 坚持打卡 · 每日提分
          </div>
          <div
            v-if="streakDays > 0"
            class="sc-badge"
          >
            已连续打卡 {{ streakDays }} 天
          </div>
        </div>
        <div class="streak-grid">
          <div
            v-for="(d, i) in weekDays"
            :key="i"
            class="streak-item"
            :class="{
              done: d.done,
              today: d.isToday,
              future: d.isFuture,
            }"
          >
            <span class="streak-day">{{ d.isToday ? '今天' : d.label }}</span>
            <div class="streak-mark">
              <span v-if="d.done">✓</span>
              <span v-else>○</span>
            </div>
          </div>
        </div>
      </div>

      <button
        class="start-btn"
        @click="onStart"
      >
        {{ isCompleted ? '今日已完成（再次自测）' : (completedCount > 0 ? `继续今日刷题（${completedCount}/20题）` : '开始今日刷题（20题）') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'
import { getDailyStatus } from '@/api/quiz'

const router = useRouter()
const subjectStore = useSubjectStore()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const now = new Date()
const currentDay = ref(now.getDate())
const currentMonth = ref(now.getMonth() + 1)
const completedCount = ref(0)
const progress = ref(0)
const isCompleted = ref(false)
const streakDays = ref(0)

// 本地实时生成本周（周一至周日）精准日期与星期
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
    }
  })
}

const weekDays = ref(generateCurrentWeek())

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
        isCompleted.value = data.today.isCompleted
      }
      if (data.streakDays !== undefined) {
        streakDays.value = data.streakDays
      }
      if (Array.isArray(data.weekList) && data.weekList.length === 7) {
        weekDays.value = data.weekList
      }
    }
  } catch {
    // 保留本地精确计算的时间与日历
  }
}

onMounted(() => {
  loadData()
})

function onStart() {
  const subId = subjectStore.currentSubjectId || '1'
  router.push(`/quiz/daily?mode=daily&subjectId=${subId}&count=20`)
}
</script>

<style scoped lang="scss">
.daily-page {
  min-height: 100vh;
  background: var(--gray-1);
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
    width: 24px;
  }
}

.daily-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.daily-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);

  .date-badge {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #d97706;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);

    .date-day {
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
    }

    .date-month {
      font-size: 10px;
      font-weight: 700;
      margin-top: 2px;
    }
  }

  .daily-info {
    flex: 1;

    .daily-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .daily-desc {
      font-size: 11px;
      color: var(--gray-5);
      margin: 4px 0 8px;
    }

    .daily-progress {
      display: flex;
      align-items: center;
      gap: 8px;

      .dp-track {
        flex: 1;
        height: 6px;
        background: var(--gray-2);
        border-radius: 3px;
        overflow: hidden;

        .dp-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
      }

      .dp-text {
        font-size: 11px;
        color: var(--gray-5);
      }
    }
  }
}

.streak-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);

  .sc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .sc-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .sc-badge {
    font-size: 11px;
    color: #ea580c;
    background: #ffedd5;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }
}

.streak-grid {
  display: flex;
  justify-content: space-between;

  .streak-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .streak-day {
      font-size: 11px;
      color: var(--gray-5);
    }

    .streak-mark {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--gray-2);
      color: var(--gray-4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      transition: all 0.2s;
    }

    &.done {
      .streak-mark {
        background: var(--success-bg);
        color: var(--success);
      }
    }

    &.today {
      .streak-day {
        color: var(--primary);
        font-weight: 800;
      }
      .streak-mark {
        border: 2px solid var(--primary);
        background: var(--primary-bg);
        color: var(--primary);
      }

      &.done {
        .streak-mark {
          background: var(--success-bg);
          color: var(--success);
          border: 2px solid var(--success);
        }
      }
    }

    &.future {
      opacity: 0.6;
    }
  }
}

.start-btn {
  width: 100%;
  height: 46px;
  border-radius: 23px;
  background: var(--primary);
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px var(--primary-glow);
  margin-top: 10px;

  &:active {
    background: var(--primary-dark);
  }
}
</style>
