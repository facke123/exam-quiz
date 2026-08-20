<template>
  <div class="notes-page">
    <van-nav-bar title="我的笔记" left-arrow @click-left="$router.back()" />

    <van-search v-model="keyword" placeholder="搜索笔记" shape="round" />

    <div class="notes-list">
      <div
        v-for="note in list"
        :key="note.id"
        class="note-card"
      >
        <div class="note-head">
          <van-icon name="edit-line" class="note-icon" />
          <span class="note-time">{{ relativeTime(note.updatedAt) }}</span>
          <van-icon name="cross" class="del-icon" @click="onDelete(note.id)" />
        </div>
        <p class="note-title text-ellipsis">{{ note.title }}</p>
        <p class="note-content text-ellipsis-2">{{ note.content }}</p>
      </div>
    </div>

    <EmptyState v-if="!list.length" text="暂无笔记" icon="edit-line" action-text="去刷题" @action="$router.push('/quiz/chapter')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { getNotes, deleteNote, type Note } from '@/api/user'
import { relativeTime } from '@/utils/format'
import EmptyState from '@/components/EmptyState.vue'

const keyword = ref('')
const list = ref<Note[]>([])

async function loadList() {
  try {
    const res = await getNotes({ page: 1, pageSize: 50 })
    list.value = res.data.list
  } catch {
    list.value = [
      { id: '1', questionId: 'q1', title: '瀑布模型笔记', content: '瀑布模型适用于需求明确的项目，强调阶段顺序，文档完善...', createdAt: '2026-08-19', updatedAt: '2026-08-19' },
      { id: '2', questionId: 'q2', title: 'TCP三次握手', content: 'SYN -> SYN+ACK -> ACK，建立可靠连接', createdAt: '2026-08-18', updatedAt: '2026-08-18' }
    ]
  }
}

async function onDelete(id: string) {
  try {
    await showConfirmDialog({ title: '删除', message: '确定删除该笔记吗？' })
    await deleteNote(id)
    list.value = list.value.filter((n) => n.id !== id)
    showToast({ type: 'success', message: '已删除' })
  } catch {
    // 取消
  }
}

onMounted(loadList)
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.notes-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: var(--space-2xl);
}

.notes-list {
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.note-card {
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.note-head {
  @include flex-between;
  margin-bottom: var(--space-sm);

  .note-icon {
    font-size: 16px;
    color: var(--color-primary);
  }
  .note-time {
    flex: 1;
    font-size: 11px;
    color: var(--text-secondary);
    margin-left: var(--space-sm);
  }
  .del-icon {
    font-size: 16px;
    color: var(--text-placeholder);
  }
}

.note-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.note-content {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
