<template>
  <div class="wrong-page">
    <div class="nav-bar">
      <div class="back" @click="$router.back()">‹</div>
      <div class="title">错题本</div>
      <div class="right" @click="editMode = !editMode">{{ editMode ? '完成' : '管理' }}</div>
    </div>

    <!-- 题型过滤器 -->
    <div class="wrong-header">
      <div
        v-for="(t, idx) in types"
        :key="t"
        class="filter-chip"
        :class="{ active: currentTypeIndex === idx }"
        @click="currentTypeIndex = idx"
      >
        {{ t }}
      </div>
    </div>

    <!-- 错题统计与集中攻关 -->
    <div class="wrong-stats">
      <div>
        <div class="ws-num">{{ filteredList.length }}</div>
        <div class="ws-label">道错题待攻克</div>
      </div>
      <div class="ws-btn" @click="startRedo">开始重做</div>
    </div>

    <!-- 错题卡片列表 -->
    <div class="wrong-list">
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="wrong-card"
        @click="goAnalysis(item.id)"
      >
        <div class="wc-header">
          <div class="wc-tags">
            <span class="wc-type">{{ item.type }}</span>
            <span class="wc-chapter">{{ item.chapter }}</span>
          </div>
          <div class="wc-time">{{ item.time }}</div>
        </div>

        <div class="wc-content">{{ item.title }}</div>
        <div class="wc-answer">✗ 你的答案：{{ item.myAnswer }} ｜ 正确答案：{{ item.correctAnswer }}</div>

        <div class="wc-footer">
          <div class="wc-actions">
            <div class="wca" @click.stop="goAnalysis(item.id)">📖 查看解析</div>
            <div class="wca" @click.stop="addNote(item)">📓 添加笔记</div>
          </div>
          <div class="wca remove" @click.stop="remove(item.id)">移除</div>
        </div>
      </div>
    </div>

    <div style="height: 80px"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const editMode = ref(false)
const currentTypeIndex = ref(0)
const types = ['全部', '单选题', '多选题', '判断题', '填空题']

const wrongList = ref([
  {
    id: '1',
    type: '单选题',
    chapter: '项目整体管理',
    time: '2天前',
    title: '制定项目章程的输入不包括以下哪项？A.项目工作说明书 B.商业论证 C.项目范围说明书 D.协议',
    myAnswer: 'C',
    correctAnswer: 'B',
  },
  {
    id: '2',
    type: '多选题',
    chapter: '项目范围管理',
    time: '3天前',
    title: '项目范围管理的主要过程包括哪些？请从以下选项中选择所有正确项。',
    myAnswer: 'ABC',
    correctAnswer: 'ABCD',
  },
  {
    id: '3',
    type: '填空题',
    chapter: '项目进度管理',
    time: '5天前',
    title: '关键路径法中，总时差为零的路径称为______路径。',
    myAnswer: '最短',
    correctAnswer: '关键',
  },
])

const filteredList = computed(() => {
  if (currentTypeIndex.value === 0) return wrongList.value
  const target = types[currentTypeIndex.value]
  return wrongList.value.filter((i) => i.type === target)
})

function goAnalysis(id: string) {
  router.push(`/quiz/analysis/${id}`)
}

function startRedo() {
  showToast('开始错题攻关！')
  router.push('/quiz/practice')
}

function addNote(item: any) {
  showDialog({
    title: '为该题记录笔记',
    message: '笔记已保存。',
  })
}

function remove(id: string) {
  wrongList.value = wrongList.value.filter((i) => i.id !== id)
  showToast('已从错题本移除')
}
</script>

<style scoped lang="scss">
.wrong-page {
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

.wrong-header {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  overflow-x: auto;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    padding: 6px 14px;
    border-radius: 16px;
    font-size: 13px;
    color: var(--gray-6);
    background: var(--gray-2);
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;

    &.active {
      background: var(--primary-bg);
      color: var(--primary);
      font-weight: 700;
    }
  }
}

.wrong-stats {
  margin: 14px;
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);

  .ws-num {
    font-size: 24px;
    font-weight: 800;
    color: var(--danger);
  }

  .ws-label {
    font-size: 12px;
    color: var(--gray-5);
    margin-top: 2px;
  }

  .ws-btn {
    background: var(--primary);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 18px;
    cursor: pointer;
    box-shadow: 0 4px 10px var(--primary-glow);
  }
}

.wrong-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;

  .wc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .wc-tags {
      display: flex;
      gap: 6px;

      .wc-type {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--primary-bg);
        color: var(--primary);
      }

      .wc-chapter {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--gray-2);
        color: var(--gray-6);
      }
    }

    .wc-time {
      font-size: 11px;
      color: var(--gray-4);
    }
  }

  .wc-content {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-8);
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .wc-answer {
    font-size: 12px;
    color: var(--danger);
    background: var(--danger-bg);
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .wc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;
    font-size: 12px;

    .wc-actions {
      display: flex;
      gap: 14px;
      color: var(--gray-6);
    }

    .wca {
      cursor: pointer;

      &.remove {
        color: var(--gray-4);
      }
    }
  }
}
</style>
