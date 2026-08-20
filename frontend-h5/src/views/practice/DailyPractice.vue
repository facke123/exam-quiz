<template>
  <div class="daily-page">
    <van-nav-bar title="每日一练" left-arrow @click-left="$router.back()" />

    <div class="daily-card">
      <div class="date-badge">
        <p class="date-day">{{ day }}</p>
        <p class="date-month">{{ month }}</p>
      </div>
      <div class="daily-info">
        <p class="daily-title">今日 {{ total }} 道精选题</p>
        <p class="daily-desc">基于你的薄弱考点智能推荐</p>
        <div class="daily-progress">
          <van-progress :percentage="donePercent" stroke-width="6" color="#6366F1" :show-pivot="false" />
          <span>已完成 {{ done }}/{{ total }}</span>
        </div>
      </div>
    </div>

    <div class="streak-section">
      <h4 class="block-title">坚持打卡</h4>
      <div class="streak-grid">
        <div
          v-for="(d, i) in last7Days"
          :key="i"
          class="streak-item"
          :class="{ done: d.done, today: i === last7Days.length - 1 }"
        >
          <span class="streak-day">{{ d.label }}</span>
          <div class="streak-mark">
            <van-icon v-if="d.done" name="success" />
            <van-icon v-else name="clock-o" />
          </div>
        </div>
      </div>
    </div>

    <van-button block round type="primary" class="start-btn" @click="onStart">
      {{ done > 0 ? '继续答题' : '开始答题' }}
    </van-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const now = new Date()
const day = now.getDate()
const monthArr = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const month = monthArr[now.getMonth()]

const total = ref(10)
const done = ref(4)
const donePercent = ref(40)

const last7Days = ref([
  { label: '一', done: true },
  { label: '二', done: true },
  { label: '三', done: true },
  { label: '四', done: false },
  { label: '五', done: true },
  { label: '六', done: true },
  { label: '今', done: false }
])

function onStart() {
  router.push('/quiz/daily')
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.daily-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding: var(--space-lg);
}

.daily-card {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-xl);
}

.date-badge {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  color: #fff;
  text-align: center;
  @include flex-col;
  align-items: center;
  justify-content: center;
}

.date-day {
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.date-month {
  font-size: 10px;
}

.daily-info {
  flex: 1;
}

.daily-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
}

.daily-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 4px;
}

.daily-progress {
  margin-top: var(--space-md);

  span {
    font-size: 11px;
    color: var(--text-secondary);
    display: block;
    margin-top: 4px;
  }
}

.streak-section {
  margin-bottom: var(--space-2xl);
}

.block-title {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-lg);
  color: var(--text-primary);
}

.streak-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-sm);
}

.streak-item {
  @include flex-col;
  align-items: center;
  gap: var(--space-sm);

  .streak-day {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .streak-mark {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: var(--bg-page);
    @include flex-center;

    .van-icon {
      font-size: 18px;
      color: var(--text-placeholder);
    }
  }

  &.done .streak-mark {
    background: var(--gradient-primary);

    .van-icon {
      color: #fff;
    }
  }

  &.today .streak-day {
    font-weight: 700;
    color: var(--color-primary);
  }
}

.start-btn {
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: 600;
  background: var(--gradient-primary);
  border: none;
}
</style>
