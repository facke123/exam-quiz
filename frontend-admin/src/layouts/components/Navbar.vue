<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import Breadcrumb from './Breadcrumb.vue'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

async function handleCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning',
      })
      await userStore.logout()
      router.push('/login')
    } catch {
      // 取消
    }
  } else if (command === 'password') {
    router.push('/system/admin')
  }
}
</script>

<template>
  <div class="navbar">
    <div class="navbar__left">
      <el-icon class="navbar__collapse" size="20" @click="appStore.toggleSidebar()">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <Breadcrumb />
    </div>

    <div class="navbar__right">
      <el-tooltip content="暗色模式" placement="bottom">
        <el-icon class="navbar__icon" size="18" @click="appStore.toggleDarkMode()">
          <Moon v-if="!appStore.darkMode" />
          <Sunny v-else />
        </el-icon>
      </el-tooltip>

      <el-dropdown @command="handleCommand">
        <div class="navbar__user">
          <el-avatar :size="32" :src="userStore.adminInfo?.avatar">
            {{ userStore.adminInfo?.nickname?.[0] || 'A' }}
          </el-avatar>
          <span class="navbar__username">{{ userStore.adminInfo?.nickname || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.navbar {
  height: var(--app-navbar-height);
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__collapse {
    cursor: pointer;
    color: var(--app-text-regular);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__icon {
    cursor: pointer;
    color: var(--app-text-regular);
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  &__username {
    font-size: 14px;
    color: var(--app-text-primary);
  }
}
</style>
