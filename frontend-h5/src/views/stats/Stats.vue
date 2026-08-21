<template>
  <div class="stat-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">做题统计</div>
      <div class="right" @click="onExport">导出</div>
    </div>

    <!-- 数据总览 4格 -->
    <div class="stat-overview">
      <div class="so-grid">
        <div class="so-item">
          <div class="so-num">156<small>题</small></div>
          <div class="so-label">累计刷题</div>
        </div>
        <div class="so-item">
          <div class="so-num">73<small>%</small></div>
          <div class="so-label">平均正确率</div>
        </div>
        <div class="so-item">
          <div class="so-num">4.5<small>h</small></div>
          <div class="so-label">累计时长</div>
        </div>
        <div class="so-item">
          <div class="so-num">12<small>天</small></div>
          <div class="so-label">连续打卡</div>
        </div>
      </div>
    </div>

    <!-- 刷题趋势 -->
    <div class="stat-card">
      <div class="sc-title">
        <span>📈 刷题趋势</span>
        <div class="sc-switch">
          <span :class="{ active: trendType === 'week' }" @click="trendType = 'week'">周</span>
          <span :class="{ active: trendType === 'month' }" @click="trendType = 'month'">月</span>
        </div>
      </div>
      <div class="chart-placeholder">
        <div class="chart-bar" style="height: 40%"><div class="bar-val">8</div></div>
        <div class="chart-bar" style="height: 60%"><div class="bar-val">12</div></div>
        <div class="chart-bar" style="height: 30%"><div class="bar-val">6</div></div>
        <div class="chart-bar" style="height: 80%"><div class="bar-val">16</div></div>
        <div class="chart-bar" style="height: 50%"><div class="bar-val">10</div></div>
        <div class="chart-bar" style="height: 90%"><div class="bar-val">18</div></div>
        <div class="chart-bar today" style="height: 70%"><div class="bar-val">14</div></div>
      </div>
      <div class="chart-labels">
        <span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>今天</span>
      </div>
    </div>

    <!-- 能力雷达图 -->
    <div class="stat-card">
      <div class="sc-title">🎯 知识图谱与能力雷达</div>
      <div class="radar-svg-wrap">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,50 140,75 140,125 100,150 60,125 60,75"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,80 120,90 120,110 100,120 80,110 80,90"
            fill="none"
            stroke="#E9EBEF"
            stroke-width="1.5"
          />
          <polygon
            points="100,35 155,72 148,130 100,165 45,135 38,68"
            fill="rgba(99,102,241,0.2)"
            stroke="#6366F1"
            stroke-width="2"
          />
          <text x="100" y="12" text-anchor="middle" font-size="10" fill="#6B7280">项目管理</text>
          <text x="178" y="58" text-anchor="middle" font-size="10" fill="#6B7280">范围</text>
          <text x="178" y="148" text-anchor="middle" font-size="10" fill="#6B7280">进度</text>
          <text x="100" y="195" text-anchor="middle" font-size="10" fill="#6B7280">成本</text>
          <text x="22" y="148" text-anchor="middle" font-size="10" fill="#6B7280">质量</text>
          <text x="22" y="58" text-anchor="middle" font-size="10" fill="#6B7280">风险</text>
        </svg>
      </div>

      <div class="radar-legend-grid">
        <div class="legend-item"><div class="dot" style="background: #6366f1"></div>项目管理 72%</div>
        <div class="legend-item"><div class="dot" style="background: #10b981"></div>范围管理 85%</div>
        <div class="legend-item"><div class="dot" style="background: #f59e0b"></div>进度管理 45%</div>
        <div class="legend-item"><div class="dot" style="background: #ef4444"></div>成本管理 32%</div>
        <div class="legend-item"><div class="dot" style="background: #a855f7"></div>质量管理 68%</div>
        <div class="legend-item"><div class="dot" style="background: #06b6d4"></div>风险管理 55%</div>
      </div>
    </div>

    <!-- 错题分布排行榜 -->
    <div class="stat-card">
      <div class="sc-title">📉 错题高频分布</div>
      <div class="wrong-dist-list">
        <div class="dist-item">
          <div class="di-head">
            <span class="name">项目成本管理</span>
            <span class="num danger">15题</span>
          </div>
          <div class="di-track">
            <div class="di-fill danger" style="width: 80%"></div>
          </div>
        </div>
        <div class="dist-item">
          <div class="di-head">
            <span class="name">项目进度管理</span>
            <span class="num danger">12题</span>
          </div>
          <div class="di-track">
            <div class="di-fill danger" style="width: 65%"></div>
          </div>
        </div>
        <div class="dist-item">
          <div class="di-head">
            <span class="name">项目风险管理</span>
            <span class="num warning">8题</span>
          </div>
          <div class="di-track">
            <div class="di-fill warning" style="width: 42%"></div>
          </div>
        </div>
        <div class="dist-item">
          <div class="di-head">
            <span class="name">项目整体管理</span>
            <span class="num success">4题</span>
          </div>
          <div class="di-track">
            <div class="di-fill success" style="width: 20%"></div>
          </div>
        </div>
      </div>
    </div>

    <div style="height: 80px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'

const trendType = ref<'week' | 'month'>('week')

function onExport() {
  showToast('统计报告已生成')
}
</script>

<style scoped lang="scss">
.stat-page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
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

.stat-overview {
  margin: 14px;
}

.so-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 8px;
  box-shadow: var(--shadow-sm);
}

.so-item {
  text-align: center;

  .so-num {
    font-size: 20px;
    font-weight: 800;
    color: var(--gray-9);

    small {
      font-size: 11px;
      font-weight: 500;
      color: var(--gray-5);
    }
  }

  .so-label {
    font-size: 11px;
    color: var(--gray-5);
    margin-top: 4px;
  }
}

.stat-card {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-sm);

  .sc-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 14px;
  }

  .sc-switch {
    display: flex;
    background: var(--gray-2);
    border-radius: 12px;
    padding: 2px;

    span {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 10px;
      color: var(--gray-6);
      cursor: pointer;

      &.active {
        background: var(--primary);
        color: #fff;
        font-weight: 700;
      }
    }
  }
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
  padding: 0 10px 10px;
  border-bottom: 1px solid var(--gray-2);

  .chart-bar {
    width: 22px;
    background: linear-gradient(180deg, #818cf8, #6366f1);
    border-radius: 6px 6px 0 0;
    position: relative;

    .bar-val {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--gray-5);
      font-weight: 600;
    }

    &.today {
      background: linear-gradient(180deg, #f97316, #ea580c);
    }
  }
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--gray-5);
  padding: 8px 6px 0;
}

.radar-svg-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.radar-legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--gray-6);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}

.wrong-dist-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .dist-item {
    .di-head {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;

      .name {
        color: var(--gray-7);
        font-weight: 500;
      }

      .num {
        font-weight: 700;

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

    .di-track {
      height: 8px;
      background: var(--gray-2);
      border-radius: 4px;
      overflow: hidden;

      .di-fill {
        height: 100%;
        border-radius: 4px;

        &.danger {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }
        &.warning {
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }
        &.success {
          background: linear-gradient(90deg, #10b981, #34d399);
        }
      }
    }
  }
}
</style>
