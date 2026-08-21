<template>
  <div class="mock-page">
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title">全真模拟考试</div>
      <div class="right"></div>
    </div>

    <!-- 顶部横幅 -->
    <div class="mock-hero">
      <div class="mh-icon">⏱️</div>
      <div class="mh-info">
        <div class="mh-title">全真考场模拟</div>
        <div class="mh-desc">仿真出题 · 严格限时 · 考后精准估分</div>
      </div>
    </div>

    <!-- 模拟卷列表 -->
    <div class="mock-list">
      <div
        v-for="mock in mocks"
        :key="mock.id"
        class="mock-card"
        @click="enterMock(mock)"
      >
        <div class="mc-head">
          <div class="mc-title">{{ mock.name }}</div>
          <span v-if="mock.isNew" class="mc-tag new">NEW</span>
        </div>
        <div class="mc-desc">{{ mock.desc }}</div>
        <div class="mc-footer">
          <div class="mc-meta">
            <span>⏱️ {{ mock.duration }}分钟</span>
            <span>📝 {{ mock.questionCount }}题</span>
            <span>👥 {{ mock.attendCount }}人参加</span>
          </div>
          <button class="mc-btn">开始模考</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const mocks = ref([
  {
    id: '1',
    name: '2026全真模拟卷一 · 基础强化',
    desc: '覆盖信息化、项目管理基础与生命周期等高频核心考点',
    duration: 120,
    questionCount: 75,
    attendCount: 1280,
    isNew: true,
  },
  {
    id: '2',
    name: '2026全真模拟卷二 · 进阶实战',
    desc: '聚焦范围管理、进度管理、成本管理深度综合题型',
    duration: 150,
    questionCount: 75,
    attendCount: 980,
    isNew: false,
  },
  {
    id: '3',
    name: '2026全真模拟卷三 · 冲刺押题',
    desc: '全科考点拉通，历年出题专家命题趋势仿真模拟',
    duration: 150,
    questionCount: 75,
    attendCount: 654,
    isNew: true,
  },
])

function enterMock(mock: any) {
  router.push(`/quiz/mock?examId=${mock.id}`)
}
</script>

<style scoped lang="scss">
.mock-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 40px;
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

.mock-hero {
  margin: 14px;
  background: linear-gradient(140deg, #6366f1 0%, #7c3aed 100%);
  border-radius: var(--radius);
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-md);

  .mh-icon {
    font-size: 32px;
  }

  .mh-title {
    font-size: 18px;
    font-weight: 800;
  }

  .mh-desc {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }
}

.mock-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;

  .mc-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .mc-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .mc-tag.new {
      font-size: 10px;
      font-weight: 800;
      background: var(--danger);
      color: #fff;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  .mc-desc {
    font-size: 12px;
    color: var(--gray-5);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .mc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;

    .mc-meta {
      display: flex;
      gap: 10px;
      font-size: 11px;
      color: var(--gray-5);
    }

    .mc-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 14px;
      cursor: pointer;
    }
  }
}
</style>
