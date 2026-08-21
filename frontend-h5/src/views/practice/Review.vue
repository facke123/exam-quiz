<template>
  <div class="review-page">
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title">艾宾浩斯复习</div>
      <div class="right" @click="showExplain">说明</div>
    </div>

    <div class="review-content">
      <!-- 遗忘曲线今日待复习横幅 -->
      <div class="review-hero">
        <div class="rh-label">今日待复习</div>
        <div class="rh-num">385</div>
        <div class="rh-desc">道题目 · 根据艾宾浩斯遗忘曲线智能安排</div>
        <button class="rh-btn" @click="startReview">开始智能复习</button>
      </div>

      <!-- 复习计划分类 -->
      <div class="plan-card">
        <div class="card-title">📅 复习排期</div>
        <div class="plan-list">
          <div class="plan-item" @click="startReview">
            <div class="pi-icon danger">🔥</div>
            <div class="pi-info">
              <div class="t">紧急复习</div>
              <div class="d">已达遗忘临界点 · 建议立即复习</div>
            </div>
            <div class="pi-num danger">86</div>
          </div>
          <div class="plan-item" @click="startReview">
            <div class="pi-icon warning">⚠️</div>
            <div class="pi-info">
              <div class="t">今日复习</div>
              <div class="d">最佳记忆强化节点</div>
            </div>
            <div class="pi-num warning">152</div>
          </div>
          <div class="plan-item" @click="startReview">
            <div class="pi-icon success">📋</div>
            <div class="pi-info">
              <div class="t">明日复习</div>
              <div class="d">提前预览明日任务</div>
            </div>
            <div class="pi-num success">147</div>
          </div>
        </div>
      </div>

      <!-- 复习效果指标 -->
      <div class="effect-card">
        <div class="card-title">📈 复习巩固效果</div>
        <div class="effect-grid">
          <div class="eg-item">
            <div class="eg-num success">85%</div>
            <div class="eg-label">长效巩固率</div>
          </div>
          <div class="eg-item">
            <div class="eg-num primary">320</div>
            <div class="eg-label">已强化题目</div>
          </div>
          <div class="eg-item">
            <div class="eg-num orange">2.8</div>
            <div class="eg-label">平均复习轮次</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'

const router = useRouter()

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function startReview() {
  showToast('进入艾宾浩斯智能复习模式')
  router.push('/quiz/practice')
}

function showExplain() {
  showDialog({
    title: '艾宾浩斯复习法原理',
    message:
      '系统根据德国心理学家艾宾浩斯遗忘曲线，在做错题目后的第 1、2、4、7、15 天自动推送复习，帮助您形成持久肌肉记忆，考前不忘！',
  })
}
</script>

<style scoped lang="scss">
.review-page {
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
    font-size: 13px;
    color: var(--primary);
    cursor: pointer;
  }
}

.review-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.review-hero {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  border-radius: var(--radius);
  padding: 24px 20px;
  color: #fff;
  text-align: center;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    border-radius: 50%;
  }

  .rh-label {
    font-size: 13px;
    opacity: 0.9;
  }

  .rh-num {
    font-size: 48px;
    font-weight: 800;
    margin: 8px 0 2px;
    line-height: 1.1;
  }

  .rh-desc {
    font-size: 12px;
    opacity: 0.85;
  }

  .rh-btn {
    margin-top: 16px;
    background: #fff;
    color: #f97316;
    border: none;
    padding: 10px 32px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.plan-card,
.effect-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);

  .card-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 14px;
  }
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  .pi-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;

    &.danger {
      background: var(--danger-bg);
    }
    &.warning {
      background: var(--warning-bg);
    }
    &.success {
      background: var(--success-bg);
    }
  }

  .pi-info {
    flex: 1;

    .t {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-8);
    }

    .d {
      font-size: 11px;
      color: var(--gray-5);
      margin-top: 2px;
    }
  }

  .pi-num {
    font-size: 20px;
    font-weight: 800;

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

.effect-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;

  .eg-item {
    .eg-num {
      font-size: 24px;
      font-weight: 800;

      &.success {
        color: var(--success);
      }
      &.primary {
        color: var(--primary);
      }
      &.orange {
        color: var(--orange);
      }
    }

    .eg-label {
      font-size: 11px;
      color: var(--gray-5);
      margin-top: 4px;
    }
  }
}
</style>
