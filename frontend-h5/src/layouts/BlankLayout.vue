<template>
  <div class="blank-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.blank-layout {
  min-height: 100vh;
  background: var(--bg-page);
}
</style>
