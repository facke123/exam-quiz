<template>
  <div class="notes-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        我的笔记
      </div>
      <div class="right">
        <span class="total-badge">{{ filteredList.length }}条</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div v-if="list.length > 0" class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索考点笔记或题目关键词..."
          class="search-input"
        >
        <span
          v-if="searchKeyword"
          class="clear-icon"
          @click="searchKeyword = ''"
        >✕</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div
      v-if="loading"
      class="loading-state"
      style="padding: 60px 16px; text-align: center"
    >
      <van-loading
        type="spinner"
        color="var(--primary)"
      >
        加载笔记数据中...
      </van-loading>
    </div>

    <!-- 笔记列表 -->
    <div
      v-else-if="filteredList.length > 0"
      class="notes-list"
    >
      <div
        v-for="note in filteredList"
        :key="note.id"
        class="note-card"
      >
        <div class="nc-head">
          <span class="nc-tag">{{ note.chapterName || note.subjectName || '考点笔记' }}</span>
          <span class="nc-time">{{ formatTime(note.updatedAt || note.createdAt) }}</span>
          <span
            class="nc-del"
            @click="onDelete(note.id)"
          >✕ 删除</span>
        </div>

        <!-- 关联试题标题 -->
        <div class="nc-title" v-html="renderWithFormula(note.title || '关联试题')" />

        <!-- 笔记正文 -->
        <div class="nc-content">
          <div class="nc-content-text">
            {{ note.content }}
          </div>
        </div>

        <!-- 底部快捷操作 -->
        <div class="nc-footer">
          <div class="nc-actions">
            <div
              class="nca primary"
              @click="goAnalysis(note.questionId)"
            >
              📖 查看解析
            </div>
            <div
              class="nca"
              @click="redoSingle(note.questionId)"
            >
              🎯 单题攻关
            </div>
          </div>
          <div
            class="nca edit-btn"
            @click="editNote(note)"
          >
            ✏️ 修改笔记
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="empty-state"
    >
      <div class="es-icon">
        📓
      </div>
      <div class="es-text">
        {{ searchKeyword ? '未找到相关笔记' : '还没有备考笔记' }}
      </div>
      <div class="es-sub">
        {{ searchKeyword ? '请尝试更换搜索关键词' : '做题或看解析时点击“📓 笔记”按钮即可随时记录备考心得' }}
      </div>
      <button
        v-if="!searchKeyword"
        class="es-btn"
        @click="$router.push('/chapter')"
      >
        去刷题记录
      </button>
      <button
        v-else
        class="es-btn"
        @click="searchKeyword = ''"
      >
        清空搜索条件
      </button>
    </div>

    <!-- 笔记编辑弹窗 -->
    <NotePopup
      v-model:show="editPopupVisible"
      :question-id="currentEditingNote?.questionId"
      :question-title="currentEditingNote?.title"
      @saved="onNoteSaved"
      @deleted="onNoteDeleted"
    />

    <div style="height: 40px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getNotes, deleteNote, type Note } from '@/api/user'
import { renderWithFormula } from '@/utils/katex'
import NotePopup from '@/components/NotePopup.vue'

const router = useRouter()
const list = ref<Note[]>([])
const loading = ref(false)
const searchKeyword = ref('')

const editPopupVisible = ref(false)
const currentEditingNote = ref<Note | null>(null)

const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter(
    (n) =>
      (n.content && n.content.toLowerCase().includes(kw)) ||
      (n.title && n.title.toLowerCase().includes(kw)) ||
      (n.chapterName && n.chapterName.toLowerCase().includes(kw))
  )
})

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/mine')
  }
}

function formatTime(t?: string) {
  if (!t) return '刚刚'
  try {
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return t
  }
}

async function fetchNotesList() {
  loading.value = true
  try {
    const res = await getNotes({ page: 1, pageSize: 100 })
    if (res?.data?.list) {
      list.value = res.data.list
    } else if (Array.isArray(res?.data)) {
      list.value = res.data
    } else {
      list.value = []
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function editNote(note: Note) {
  currentEditingNote.value = note
  editPopupVisible.value = true
}

function onNoteSaved() {
  fetchNotesList()
}

function onNoteDeleted(qId: string | number) {
  list.value = list.value.filter((n) => String(n.questionId) !== String(qId))
}

function goAnalysis(questionId: string | number) {
  router.push(`/quiz/analysis/${questionId}`)
}

function redoSingle(questionId: string | number) {
  router.push(`/quiz/practice?mode=practice&questionId=${questionId}`)
}

async function onDelete(id: string) {
  try {
    await showConfirmDialog({ title: '删除笔记', message: '确定要删除这条笔记吗？' })
    await deleteNote(id)
    list.value = list.value.filter((n) => n.id !== id)
    showToast('已删除')
  } catch {
    // cancel
  }
}

onMounted(() => {
  fetchNotesList()
})
</script>

<style scoped lang="scss">
.notes-page {
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
    font-size: 26px;
    color: var(--gray-7);
    cursor: pointer;
    line-height: 1;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .right {
    .total-badge {
      font-size: 12px;
      color: var(--primary);
      font-weight: 600;
    }
  }
}

.search-bar {
  padding: 10px 14px;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-2);

  .search-input-wrap {
    background: var(--gray-1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    padding: 6px 14px;
    gap: 8px;

    .search-icon {
      font-size: 14px;
      color: var(--gray-4);
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      color: var(--gray-8);
      outline: none;
    }

    .clear-icon {
      font-size: 12px;
      color: var(--gray-4);
      cursor: pointer;
    }
  }
}

.notes-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-2);

  .nc-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .nc-tag {
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nc-time {
      font-size: 11px;
      color: var(--gray-4);
      flex: 1;
    }

    .nc-del {
      font-size: 11px;
      color: var(--gray-4);
      cursor: pointer;

      &:hover {
        color: var(--danger);
      }
    }
  }

  .nc-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .nc-content {
    background: #f8fafc;
    padding: 10px 12px;
    border-radius: var(--radius-xs);
    border-left: 3px solid #6366f1;
    margin-bottom: 12px;

    .nc-content-text {
      font-size: 13px;
      line-height: 1.6;
      color: var(--gray-7);
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  .nc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--gray-2);
    padding-top: 10px;
    font-size: 12px;

    .nc-actions {
      display: flex;
      gap: 12px;

      .nca {
        cursor: pointer;
        font-weight: 600;
        color: var(--gray-6);

        &.primary {
          color: var(--primary);
        }
      }
    }

    .edit-btn {
      color: #4f46e5;
      font-weight: 700;
      cursor: pointer;
    }
  }
}

.empty-state {
  padding: 80px 24px;
  text-align: center;

  .es-icon {
    font-size: 56px;
    margin-bottom: 12px;
  }

  .es-text {
    font-size: 16px;
    font-weight: 700;
    color: var(--gray-8);
  }

  .es-sub {
    font-size: 13px;
    color: var(--gray-5);
    margin-top: 6px;
    line-height: 1.5;
  }

  .es-btn {
    margin-top: 24px;
    background: var(--primary);
    color: #fff;
    border: none;
    padding: 10px 28px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px var(--primary-glow);
  }
}
</style>

