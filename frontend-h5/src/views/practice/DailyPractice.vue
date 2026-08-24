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
            {{ day }}
          </div>
          <div class="date-month">
            {{ month }}月
          </div>
        </div>
        <div class="daily-info">
          <div class="daily-title">
            今日 5 道核心考点精选题
          </div>
          <div class="daily-desc">
            智能抽取薄弱知识点 · 碎片时间高效提分
          </div>
          <div class="daily-progress">
            <div class="dp-track">
              <div
                class="dp-fill"
                style="width: 40%"
              />
            </div>
            <span class="dp-text">已完成 2/5 题</span>
          </div>
        </div>
      </div>

      <!-- 连续打卡日历 -->
      <div class="streak-card">
        <div class="sc-title">
          🔥 连续打卡 7 天
        </div>
        <div class="streak-grid">
          <div
            v-for="(d, i) in last7Days"
            :key="i"
            class="streak-item"
            :class="{ done: d.done, today: i === last7Days.length - 1 }"
          >
            <span class="streak-day">{{ d.label }}</span>
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
        开始今日刷题
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'

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
const day = now.getDate()
const month = now.getMonth() + 1

const last7Days = ref([
  { label: '周一', done: true },
  { label: '周二', done: true },
  { label: '周三', done: true },
  { label: '周四', done: true },
  { label: '周五', done: true },
  { label: '周六', done: true },
  { label: '今天', done: false },
])

function onStart() {
  router.push(`/quiz/practice?mode=daily&subjectId=${subjectStore.currentSubjectId}`)
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

  .sc-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 14px;
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
        font-weight: 700;
      }
      .streak-mark {
        border: 2px solid var(--primary);
      }
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
