<template>
  <aside class="pc-desktop-left-sidebar">
    <!-- 品牌标志卡片 -->
    <div class="pc-brand-card">
      <div class="brand-logo-row">
        <div class="logo-box">🎓</div>
        <div class="logo-texts">
          <div class="brand-title">软考刷题宝</div>
          <div class="brand-badge">PC 桌面适配版</div>
        </div>
      </div>
      <p class="brand-slogan">全国软考统考备考题库 · AI 智能辅导</p>
    </div>

    <!-- 当前科目快捷切换 -->
    <div class="pc-subject-card" @click="$router.push('/subject')">
      <div class="subj-header">
        <span class="subj-tag">当前报考科目</span>
        <span class="subj-change">切换 ›</span>
      </div>
      <div class="subj-name">
        {{ subjectStore.currentSubject?.name || '系统集成项目管理工程师' }}
      </div>
      <div class="subj-level">
        {{ subjectStore.currentSubject?.level === 'high' ? '高级工程师 (高项)' : '中级工程师 (中级)' }}
      </div>
    </div>

    <!-- 桌面端快捷导航 -->
    <nav class="pc-nav-menu">
      <div class="nav-heading">🚀 快捷导航</div>
      <div
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: currentRoutePath === item.path }"
        @click="$router.push(item.path)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-title">{{ item.title }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </div>
    </nav>

    <!-- 快捷键指南卡片 -->
    <div class="pc-shortcut-card">
      <div class="sc-header">
        <span class="sc-icon">⌨️</span>
        <span class="sc-title">桌面答题快捷键</span>
      </div>
      <div class="sc-list">
        <div class="sc-row">
          <span class="key-pill">←</span>
          <span class="key-pill">→</span>
          <span class="sc-desc">上一题 / 下一题</span>
        </div>
        <div class="sc-row">
          <span class="key-pill">A</span>
          <span class="key-pill">B</span>
          <span class="key-pill">C</span>
          <span class="key-pill">D</span>
          <span class="sc-desc">快速选择选项</span>
        </div>
        <div class="sc-row">
          <span class="key-pill">1</span>
          <span class="key-pill">2</span>
          <span class="key-pill">3</span>
          <span class="key-pill">4</span>
          <span class="sc-desc">数字键对应选项</span>
        </div>
        <div class="sc-row">
          <span class="key-pill">Space</span>
          <span class="sc-desc">展开 / 收起答题卡</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSubjectStore } from '@/stores/subject'

const route = useRoute()
const subjectStore = useSubjectStore()

const currentRoutePath = computed(() => route.path)

const navItems = [
  { icon: '🏠', title: '备考大盘首页', path: '/' },
  { icon: '📚', title: '历年全真真题', path: '/real-exam' },
  { icon: '📑', title: '章节专项刷题', path: '/chapter' },
  { icon: '⚡', title: '每日一练打卡', path: '/daily' },
  { icon: '🧠', title: '艾宾浩斯复习', path: '/review' },
  { icon: '❌', title: '智能错题本', path: '/wrong' },
  { icon: '📊', title: '做题统计与分析', path: '/stats' },
  { icon: '👑', title: 'VIP 会员中心', path: '/vip', badge: '特惠' },
  { icon: '👤', title: '个人学习中心', path: '/mine' },
]
</script>

<style scoped lang="scss">
.pc-desktop-left-sidebar {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 20px;
  user-select: none;
}

/* 品牌卡片 */
.pc-brand-card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 18px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .brand-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;

    .logo-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
    }

    .brand-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    .brand-badge {
      font-size: 10px;
      background: rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid rgba(99, 102, 241, 0.4);
      margin-top: 2px;
      display: inline-block;
    }
  }

  .brand-slogan {
    font-size: 11px;
    color: #94a3b8;
    margin: 10px 0 0 0;
  }
}

/* 科目卡片 */
.pc-subject-card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  &:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
  }

  .subj-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .subj-tag {
      font-size: 11px;
      color: #94a3b8;
    }

    .subj-change {
      font-size: 11px;
      color: #818cf8;
      font-weight: 600;
    }
  }

  .subj-name {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.4;
  }

  .subj-level {
    font-size: 11px;
    color: #38bdf8;
    margin-top: 4px;
  }
}

/* 导航菜单 */
.pc-nav-menu {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  .nav-heading {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    padding: 4px 8px 6px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    font-weight: 600;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    &.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    .nav-icon {
      font-size: 16px;
    }

    .nav-title {
      flex: 1;
    }

    .nav-badge {
      font-size: 10px;
      background: #ef4444;
      color: #fff;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 700;
    }
  }
}

/* 快捷键指南 */
.pc-shortcut-card {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

  .sc-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #fbbf24;
    margin-bottom: 10px;
  }

  .sc-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sc-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #94a3b8;

    .key-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f1f5f9;
      font-weight: 700;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      min-width: 18px;
      text-align: center;
    }

    .sc-desc {
      margin-left: 4px;
    }
  }
}
</style>
