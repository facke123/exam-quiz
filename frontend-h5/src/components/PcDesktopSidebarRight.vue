<template>
  <aside class="pc-desktop-right-sidebar">
    <!-- 考试倒计时卡片 -->
    <div class="pc-card countdown-card">
      <div class="card-head">
        <span class="icon">⏱️</span>
        <span class="title">2026年全国软考统考</span>
      </div>
      <div class="cd-body">
        <div class="days-num">{{ examDays }}<span class="unit">天</span></div>
        <div class="cd-desc">距离下一次全国软考开考还有</div>
      </div>
      <div class="cd-foot">
        <span>📅 考试预计时间：2026年11月08日</span>
      </div>
    </div>

    <!-- 手机端扫码答题卡片 -->
    <div class="pc-card mobile-sync-card">
      <div class="card-head">
        <span class="icon">📱</span>
        <span class="title">手机端无缝同步</span>
      </div>
      <div class="qr-box">
        <!-- 动态轻量 SVG 二维码图案 -->
        <svg class="qr-svg" viewBox="0 0 100 100" width="100" height="100">
          <rect width="100" height="100" fill="#ffffff" rx="8" />
          <!-- 3 个角标定位点 -->
          <rect x="10" y="10" width="24" height="24" fill="#1e293b" rx="4" />
          <rect x="14" y="14" width="16" height="16" fill="#ffffff" rx="2" />
          <rect x="18" y="18" width="8" height="8" fill="#6366f1" rx="1" />

          <rect x="66" y="10" width="24" height="24" fill="#1e293b" rx="4" />
          <rect x="70" y="14" width="16" height="16" fill="#ffffff" rx="2" />
          <rect x="74" y="18" width="8" height="8" fill="#6366f1" rx="1" />

          <rect x="10" y="66" width="24" height="24" fill="#1e293b" rx="4" />
          <rect x="14" y="70" width="16" height="16" fill="#ffffff" rx="2" />
          <rect x="18" y="74" width="8" height="8" fill="#6366f1" rx="1" />

          <!-- 二维码矩阵像素块 -->
          <rect x="38" y="12" width="6" height="6" fill="#1e293b" />
          <rect x="48" y="16" width="6" height="6" fill="#6366f1" />
          <rect x="56" y="12" width="6" height="6" fill="#1e293b" />
          <rect x="38" y="24" width="6" height="6" fill="#6366f1" />
          <rect x="48" y="28" width="6" height="6" fill="#1e293b" />

          <rect x="12" y="38" width="6" height="6" fill="#1e293b" />
          <rect x="22" y="44" width="6" height="6" fill="#6366f1" />
          <rect x="38" y="38" width="10" height="10" fill="#1e293b" rx="2" />
          <rect x="52" y="42" width="6" height="6" fill="#6366f1" />
          <rect x="62" y="38" width="6" height="6" fill="#1e293b" />
          <rect x="74" y="44" width="6" height="6" fill="#6366f1" />
          <rect x="82" y="38" width="6" height="6" fill="#1e293b" />

          <rect x="16" y="52" width="6" height="6" fill="#6366f1" />
          <rect x="28" y="52" width="6" height="6" fill="#1e293b" />
          <rect x="42" y="54" width="6" height="6" fill="#6366f1" />
          <rect x="54" y="52" width="6" height="6" fill="#1e293b" />
          <rect x="66" y="54" width="6" height="6" fill="#6366f1" />
          <rect x="78" y="52" width="6" height="6" fill="#1e293b" />

          <rect x="38" y="68" width="6" height="6" fill="#1e293b" />
          <rect x="48" y="66" width="6" height="6" fill="#6366f1" />
          <rect x="58" y="70" width="6" height="6" fill="#1e293b" />
          <rect x="42" y="78" width="6" height="6" fill="#6366f1" />
          <rect x="52" y="82" width="6" height="6" fill="#1e293b" />
          <rect x="68" y="78" width="8" height="8" fill="#6366f1" rx="1" />
          <rect x="80" y="70" width="8" height="8" fill="#1e293b" rx="1" />
        </svg>
        <div class="qr-text">
          <div class="qt-main">手机浏览器 / 微信扫一扫</div>
          <div class="qt-sub">https://quiz.wothat.com</div>
        </div>
      </div>
      <div class="sync-tip">
        ✨ 电脑端做题进度、收藏题、错题本与手机端实时双向云同步。
      </div>
    </div>

    <!-- VIP 会员特惠卡片 -->
    <div class="pc-card vip-promo-card" @click="$router.push('/vip')">
      <div class="vip-top">
        <span class="vip-crown">👑</span>
        <div class="vip-info">
          <div class="vip-t">软考通关 VIP 会员</div>
          <div class="vip-sub">全题库解锁 · AI深度解析</div>
        </div>
      </div>
      <div class="vip-pricing-grid">
        <div class="vp-item">
          <div class="n">月卡</div>
          <div class="p">¥6</div>
        </div>
        <div class="vp-item">
          <div class="n">季卡</div>
          <div class="p">¥15</div>
        </div>
        <div class="vp-item">
          <div class="n">年卡</div>
          <div class="p">¥60</div>
        </div>
        <div class="vp-item highlight">
          <div class="n">永久会员</div>
          <div class="p">¥68</div>
        </div>
      </div>
      <button class="btn-vip-jump">查看特权 & 开通 ›</button>
    </div>

    <!-- 管理后台直达入口 -->
    <div class="pc-card admin-jump-card" @click="openAdmin">
      <div class="admin-row">
        <span class="admin-icon">⚙️</span>
        <div class="admin-text">
          <div class="at-title">管理后台系统</div>
          <div class="at-sub">admin.wothat.com</div>
        </div>
        <span class="admin-arrow">↗</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const examDays = ref(73)

