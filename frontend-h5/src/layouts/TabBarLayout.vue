<template>
  <div class="tabbar-layout">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>

    <van-tabbar route :border="false" class="app-tabbar">
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/chapter" icon="bookmark-o">题库</van-tabbar-item>
      <van-tabbar-item to="/wrong" icon="warning-o" :badge="wrongBadge">错题</van-tabbar-item>
      <van-tabbar-item to="/stats" icon="bar-chart-o">统计</van-tabbar-item>
      <van-tabbar-item to="/mine" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const wrongBadge = ref<string>('')
</script>

<style scoped lang="scss">
.tabbar-layout {
  min-height: 100vh;
}

.app-tabbar {
  height: var(--tabbar-height);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  background: rgba(255, 255, 255, 0.88);
  padding-bottom: var(--safe-bottom);

  :deep(.van-tabbar-item__icon) {
    margin-bottom: 2px;
    font-size: 22px;
  }

  :deep(.van-tabbar-item__text) {
    font-size: 11px;
  }

  :deep(.van-tabbar-item--active) {
    .van-tabbar-item__icon,
    .van-tabbar-item__text {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}
</style>
