<template>
  <div class="statistics-page">
    <!-- 4大核心指标卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="sc-icon" style="background: #eef2ff; color: #4a6cf7">📝</div>
        <div class="sc-info">
          <div class="sc-num">128,450</div>
          <div class="sc-label">累计刷题人次</div>
          <div class="sc-trend up">较上月 ↑ 18.2%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #f0fdf4; color: #22c55e">🎯</div>
        <div class="sc-info">
          <div class="sc-num">76.4%</div>
          <div class="sc-label">学员平均正确率</div>
          <div class="sc-trend up">较上月 ↑ 2.1%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #fff7ed; color: #f97316">💰</div>
        <div class="sc-info">
          <div class="sc-num">¥86,520</div>
          <div class="sc-label">平台累计充值</div>
          <div class="sc-trend up">较上月 ↑ 34.5%</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="sc-icon" style="background: #f5f3ff; color: #8b5cf6">📊</div>
        <div class="sc-info">
          <div class="sc-num">68.5%</div>
          <div class="sc-label">模拟考通关预测率</div>
          <div class="sc-trend up">较上月 ↑ 5.3%</div>
        </div>
      </div>
    </div>

    <!-- 趋势图表与分布 -->
    <div class="chart-row">
      <!-- 刷题趋势 -->
      <div class="panel">
        <div class="panel-title">
          <span>📈 刷题量与活跃走势</span>
        </div>
        <div class="trend-bars">
          <div v-for="item in weeklyTrend" :key="item.day" class="tb-item">
            <div class="tb-bar-wrap">
              <div class="tb-bar active-bar" :style="{ height: item.activeH + '%' }" title="活跃用户"></div>
              <div class="tb-bar question-bar" :style="{ height: item.questionH + '%' }" title="刷题量"></div>
            </div>
            <span class="tb-day">{{ item.day }}</span>
          </div>
        </div>
      </div>

      <!-- 各科目正确率 -->
      <div class="panel">
        <div class="panel-title">
          <span>🎯 各科目平均掌握度</span>
        </div>
        <div class="subject-rates">
          <div v-for="sub in subjectRates" :key="sub.name" class="sr-item">
            <div class="sr-header">
              <span class="sr-name">{{ sub.name }}</span>
              <span class="sr-rate">{{ sub.rate }}%</span>
            </div>
            <div class="sr-bar-track">
              <div class="sr-bar-fill" :style="{ width: sub.rate + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高频易错考点 TOP 5 -->
    <div class="panel weak-panel">
      <div class="panel-title">
        <span>🔥 平台高频易错考点 TOP 5</span>
      </div>
      <div class="weak-list">
        <div v-for="(wp, i) in weakPoints" :key="wp.name" class="wp-item">
          <div class="wp-rank">{{ i + 1 }}</div>
          <div class="wp-info">
            <div class="wp-name">{{ wp.name }}</div>
            <div class="wp-desc">{{ wp.subject }} · {{ wp.errorCount }}次做错</div>
          </div>
          <div class="wp-rate-col">
            <div class="wp-rate-val">{{ wp.errorRate }}%</div>
            <div class="wp-rate-lbl">平均错误率</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const weeklyTrend = ref([
  { day: '08-15', activeH: 45, questionH: 60 },
  { day: '08-16', activeH: 52, questionH: 68 },
  { day: '08-17', activeH: 60, questionH: 75 },
  { day: '08-18', activeH: 58, questionH: 72 },
  { day: '08-19', activeH: 70, questionH: 85 },
  { day: '08-20', activeH: 88, questionH: 95 },
  { day: '08-21', activeH: 82, questionH: 90 },
])

const subjectRates = ref([
  { name: '系统集成项目管理工程师', rate: 78 },
  { name: '信息系统项目管理师', rate: 72 },
  { name: '网络工程师', rate: 70 },
  { name: '软件设计师', rate: 65 },
  { name: '系统架构设计师', rate: 62 },
])

const weakPoints = ref([
  { name: '关键路径法 (CPM) 总时差与自由时差计算', subject: '项目进度管理', errorCount: '1,420', errorRate: 58 },
  { name: '挣值分析法 (EVM) CV/SV/CPI/SPI 公式推导', subject: '项目成本管理', errorCount: '1,280', errorRate: 54 },
  { name: '项目变更控制委员会 (CCB) 决策机制', subject: '项目整体管理', errorCount: '980', errorRate: 46 },
  { name: 'WBS 工作分解结构创建原则与字典编制', subject: '项目范围管理', errorCount: '860', errorRate: 42 },
  { name: '定性风险分析与定量风险分析工具对比', subject: '项目风险管理', errorCount: '750', errorRate: 39 },
])
</script>

<style scoped lang="scss">
.statistics-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .sc-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
  }

  .sc-info {
    flex: 1;

    .sc-num {
      font-size: 28px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .sc-label {
      font-size: 13px;
      color: var(--gray-6);
      margin-top: 4px;
    }

    .sc-trend.up {
      font-size: 12px;
      color: var(--success);
      margin-top: 4px;
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .panel-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 18px;
  }
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  padding-top: 20px;

  .tb-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    height: 100%;
    justify-content: flex-end;

    .tb-bar-wrap {
      display: flex;
      gap: 4px;
      align-items: flex-end;
      height: 100%;

      .tb-bar {
        width: 14px;
        border-radius: 4px 4px 0 0;

        &.active-bar {
          background: #8b5cf6;
        }
        &.question-bar {
          background: #4a6cf7;
        }
      }
    }

    .tb-day {
      font-size: 11px;
      color: var(--gray-5);
    }
  }
}

.subject-rates {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .sr-item {
    .sr-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-8);
      margin-bottom: 6px;

      .sr-rate {
        color: var(--primary);
      }
    }

    .sr-bar-track {
      height: 8px;
      background: var(--gray-2);
      border-radius: 4px;
      overflow: hidden;

      .sr-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #4a6cf7, #8b5cf6);
        border-radius: 4px;
      }
    }
  }
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .wp-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: var(--gray-1);
    border-radius: 6px;

    .wp-rank {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: #fee2e2;
      color: #ef4444;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wp-info {
      flex: 1;

      .wp-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--gray-8);
      }

      .wp-desc {
        font-size: 12px;
        color: var(--gray-5);
        margin-top: 2px;
      }
    }

    .wp-rate-col {
      text-align: right;

      .wp-rate-val {
        font-size: 16px;
        font-weight: 800;
        color: var(--danger);
      }

      .wp-rate-lbl {
        font-size: 11px;
        color: var(--gray-5);
      }
    }
  }
}
</style>
