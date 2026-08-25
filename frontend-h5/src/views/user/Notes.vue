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
      <div class="right" />
    </div>

    <div
      v-if="list.length"
      class="notes-list"
    >
      <div
        v-for="note in list"
        :key="note.id"
        class="note-card"
      >
        <div class="nc-head">
          <span class="nc-tag">考点笔记</span>
          <span class="nc-time">{{ formatTime(note.updatedAt || note.createdAt) }}</span>
          <span
            class="nc-del"
            @click="onDelete(note.id)"
          >删除</span>
        </div>
        <div class="nc-title">
          {{ note.title }}
        </div>
        <div class="nc-content">
          {{ note.content }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="empty-state"
    >
      <div class="es-icon">
        📓
      </div>
      <div class="es-text">
        还没有笔记
      </div>
      <div class="es-sub">
        做题时点击“笔记”按钮即可随时记录备考心得
      </div>
      <button
        class="es-btn"
        @click="$router.push('/chapter')"
      >
        去刷题记录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getNotes, deleteNote, type Note } from '@/api/user'

const router = useRouter()
const list = ref<Note[]>([])
const loading = ref(false)

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
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
    const res = await getNotes({ page: 1, pageSize: 50 })
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

.notes-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);

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
    }

    .nc-time {
      font-size: 11px;
      color: var(--gray-4);
      flex: 1;
    }

    .nc-del {
      font-size: 12px;
      color: var(--gray-4);
      cursor: pointer;
    }
  }

  .nc-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 6px;
  }

  .nc-content {
    font-size: 13px;
    line-height: 1.6;
    color: var(--gray-6);
    background: var(--gray-1);
    padding: 10px 12px;
    border-radius: var(--radius-xs);
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
