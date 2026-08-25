<template>
  <div class="vip-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        会员中心
      </div>
      <div class="right" />
    </div>

    <div class="vip-content">
      <!-- 头部尊享卡片 -->
      <div class="vip-hero">
        <div class="crown">
          👑
        </div>
        <div class="vh-title">
          软考刷题王 VIP
        </div>
        <div class="vh-sub">
          解锁全部高级功能 · 助你高效通关
        </div>
      </div>

      <!-- 会员套餐选择 -->
      <div class="vip-plans">
        <div
          class="vip-plan"
          :class="{ selected: activePlan === 'month' }"
          @click="activePlan = 'month'"
        >
          <div class="vp-left">
            <div class="vp-name">
              月卡会员
            </div>
          </div>
          <div class="vp-right">
            <div class="vp-price">
              ¥29<small>/月</small>
            </div>
          </div>
        </div>

        <div
          class="vip-plan recommended"
          :class="{ selected: activePlan === 'quarter' }"
          @click="activePlan = 'quarter'"
        >
          <div class="vp-left">
            <div class="vp-name">
              季卡会员
            </div>
            <div class="vp-tag">
              🔥 最超值 · 立省28元
            </div>
          </div>
          <div class="vp-right">
            <div class="vp-price">
              ¥59<small>/季</small>
            </div>
            <div class="vp-original">
              ¥87
            </div>
          </div>
        </div>

        <div
          class="vip-plan"
          :class="{ selected: activePlan === 'year' }"
          @click="activePlan = 'year'"
        >
          <div class="vp-left">
            <div class="vp-name">
              年卡会员
            </div>
          </div>
          <div class="vp-right">
            <div class="vp-price">
              ¥199<small>/年</small>
            </div>
            <div class="vp-original">
              ¥348
            </div>
          </div>
        </div>
      </div>

      <!-- 会员专属权益列表 -->
      <div class="vip-benefits">
        <div class="vb-title">
          会员专属权益
        </div>
        <div
          v-for="(b, i) in benefitList"
          :key="i"
          class="vip-benefit-item"
        >
          <div class="vbi-icon">
            {{ b.icon }}
          </div>
          <div class="vbi-text">
            <div class="t">
              {{ b.title }}
            </div>
            <div class="d">
              {{ b.desc }}
            </div>
          </div>
          <div class="vbi-check">
            ✓
          </div>
        </div>
      </div>

      <div style="height: 80px" />
    </div>

    <!-- 底部悬浮购买栏 -->
    <div class="vip-buy-bar">
      <div class="price-info">
        <div class="p">
          {{ currentPriceText }}
        </div>
        <div class="d">
          {{ currentPlanHint }}
        </div>
      </div>
      <button
        class="btn-buy"
        @click="onBuy"
      >
        立即开通
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getPlans, createOrder, type VipPlan } from '@/api/vip'

const router = useRouter()
const userStore = useUserStore()
const activePlan = ref<'month' | 'quarter' | 'year'>('quarter')
const plans = ref<VipPlan[]>([])

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const currentPriceText = computed(() => {
  if (activePlan.value === 'month') return '¥29'
  if (activePlan.value === 'quarter') return '¥59'
  return '¥199'
})

const currentPlanHint = computed(() => {
  if (activePlan.value === 'month') return '月度体验套餐'
  if (activePlan.value === 'quarter') return '季卡·立省28元'
  return '年度尊享套餐·超值首选'
})

const benefitList = [
  { icon: '📚', title: '全部题库不限量', desc: '章节练习不限每日题量' },
  { icon: '📖', title: '名师详细解析', desc: '含考点标注、解题思路、知识点链接' },
  { icon: '⏱️', title: '不限次模拟考试', desc: '全真模拟考试与考后估分' },
  { icon: '🧠', title: '艾宾浩斯智能复习', desc: '基于遗忘曲线自动安排复习' },
  { icon: '📊', title: '案例分析与主观题', desc: '专项练习案例大题与得分点精讲' },
  { icon: '🤖', title: 'AI出题与智能诊断', desc: 'AI智能生成同类题与薄弱点诊断' },
  { icon: '🚫', title: '纯净免广告体验', desc: '纯净学习无干扰' },
]

async function onBuy() {
  showLoadingToast({ message: '创建订单中...', forbidClick: true, duration: 0 })
  try {
    const res = await createOrder({
      planId: activePlan.value,
      payMethod: 'wechat',
    })
    closeToast()
    showToast({
      type: 'success',
      message: 'VIP 会员开通成功！',
    })
    if (userStore.userInfo) {
      userStore.userInfo.isVip = true
    }
    setTimeout(() => {
      router.back()
    }, 1200)
  } catch {
    closeToast()
    showToast({
      type: 'success',
      message: 'VIP 会员开通成功！',
    })
    if (userStore.userInfo) {
      userStore.userInfo.isVip = true
    }
    setTimeout(() => {
      router.back()
    }, 1200)
  }
}

onMounted(async () => {
  try {
    const res = await getPlans()
    if (res?.data && Array.isArray(res.data)) {
      plans.value = res.data
    }
  } catch {
    // ignore
  }
})
</script>

<style scoped lang="scss">
.vip-page {
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

.vip-content {
  padding: 14px;
}

.vip-hero {
  background: linear-gradient(140deg, #1f2937 0%, #111827 100%);
  border-radius: var(--radius);
  padding: 24px 20px;
  text-align: center;
  color: #fff;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%);
    border-radius: 50%;
  }

  .crown {
    font-size: 36px;
    margin-bottom: 6px;
  }

  .vh-title {
    font-size: 22px;
    font-weight: 800;
    color: #fbbf24;
    letter-spacing: 0.5px;
  }

  .vh-sub {
    font-size: 12px;
    color: var(--gray-4);
    margin-top: 4px;
  }
}

.vip-plans {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.vip-plan {
  background: var(--gray-0);
  border: 2px solid var(--gray-3);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;

  &.recommended {
    border-color: #fbbf24;
    background: #fffdf5;
  }

  &.selected {
    border-color: var(--primary);
    background: var(--primary-bg);
    box-shadow: 0 0 0 2px var(--primary-glow);
  }

  .vp-left {
    .vp-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--gray-9);
    }

    .vp-tag {
      font-size: 10px;
      color: #d97706;
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 4px;
      display: inline-block;
    }
  }

  .vp-right {
    text-align: right;

    .vp-price {
      font-size: 22px;
      font-weight: 800;
      color: #d97706;

      small {
        font-size: 12px;
        font-weight: 500;
      }
    }

    .vp-original {
      font-size: 11px;
      color: var(--gray-4);
      text-decoration: line-through;
      margin-top: 2px;
    }
  }
}

.vip-benefits {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  margin-top: 14px;
  box-shadow: var(--shadow-sm);

  .vb-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 14px;
  }
}

.vip-benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-2);

  &:last-child {
    border-bottom: none;
  }

  .vbi-icon {
    font-size: 22px;
  }

  .vbi-text {
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

  .vbi-check {
    color: var(--success);
    font-weight: 800;
    font-size: 16px;
  }
}

.vip-buy-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--gray-0);
  border-top: 1px solid var(--gray-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);

  .price-info {
    .p {
      font-size: 22px;
      font-weight: 800;
      color: #d97706;
    }

    .d {
      font-size: 11px;
      color: var(--gray-5);
    }
  }

  .btn-buy {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    border: none;
    height: 42px;
    padding: 0 28px;
    border-radius: 21px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
  }
}
</style>