function calculateExamDays() {
  const target = new Date('2026-11-08T09:00:00')
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff > 0) {
    examDays.value = Math.ceil(diff / (1000 * 60 * 60 * 24))
  } else {
    examDays.value = 0
  }
}

function openAdmin() {
  window.open('https://admin.wothat.com', '_blank')
}

onMounted(calculateExamDays)
</script>

<style scoped lang="scss">
.pc-desktop-right-sidebar {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 20px;
  user-select: none;
}

.pc-card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .card-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 12px;

    .icon { font-size: 16px; }
  }
}

/* 倒计时卡片 */
.countdown-card {
  .cd-body {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;

    .days-num {
      font-size: 32px;
      font-weight: 900;
      color: #fbbf24;
      line-height: 1;

      .unit {
        font-size: 14px;
        font-weight: 600;
        color: #f59e0b;
        margin-left: 2px;
      }
    }

    .cd-desc {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .cd-foot {
    font-size: 11px;
    color: #cbd5e1;
    border-top: 1px dashed rgba(255, 255, 255, 0.12);
    padding-top: 8px;
  }
}

/* 手机同步二维码卡片 */
.mobile-sync-card {
  .qr-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(15, 23, 42, 0.6);
    padding: 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);

    .qr-svg {
      border-radius: 6px;
      flex-shrink: 0;
    }

    .qr-text {
      .qt-main {
        font-size: 12px;
        font-weight: 700;
        color: #ffffff;
      }
      .qt-sub {
        font-size: 10px;
        color: #818cf8;
        margin-top: 4px;
        word-break: break-all;
      }
    }
  }

  .sync-tip {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 10px;
    line-height: 1.4;
  }
}

/* VIP 特惠卡片 */
.vip-promo-card {
  background: linear-gradient(135deg, rgba(45, 24, 16, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 1px solid rgba(245, 158, 11, 0.35);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #f59e0b;
    transform: translateY(-2px);
  }

  .vip-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .vip-crown { font-size: 24px; }
    .vip-t {
      font-size: 14px;
      font-weight: 800;
      color: #fbbf24;
    }
    .vip-sub {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 1px;
    }
  }

  .vip-pricing-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-bottom: 12px;

    .vp-item {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      padding: 6px 2px;
      text-align: center;

      .n {
        font-size: 10px;
        color: #94a3b8;
      }
      .p {
        font-size: 13px;
        font-weight: 800;
        color: #f59e0b;
        margin-top: 2px;
      }

      &.highlight {
        background: rgba(245, 158, 11, 0.2);
        border: 1px solid rgba(245, 158, 11, 0.4);
        .n { color: #fbbf24; font-weight: 700; }
        .p { color: #fde68a; }
      }
    }
  }

  .btn-vip-jump {
    width: 100%;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1e293b;
    border: none;
    height: 32px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
}

/* 后台入口卡片 */
.admin-jump-card {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(40, 53, 75, 0.9);
  }

  .admin-row {
    display: flex;
    align-items: center;
    gap: 10px;

    .admin-icon { font-size: 20px; }
    .admin-text {
      flex: 1;
      .at-title { font-size: 13px; font-weight: 700; color: #ffffff; }
      .at-sub { font-size: 11px; color: #64748b; margin-top: 1px; }
    }
    .admin-arrow {
      font-size: 16px;
      color: #94a3b8;
      font-weight: 700;
    }
  }
}
</style>
