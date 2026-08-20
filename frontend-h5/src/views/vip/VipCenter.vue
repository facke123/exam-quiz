<template>
  <div class="vip-page">
    <div class="vip-bg">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
    </div>

    <van-nav-bar title="会员中心" left-arrow @click-left="$router.back()" :border="false" class="nav" />

    <div class="vip-header">
      <van-icon name="diamond" class="crown" />
      <h1 class="title">软考 VIP 会员</h1>
      <p class="subtitle">解锁全部题库 & AI 深度分析 & 专属客服</p>
    </div>

    <!-- 套餐 -->
    <div class="plans">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ popular: plan.popular, selected: selectedPlan === plan.id }"
        @click="selectedPlan = plan.id"
      >
        <van-tag v-if="plan.popular" color="#fbbf24" class="popular-tag">推荐</van-tag>
        <p class="plan-name">{{ plan.name }}</p>
        <div class="plan-price">
          <span class="cur">¥</span>
          <span class="amount">{{ plan.price }}</span>
          <span class="origin">¥{{ plan.originalPrice }}</span>
        </div>
        <p class="plan-duration">{{ plan.duration }}</p>
      </div>
    </div>

    <!-- 权益列表 -->
    <div class="benefits card">
      <h4 class="block-title">会员专属权益</h4>
      <div v-for="b in benefits" :key="b.title" class="benefit-item">
        <van-icon :name="b.icon" class="ben-icon" />
        <div class="ben-text">
          <p class="ben-title">{{ b.title }}</p>
          <p class="ben-desc">{{ b.desc }}</p>
        </div>
      </div>
    </div>

    <!-- 底部购买栏 -->
    <div class="pay-bar">
      <div class="pay-left">
        <p class="pay-label">应付</p>
        <p class="pay-amount">¥{{ currentPlan?.price }}</p>
      </div>
      <van-button round class="pay-btn" @click="onPay">立即开通</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPlans, createOrder, type VipPlan } from '@/api/vip'

const router = useRouter()
const plans = ref<VipPlan[]>([])
const selectedPlan = ref<string>('')

const currentPlan = computed(() => plans.value.find((p) => p.id === selectedPlan.value))

const benefits = [
  { icon: 'records', title: '全部题库', desc: '解锁全部章节、真题、模拟题' },
  { icon: 'chat-o', title: 'AI 深度分析', desc: '每题 AI 解析，理解更深' },
  { icon: 'underway-o', title: '艾宾浩斯复习', desc: '智能记忆曲线，高效复习' },
  { icon: 'chart-trending-o', title: '知识雷达图', desc: '可视化能力分析' },
  { icon: 'description', title: '错题智能导出', desc: 'PDF 导出错题集' },
  { icon: 'service-o', title: '专属客服', desc: '优先响应，1对1答疑' },
  { icon: 'gift-o', title: '考不过包赔', desc: '年卡专属，未过返会费' }
]

async function onPay() {
  if (!selectedPlan.value) return showToast('请选择套餐')
  try {
    const res = await createOrder({ planId: selectedPlan.value, payMethod: 'wechat' })
    showToast({ type: 'success', message: '订单已创建，即将支付' })
    // 模拟支付跳转
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch {
    showToast('下单失败')
  }
}

onMounted(async () => {
  try {
    const res = await getPlans()
    plans.value = res.data
    selectedPlan.value = res.data.find((p) => p.popular)?.id || res.data[0]?.id || ''
  } catch {
    plans.value = [
      { id: 'month', name: '月卡', price: 19, originalPrice: 29, duration: '30天有效', features: [], popular: false },
      { id: 'season', name: '季卡', price: 49, originalPrice: 87, duration: '90天有效', features: [], popular: true },
      { id: 'year', name: '年卡', price: 99, originalPrice: 348, duration: '365天有效', features: [], popular: false }
    ]
    selectedPlan.value = 'season'
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.vip-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #4c1d95 0%, #7c3aed 30%, #f8fafc 60%);
  padding-bottom: 80px;
  overflow: hidden;
}

.vip-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);

    &.c1 {
      width: 260px;
      height: 260px;
      top: -80px;
      right: -100px;
    }
    &.c2 {
      width: 180px;
      height: 180px;
      top: 120px;
      left: -80px;
    }
  }
}

.nav {
  background: transparent !important;

  :deep(.van-nav-bar__title),
  :deep(.van-nav-bar .van-icon) {
    color: #fff;
  }
}

.vip-header {
  text-align: center;
  color: #fff;
  padding: var(--space-xl) 0;
  position: relative;
}

.crown {
  font-size: 48px;
  color: #fbbf24;
  margin-bottom: var(--space-md);
}

.title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-xs);
}

.subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.85;
}

/* Plans */
.plans {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-lg);
  position: relative;
}

.plan-card {
  flex: 1;
  position: relative;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-lg) var(--space-sm);
  text-align: center;
  color: #fff;
  transition: all var(--transition-base);

  &.popular {
    border-color: #fbbf24;
    background: rgba(251, 191, 36, 0.15);
  transform: scale(1.04);
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);
  }

  &.selected {
    border-color: #fff;
  }
}

.popular-tag {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}

.plan-name {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.plan-price {
  margin: var(--space-sm) 0;

  .cur {
    font-size: var(--font-size-sm);
    vertical-align: top;
  }
  .amount {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }
  .origin {
    display: block;
    font-size: 11px;
    opacity: 0.6;
    text-decoration: line-through;
  }
}

.plan-duration {
  font-size: 11px;
  opacity: 0.85;
}

/* Benefits */
.benefits {
  margin: var(--space-lg);
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.block-title {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-lg);
  color: var(--text-primary);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) 0;
  @include hairline-bottom;

  &:last-child::after {
    display: none;
  }
}

.ben-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary-soft);
  color: var(--color-primary);
  font-size: 20px;
  @include flex-center;
}

.ben-title {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.ben-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Pay bar */
.pay-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-card);
  @include safe-bottom(12px);
  @include hairline-top;
}

.pay-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.pay-amount {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-danger);
}

.pay-btn {
  height: 44px;
  padding: 0 32px;
  background: linear-gradient(135deg, #4c1d95, #7c3aed, #c026d3);
  color: #fff;
  font-weight: 600;
  border: none;
}
</style>
