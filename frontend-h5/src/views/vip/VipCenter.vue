<template>
  <div class="vip-page">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <div class="back" @click="onBack">‹</div>
      <div class="title">VIP 会员中心</div>
      <div class="right">
        <span class="btn-card-top" @click="showCardDialog = true">🔑 卡密兑换</span>
      </div>
    </div>

    <div class="vip-content">
      <!-- 头部尊享卡片：展示当前用户会员状态 -->
      <div class="vip-hero" :class="{ 'is-vip': vipStatus.isVip, 'is-lifetime': vipStatus.isLifetime }">
        <div class="hero-header">
          <div class="user-meta">
            <div class="avatar-box">
              {{ (userStore.userInfo?.nickname || userStore.userInfo?.username || '学')[0].toUpperCase() }}
            </div>
            <div class="user-names">
              <div class="un">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '软考学员' }}</div>
              <div class="status-pill">
                <span class="pill-icon">👑</span>
                <span>{{ vipStatus.vipLevelName || (vipStatus.isVip ? 'VIP 会员' : '免费学员') }}</span>
              </div>
            </div>
          </div>
          <div class="crown-icon">👑</div>
        </div>

        <div class="hero-expire">
          <div v-if="vipStatus.isLifetime" class="expire-highlight">
            ✨ 您的永久尊享会员已激活 · 终身全功能免费开放
          </div>
          <div v-else-if="vipStatus.isVip" class="expire-normal">
            {{ vipStatus.expireText }}
          </div>
          <div v-else class="expire-free">
            开通会员解锁全站历年真题、AI 智能解析与艾宾浩斯复习
          </div>
        </div>
      </div>

      <!-- 会员套餐选择栅格（动态加载后台配置） -->
      <div class="section-title">
        <span class="icon">💎</span>
        <span>选择会员套餐</span>
        <span class="sub-hint">支持微信 / 支付宝极速开通</span>
      </div>

      <div v-if="loading" class="loading-box">
        <van-loading type="spinner" color="#f59e0b">加载最新特惠套餐中...</van-loading>
      </div>

      <div v-else class="vip-plans-grid">
        <div
          v-for="plan in planList"
          :key="plan.id"
          class="vip-plan-card"
          :class="{
            selected: selectedPlan?.id === plan.id,
            lifetime: plan.isLifetime,
            popular: plan.popular && !plan.isLifetime,
          }"
          @click="selectPlan(plan)"
        >
          <!-- 标签角标 -->
          <div v-if="plan.tag" class="card-badge" :class="{ 'badge-lifetime': plan.isLifetime }">
            {{ plan.tag }}
          </div>

          <div class="card-name">{{ plan.name }}</div>

          <div class="card-price-row">
            <span class="currency">¥</span>
            <span class="price-val">{{ plan.price }}</span>
            <span v-if="plan.originalPrice" class="orig-price">¥{{ plan.originalPrice }}</span>
          </div>

          <div class="card-duration">
            <span class="d-text">{{ plan.isLifetime ? '永久终身有效' : `时长: ${plan.duration}` }}</span>
            <span v-if="plan.originalPrice && (plan.originalPrice - plan.price) > 0" class="save-tag">
              省¥{{ Math.round(plan.originalPrice - plan.price) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 会员专属 7 大特权 -->
      <div class="vip-benefits-card">
        <div class="vb-head">
          <span class="vb-title">👑 VIP 会员专属 7 大核心特权</span>
          <span class="vb-sub">高效通关软考神器</span>
        </div>

        <div class="benefits-grid">
          <div v-for="(b, i) in benefitList" :key="i" class="benefit-item">
            <div class="b-icon-wrap">{{ b.icon }}</div>
            <div class="b-text">
              <div class="t">{{ b.title }}</div>
              <div class="d">{{ b.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 常见疑问解答 -->
      <div class="faq-card">
        <div class="faq-title">❓ 常见问题</div>
        <div class="faq-item">
          <div class="q">Q: 开通后如果不小心重复购买，时长会自动累加吗？</div>
          <div class="a">A: 是的，系统会自动在您现有会员到期时间基础上顺延对应时长；如购买永久会员则直接升级为终身有效。</div>
        </div>
        <div class="faq-item">
          <div class="q">Q: 题库未来更新新考季真题还需要额外付费吗？</div>
          <div class="a">A: 会员有效期内（永久会员终身）所有新上架的软考真题、模拟卷、AI 考点解析全部免费开放。</div>
        </div>
      </div>

      <div style="height: 90px" />
    </div>

    <!-- 底部悬浮购买操作栏 -->
    <div class="vip-buy-bar">
      <div class="price-summary">
        <div class="main-price">
          <span class="p-symbol">¥</span>
          <span class="p-number">{{ selectedPlan?.price || 6 }}</span>
          <span v-if="selectedPlan?.originalPrice" class="p-orig">¥{{ selectedPlan.originalPrice }}</span>
        </div>
        <div class="plan-desc">
          已选：{{ selectedPlan?.name || '月卡会员' }}
          <span v-if="selectedPlan?.isLifetime" class="badge-mini">终身买断</span>
        </div>
      </div>

      <button class="btn-purchase" :disabled="buying" @click="handlePurchase">
        <span v-if="buying">开通中...</span>
        <span v-else>立即开通 ¥{{ selectedPlan?.price || 6 }}</span>
      </button>
    </div>

    <!-- 底部收银台弹窗 -->
    <van-popup v-model:show="showCashierPopup" round position="bottom" class="cashier-popup" closeable>
      <div class="cashier-container">
        <div class="cashier-title">🛒 确认开通 · 收银台</div>
        
        <!-- 订单概览卡片 -->
        <div class="order-summary-card">
          <div class="os-head">
            <div class="os-plan-name">{{ selectedPlan?.name }}</div>
            <div class="os-tag">{{ selectedPlan?.isLifetime ? '永久终身有效' : `时长: ${selectedPlan?.duration}` }}</div>
          </div>
          <div class="os-price-row">
            <span class="os-label">实付应付金额</span>
            <span class="os-price">¥{{ selectedPlan?.price }}</span>
          </div>
        </div>

        <!-- 支付通道选择 -->
        <div class="channel-section">
          <div class="sec-label">选择支付通道</div>
          <div class="channel-list">
            <!-- 沙箱/模拟快捷支付 -->
            <div
              v-if="channels.sandboxEnabled !== false"
              class="channel-item"
              :class="{ active: selectedChannel === 'mock' }"
              @click="selectedChannel = 'mock'"
            >
              <div class="ch-left">
                <span class="ch-icon">⚡</span>
                <div class="ch-info">
                  <div class="ch-name">沙箱 / 演示一键快捷支付</div>
                  <div class="ch-desc">无需扫码，一键极速模拟支付并即刻激活 VIP</div>
                </div>
              </div>
              <div class="ch-radio">{{ selectedChannel === 'mock' ? '🔘' : '⚪' }}</div>
            </div>

            <!-- 微信支付 -->
            <div
              v-if="channels.wechatEnabled !== false"
              class="channel-item"
              :class="{ active: selectedChannel === 'wechat' }"
              @click="selectedChannel = 'wechat'"
            >
              <div class="ch-left">
                <span class="ch-icon">🟢</span>
                <div class="ch-info">
                  <div class="ch-name">微信支付</div>
                  <div class="ch-desc">支持微信扫码 / 极速转账</div>
                </div>
              </div>
              <div class="ch-radio">{{ selectedChannel === 'wechat' ? '🔘' : '⚪' }}</div>
            </div>

            <!-- 支付宝 -->
            <div
              v-if="channels.alipayEnabled !== false"
              class="channel-item"
              :class="{ active: selectedChannel === 'alipay' }"
              @click="selectedChannel = 'alipay'"
            >
              <div class="ch-left">
                <span class="ch-icon">🔵</span>
                <div class="ch-info">
                  <div class="ch-name">支付宝</div>
                  <div class="ch-desc">支持支付宝扫码 / 极速转账</div>
                </div>
              </div>
              <div class="ch-radio">{{ selectedChannel === 'alipay' ? '🔘' : '⚪' }}</div>
            </div>
          </div>
        </div>

        <!-- 收款二维码区域 -->
        <div v-if="(selectedChannel === 'wechat' && channels.wechatQr) || (selectedChannel === 'alipay' && channels.alipayQr)" class="qr-pay-box">
          <div class="qr-tip">请长按识别或扫码完成转账 (¥{{ selectedPlan?.price }})：</div>
          <img :src="selectedChannel === 'wechat' ? channels.wechatQr : channels.alipayQr" class="qr-img" alt="收款码" />
          <div class="qr-sub">转账完成后点击下方按钮，系统将自动核销并激活会员</div>
        </div>

        <!-- 温馨提示说明 -->
        <div v-if="channels.noticeText" class="cashier-notice">
          💡 {{ channels.noticeText }}
        </div>

        <!-- 支付确认按钮 -->
        <div class="cashier-actions">
          <button
            class="cashier-btn"
            :disabled="paying"
            @click="handleConfirmPay"
          >
            <span v-if="paying">正在处理支付与激活...</span>
            <span v-else>{{ selectedChannel === 'mock' ? '⚡ 确认一键极速支付' : '我已完成支付，立即激活' }}</span>
          </button>
        </div>
      </div>
    </van-popup>

    <!-- 卡密兑换弹窗 -->
    <van-dialog
      v-model:show="showCardDialog"
      title="🔑 VIP 专属卡密兑换"
      show-cancel-button
      confirm-button-text="立即兑换"
      :before-close="handleRedeemBeforeClose"
    >
      <div class="card-dialog-body">
        <p class="cd-tip">请输入您获取到的 VIP 专属卡密兑换码：</p>
        <van-field
          v-model="cardCodeInput"
          placeholder="例如：VIP-LIFE-XXXXXX"
          class="card-input"
          clearable
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import {
  getPlans,
  getVipStatus,
  createOrder,
  getPaymentChannels,
  mockPayOrder,
  redeemVipCard,
  type VipPlan,
  type VipStatusInfo,
  type PaymentChannels,
} from '@/api/vip'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const buying = ref(false)
const paying = ref(false)
const showCashierPopup = ref(false)
const selectedChannel = ref<'mock' | 'wechat' | 'alipay'>('mock')

const showCardDialog = ref(false)
const cardCodeInput = ref('')

const planList = ref<VipPlan[]>([])
const selectedPlan = ref<VipPlan | null>(null)
const vipStatus = ref<VipStatusInfo>({
  vipLevel: 0,
  vipLevelName: '免费学员',
  vipExpireAt: null,
  isVip: false,
  isLifetime: false,
  expireText: '未开通会员',
})

const channels = ref<PaymentChannels>({
  sandboxEnabled: true,
  wechatEnabled: true,
  wechatType: 'qr_code',
  wechatQr: '',
  alipayEnabled: true,
  alipayType: 'qr_code',
  alipayQr: '',
  cardEnabled: true,
  noticeText: '如遇到充值疑问或支付问题，请联系官方客服微信协助处理。',
})

// 默认备选套餐数据（月卡6、季卡15、年卡60、永久会员68）
const fallbackPlans: VipPlan[] = [
  {
    id: '1',
    name: '月卡会员',
    type: 'monthly',
    price: 6,
    originalPrice: 19,
    duration: '30天',
    durationDays: 30,
    features: ['解锁全部题目', 'AI智能解析', '错题本无上限', '艾宾浩斯智能复习'],
    tag: '体验尝鲜',
    popular: false,
  },
  {
    id: '2',
    name: '季卡会员',
    type: 'quarterly',
    price: 15,
    originalPrice: 45,
    duration: '90天',
    durationDays: 90,
    features: ['解锁全部题目与历年真题', 'AI智能深度解析', '错题本无上限', '艾宾浩斯智能复习', '全真模拟考试'],
    tag: '👍 备考推荐',
    popular: true,
  },
  {
    id: '3',
    name: '年卡会员',
    type: 'yearly',
    price: 60,
    originalPrice: 180,
    duration: '365天',
    durationDays: 365,
    features: ['解锁全部科目全部题库', 'AI智能极速解析', '无限次全真模拟考试', '错题本智能巩固', '专属答疑社群'],
    tag: '👑 超值首选',
    popular: false,
  },
  {
    id: '4',
    name: '永久尊享会员',
    type: 'lifetime',
    price: 68,
    originalPrice: 298,
    duration: '永久有效',
    durationDays: 36500,
    isLifetime: true,
    features: ['永久终身买断 · 无限期有效', '解锁全科全部历年真题与题库', 'AI深度无限次出题与解析', '未来新考季题库永久免费更新', 'VIP尊享身份标识与专属客服'],
    tag: '🔥 终身买断 · 限时特惠',
    popular: true,
  },
]

const benefitList = [
  { icon: '📚', title: '全站真题不限量', desc: '畅刷软考各科目历年真题与章节练习' },
  { icon: '🤖', title: 'AI 深度考点精解', desc: '大模型逐题深度剖析答题要点与思路' },
  { icon: '⏱️', title: '全真模拟机考模考', desc: '真实模拟考试环境与考后智能估分' },
  { icon: '🧠', title: '艾宾浩斯抗遗忘复习', desc: '科学遗忘曲线算法定制每日复习清单' },
  { icon: '📝', title: '案例分析与论文专区', desc: '专项突破主观大题与高分范文解析' },
  { icon: '🔄', title: '新考季题库永久同步', desc: '紧跟最新软考大纲动态及时补充新题' },
  { icon: '⚡', title: '纯净备考 · 专属客服', desc: '无任何广告打扰，专属答疑通道' },
]

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function selectPlan(plan: VipPlan) {
  selectedPlan.value = plan
}

async function loadData() {
  loading.value = true
  try {
    const [planRes, statusRes, channelRes] = await Promise.allSettled([
      getPlans(),
      getVipStatus(),
      getPaymentChannels(),
    ])

    if (planRes.status === 'fulfilled' && planRes.value?.data && planRes.value.data.length > 0) {
      planList.value = planRes.value.data
    } else {
      planList.value = fallbackPlans
    }

    // 优先选中永久会员或推荐套餐
    const defaultSelect =
      planList.value.find((p) => p.type === 'lifetime' || p.isLifetime) ||
      planList.value.find((p) => p.popular) ||
      planList.value[0]
    selectedPlan.value = defaultSelect || null

    if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
      vipStatus.value = statusRes.value.data
    }

    if (channelRes.status === 'fulfilled' && channelRes.value?.data) {
      const d: any = channelRes.value.data
      channels.value = {
        sandboxEnabled: d.sandboxEnabled !== undefined ? Boolean(d.sandboxEnabled) : (d.sandbox?.enabled ?? true),
        wechatEnabled: d.wechatEnabled !== undefined ? Boolean(d.wechatEnabled) : (d.wechat?.enabled ?? true),
        wechatType: d.wechatType || d.wechat?.type || 'qr_code',
        wechatQr: d.wechatQr || d.wechat?.qrCode || '',
        alipayEnabled: d.alipayEnabled !== undefined ? Boolean(d.alipayEnabled) : (d.alipay?.enabled ?? true),
        alipayType: d.alipayType || d.alipay?.type || 'qr_code',
        alipayQr: d.alipayQr || d.alipay?.qrCode || '',
        cardEnabled: d.cardEnabled !== undefined ? Boolean(d.cardEnabled) : (d.card?.enabled ?? true),
        noticeText: d.noticeText || '如遇到充值疑问或支付问题，请联系官方客服微信协助处理。',
      }
      if (channels.value.sandboxEnabled !== false) {
        selectedChannel.value = 'mock'
      } else if (channels.value.wechatEnabled !== false) {
        selectedChannel.value = 'wechat'
      } else if (channels.value.alipayEnabled !== false) {
        selectedChannel.value = 'alipay'
      }
    } else {
      channels.value = {
        sandboxEnabled: true,
        wechatEnabled: true,
        wechatType: 'qr_code',
        wechatQr: '',
        alipayEnabled: true,
        alipayType: 'qr_code',
        alipayQr: '',
        cardEnabled: true,
        noticeText: '如遇到充值疑问或支付问题，请联系官方客服微信协助处理。',
      }
      selectedChannel.value = 'mock'
    }
  } catch {
    planList.value = fallbackPlans
    selectedPlan.value = fallbackPlans[3]
  } finally {
    loading.value = false
  }
}

function handlePurchase() {
  if (!selectedPlan.value) {
    return showToast('请选择需要开通的会员套餐')
  }
  showCashierPopup.value = true
}

async function handleConfirmPay() {
  if (!selectedPlan.value) return

  paying.value = true
  try {
    const orderRes = await createOrder({
      planId: selectedPlan.value.id,
      type: selectedPlan.value.type,
      payMethod: selectedChannel.value,
    })

    const orderData: any = orderRes.data || orderRes
    const orderId = orderData?.orderId || orderData?.id

    // 执行快捷模拟/扫码核销
    if (orderId) {
      await mockPayOrder(orderId)
    }

    showCashierPopup.value = false
    showToast({
      type: 'success',
      message: `🎉 恭喜！${selectedPlan.value.name} 开通成功！`,
      duration: 2500,
    })

    if (userStore.userInfo) {
      userStore.userInfo.isVip = true
    }

    // 重新获取最新会员状态与套餐
    await loadData()
  } catch (err: any) {
    showToast({
      type: 'fail',
      message: err.message || '开通会员失败，请稍后重试',
    })
  } finally {
    paying.value = false
  }
}

async function handleRedeemBeforeClose(action: string) {
  if (action === 'confirm') {
    const code = cardCodeInput.value.trim()
    if (!code) {
      showToast('请输入卡密兑换码')
      return false
    }

    try {
      const res = await redeemVipCard(code)
      showToast({
        type: 'success',
        message: `🎉 兑换成功！已为您激活 [${res.data?.planName || 'VIP会员'}]`,
        duration: 2500,
      })
      cardCodeInput.value = ''
      if (userStore.userInfo) {
        userStore.userInfo.isVip = true
      }
      const statusRes = await getVipStatus()
      if (statusRes?.data) {
        vipStatus.value = statusRes.data
      }
      return true
    } catch (err: any) {
      showToast({
        type: 'fail',
        message: err.message || '卡密无效或已被使用',
      })
      return false
    }
  }
  return true
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.vip-page {
  min-height: 100vh;
  background: #f8fafc;
}

.nav-bar {
  height: 48px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #edf2f7;
  position: sticky;
  top: 0;
  z-index: 50;

  .back {
    font-size: 26px;
    color: #475569;
    cursor: pointer;
    line-height: 1;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .right {
    width: 24px;
  }
}

.vip-content {
  padding: 14px 16px;
}

/* 头部尊享卡片 */
.vip-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  padding: 20px 18px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid rgba(251, 191, 36, 0.2);

  &.is-lifetime {
    background: linear-gradient(135deg, #2d1810 0%, #170d08 100%);
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .user-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-box {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #1e293b;
      font-weight: 800;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }

    .user-names {
      .un {
        font-size: 16px;
        font-weight: 700;
        color: #ffffff;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(251, 191, 36, 0.15);
        color: #fbbf24;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        margin-top: 4px;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }
    }
  }

  .crown-icon {
    font-size: 32px;
  }

  .hero-expire {
    font-size: 12px;
    padding-top: 12px;
    border-top: 1px dashed rgba(255, 255, 255, 0.12);

    .expire-highlight {
      color: #fbbf24;
      font-weight: 600;
    }
    .expire-normal {
      color: #94a3b8;
    }
    .expire-free {
      color: #cbd5e1;
    }
  }
}

/* 分段标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;

  .icon { font-size: 18px; }
  .sub-hint {
    margin-left: auto;
    font-size: 11px;
    color: #94a3b8;
    font-weight: normal;
  }
}

.loading-box {
  padding: 30px 0;
  text-align: center;
}

/* 套餐栅格卡片 */
.vip-plans-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.vip-plan-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px 14px;
  border: 2px solid #e2e8f0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #f59e0b;
    background: #fffdf5;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18);
  }

  &.lifetime {
    border-color: #f59e0b;
    background: linear-gradient(180deg, #fffbeb 0%, #ffffff 100%);
  }

  .card-badge {
    position: absolute;
    top: -10px;
    right: 8px;
    background: linear-gradient(135deg, #ef4444, #f97316);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);

    &.badge-lifetime {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }
  }

  .card-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .card-price-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 6px;

    .currency {
      font-size: 14px;
      font-weight: 700;
      color: #d97706;
    }

    .price-val {
      font-size: 26px;
      font-weight: 800;
      color: #d97706;
      line-height: 1;
    }

    .orig-price {
      font-size: 12px;
      color: #94a3b8;
      text-decoration: line-through;
      margin-left: 4px;
    }
  }

  .card-duration {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #64748b;
    margin-top: auto;

    .save-tag {
      background: #fef3c7;
      color: #b45309;
      font-weight: 700;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 4px;
    }
  }
}

/* 专属权益卡片 */
.vip-benefits-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px;
  border: 1px solid #edf2f7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  margin-bottom: 16px;

  .vb-head {
    margin-bottom: 14px;
    .vb-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      display: block;
    }
    .vb-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
      display: block;
    }
  }

  .benefits-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .b-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #f8fafc;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .b-text {
      .t {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .d {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
    }
  }
}

/* FAQ */
.faq-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid #edf2f7;
  margin-bottom: 16px;

  .faq-title {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
  }

  .faq-item {
    margin-bottom: 10px;
    &:last-child { margin-bottom: 0; }

    .q {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .a {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }
  }
}

/* 底部操作栏 */
.vip-buy-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 68px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);

  .price-summary {
    .main-price {
      display: flex;
      align-items: baseline;
      gap: 2px;

      .p-symbol {
        font-size: 14px;
        font-weight: 700;
        color: #d97706;
      }

      .p-number {
        font-size: 24px;
        font-weight: 800;
        color: #d97706;
        line-height: 1;
      }

      .p-orig {
        font-size: 11px;
        color: #94a3b8;
        text-decoration: line-through;
        margin-left: 4px;
      }
    }

    .plan-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;

      .badge-mini {
        background: #fef3c7;
        color: #b45309;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
      }
    }
  }

  .btn-purchase {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #1e293b;
    border: none;
    height: 44px;
    padding: 0 24px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    transition: all 0.2s;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

/* 顶部导航栏卡密兑换按钮 */
.btn-card-top {
  font-size: 12px;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
}

/* 收银台弹窗样式 */
.cashier-popup {
  max-height: 85vh;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.cashier-container {
  padding: 20px 16px 24px;

  .cashier-title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    text-align: center;
    margin-bottom: 16px;
  }

  .order-summary-card {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 1px solid #fde68a;
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 16px;

    .os-head {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .os-plan-name {
        font-size: 16px;
        font-weight: 800;
        color: #78350f;
      }
      .os-tag {
        font-size: 11px;
        font-weight: 700;
        color: #b45309;
        background: #ffffff;
        padding: 2px 8px;
        border-radius: 6px;
      }
    }

    .os-price-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #fcd34d;

      .os-label {
        font-size: 13px;
        color: #92400e;
        font-weight: 600;
      }
      .os-price {
        font-size: 26px;
        font-weight: 900;
        color: #b45309;
      }
    }
  }

  .channel-section {
    margin-bottom: 16px;

    .sec-label {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 10px;
    }

    .channel-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .channel-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #fffbeb;
          border-color: #f59e0b;
        }

        .ch-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .ch-icon {
            font-size: 24px;
          }

          .ch-info {
            .ch-name {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }
            .ch-desc {
              font-size: 11.5px;
              color: #64748b;
              margin-top: 2px;
            }
          }
        }

        .ch-radio {
          font-size: 18px;
        }
      }
    }
  }

  .qr-pay-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    text-align: center;
    margin-bottom: 16px;

    .qr-tip {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 8px;
    }

    .qr-img {
      width: 160px;
      height: 160px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      object-fit: contain;
      margin: 0 auto;
    }

    .qr-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
  }

  .cashier-notice {
    font-size: 12px;
    color: #64748b;
    background: #f1f5f9;
    padding: 10px 12px;
    border-radius: 8px;
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .cashier-actions {
    .cashier-btn {
      width: 100%;
      height: 46px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #1e293b;
      border: none;
      border-radius: 23px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);

      &:disabled {
        opacity: 0.7;
      }
    }
  }
}

/* 卡密兑换弹窗 */
.card-dialog-body {
  padding: 16px 20px 8px;

  .cd-tip {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .card-input {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
}
</style>
