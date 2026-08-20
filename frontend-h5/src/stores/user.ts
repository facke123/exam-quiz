import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import * as authApi from '@/api/auth'
import type { UserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isVip = computed(() => userInfo.value?.isVip ?? false)
  const isLoggedIn = computed(() => !!token.value)

  // 从 localStorage 恢复 token
  function initFromStorage() {
    const savedToken = storage.get<string>('token')
    if (savedToken) {
      token.value = savedToken
    }
    const savedUser = storage.get<UserInfo>('userInfo')
    if (savedUser) {
      userInfo.value = savedUser
    }
  }

  async function login(account: string, password: string) {
    const res = await authApi.login({ account, password })
    token.value = res.data.token
    userInfo.value = {
      id: res.data.id,
      username: res.data.username,
      avatar: res.data.avatar,
      phone: res.data.phone,
      email: res.data.email,
      isVip: res.data.isVip
    }
    storage.set('token', token.value)
    storage.set('userInfo', userInfo.value)
    return res.data
  }

  async function fetchProfile() {
    const res = await authApi.getProfile()
    userInfo.value = res.data
    storage.set('userInfo', res.data)
    return res.data
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    storage.remove('token')
    storage.remove('userInfo')
  }

  return {
    token,
    userInfo,
    isVip,
    isLoggedIn,
    initFromStorage,
    login,
    fetchProfile,
    logout
  }
})
