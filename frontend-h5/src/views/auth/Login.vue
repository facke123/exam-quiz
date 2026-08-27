<template>
  <div class="login-page">
    <!-- 渐变背景 -->
    <div class="bg-decor">
      <div class="circle c1" />
      <div class="circle c2" />
    </div>

    <div class="logo-area">
      <div class="logo">
        软
      </div>
      <h1 class="title">
        软考刷题
      </h1>
      <p class="subtitle">
        高效备考 · 一战过关
      </p>
    </div>

    <div class="form-card">
      <van-field
        v-model="form.account"
        label=""
        placeholder="手机号 / 邮箱 / 用户名"
        left-icon="manager-o"
        clearable
        autocomplete="username"
        class="input-field"
        @keyup.enter="onLogin"
      />
      <van-field
        v-model="form.password"
        type="password"
        label=""
        placeholder="密码（6-20位）"
        left-icon="lock"
        clearable
        autocomplete="current-password"
        class="input-field"
        @keyup.enter="onLogin"
      />

      <van-button
        type="primary"
        block
        round
        :loading="loading"
        class="login-btn"
        @click="onLogin"
      >
        登录
      </van-button>

      <div class="form-actions">
        <router-link
          to="/auth/register"
          class="link"
        >
          新用户注册
        </router-link>
        <router-link
          to="/auth/forgot"
          class="link"
        >
          找回密码
        </router-link>
      </div>
    </div>

    <p class="agreement">
      登录即代表您同意 <a>用户协议</a> 和 <a>隐私政策</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { isValidPassword } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({ account: '', password: '' })
const loading = ref(false)

async function onLogin() {
  const acc = form.account.trim()
  if (!acc) {
    return showToast('请输入账号、手机号或邮箱')
  }
  if (!form.password) {
    return showToast('请输入登录密码')
  }
  if (!isValidPassword(form.password)) {
    return showToast('密码长度为6-20位')
  }

  loading.value = true
  try {
    await userStore.login(acc, form.password)
    showToast({ type: 'success', message: '登录成功' })

    // 解析目标跳转路径
    let redirect = (route.query.redirect as string) || '/'
    try {
      redirect = decodeURIComponent(redirect)
    } catch {
      // ignore
    }

    // 防止重定向到认证相关页面形成死循环
    if (!redirect || redirect.startsWith('/auth/login') || redirect.startsWith('/auth/register') || redirect.startsWith('/auth/forgot')) {
      redirect = '/'
    }

    try {
      await router.replace(redirect)
    } catch {
      window.location.href = redirect
    }
  } catch (err: any) {
    showToast(err.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.login-page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--space-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--gradient-primary);
  overflow: hidden;
}

.bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);

    &.c1 {
      width: 280px;
      height: 280px;
      top: -100px;
      right: -80px;
    }
    &.c2 {
      width: 200px;
      height: 200px;
      bottom: -60px;
      left: -60px;
    }
  }
}

.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: var(--space-2xl);
  position: relative;
}

.logo {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--space-md);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  font-size: 36px;
  font-weight: 700;
  @include flex-center;
}

.title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-xs);
}

.subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.85;
}

.form-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
}

.input-field {
  margin-bottom: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--bg-page);

  :deep(.van-field__control) {
    font-size: var(--font-size-base);
    padding: 10px 0;
  }
}

.login-btn {
  margin-top: var(--space-lg);
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: 600;
  background: var(--gradient-primary);
  border: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-lg);

  .link {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }
}

.agreement {
  text-align: center;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.7);
  margin-top: var(--space-xl);
  position: relative;

  a {
    color: #fff;
    text-decoration: underline;
  }
}
</style>
