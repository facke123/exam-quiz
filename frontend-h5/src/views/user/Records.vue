<template>
  <div class="records-page">
    <div class="nav-bar">
      <div
        class="back"
        @click="onBack"
      >
        ‹
      </div>
      <div class="title">
        做题记录
      </div>
      <div class="right" />
    </div>

    <!-- 答卷列表 -->
    <div
      v-if="loading"
      class="loading-box"
      style="padding: 40px; text-align: center;"
    >
      <van-loading type="spinner" color="var(--primary)">
        加载做题记录中...
      </van-loading>
    </div>
    <div
      v-else-if="list.length"
      class="records-list"
    >
      <div
        v-for="r in list"
        :key="r.id"
        class="record-card"
        @click="$router.push(`/quiz/report/${r.id}`)"
      >
        <div class="rc-header">
          <span class="rc-title">{{ getModeTitle(r) }}</span>
          <span class="rc-time">{{ formatTime(r.createdAt) }}</span>
        </div>
        <div class="rc-meta">
          <span>{{ r.total || 0 }}题</span>
          <span class="rc-rate">正确率 {{ r.correctRate || 0 }}%</span>
          <span>用时 {{ formatDuration(r.duration) }}</span>
        </div>
      </div>
    </div>
    <div
      v-else
      class="empty-state"
      style="padding: 60px 20px; text-align: center;"
    >
      <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
      <div style="font-size: 15px; font-weight: 600; color: var(--gray-7);">暂无做题记录</div>
      <div style="font-size: 13px; color: var(--gray-5); margin-top: 6px;">快去刷套真题检验下实力吧～</div>
      <van-button
        type="primary"
        round
        size="small"
        style="margin-top: 20px; padding: 0 24px;"
        @click="$router.push('/chapter')"
      >
        去刷题
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecords, type RecordItem } from '@/api/user'

const router = useRouter()
const list = ref<RecordItem[]>([])
const loading = ref(false)

function onBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function getModeTitle(r: RecordItem) {
  const modeMap: Record<string, string> = {
    daily: '每日一练',
    chapter: '章节练习',
    mock: '全真模考',
    real: '历年真题',
    review: '艾宾浩斯复习',
    wrong: '错题重练',
  }
  const modeName = modeMap[r.mode] || '专项训练'
  return `${modeName} · ${r.subjectName || '软考通关'}`
}

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return '< 1分钟'
  if (sec < 60) return `${sec}秒`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
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

async function fetchRecordsList() {
  loading.value = true
  try {
    const res = await getRecords({ page: 1, pageSize: 50 })
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

onMounted(() => {
  fetchRecordsList()
})
</script>

<style scoped lang="scss">
.records-page {
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

.records-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
  background: var(--gray-0);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:active {
    box-shadow: var(--shadow-md);
  }

  .rc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .rc-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-8);
    }

    .rc-time {
      font-size: 12px;
      color: var(--gray-5);
    }
  }

  .rc-meta {
    display: flex;
    gap: 14px;
    font-size: 13px;
    color: var(--gray-6);

    .rc-rate {
      color: var(--success);
      font-weight: 600;
    }
  }
}
</style>
