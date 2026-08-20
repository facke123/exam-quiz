<template>
  <div class="forgot-page">
    <div class="bg-decor">
      <div class="circle c1"></div>
    </div>

    <div class="logo-area">
      <van-icon name="lock" class="lock-icon" />
      <h1 class="title">找回密码</h1>
      <p class="subtitle">通过验证码重置密码</p>
    </div>

    <div class="form-card">
      <van-field
        v-model="form.account"
        placeholder="手机号 / 邮箱"
        left-icon="manager-o"
        clearable
        class="input-field"
      />
      <van-field
        v-model="form.code"
        center
        clearable
        placeholder="验证码"
        left-icon="envelop-o"
        class="input-field"
      >
        <template #button>
          <van-button size="small" type="primary" plain @click="sendCode" :disabled="counting">
            {{ codeText }}
          </van-button>
        </template>
      </van-field>
      <van-field
        v-model="form.newPassword"
        type="password"
        placeholder="新密码（6-20位）"
        left-icon="lock"
        clearable
        class="input-field"
      />

      <van-button
        type="primary"
        block
        round
        :loading="loading"
        class="reset-btn"
        @click="onReset"
      >
        重置密码
      </van-button>

      <div class="form-actions">
        <router-link to="/auth/login" class="link">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { forgotPassword, sendCode as apiSendCode } from '@/api/auth'
import { isAccount, isValidPassword } from '@/utils/validate'

const router = useRouter()
const form = reactive({ account: '', code: '', newPassword: '' })
const loading = ref(false)
const counting = ref(false)
let count = 60

const codeText = computed(() => (counting.value ? `${count}s 后重发` : '获取验证码'))

async function sendCode() {
  if (!isAccount(form.account)) return showToast('请输入正确的手机号或邮箱')
  try {
    await apiSendCode(form.account, 'reset')
    showToast({ type: 'success', message: '验证码已发送' })
    counting.value = true
    const timer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(timer)
        counting.value = false
        count = 60
      }
    }, 1000)
  } catch {
    // ...
  }
}

async function onReset() {
  if (!isAccount(form.account)) return showToast('请输入正确的手机号或邮箱')
  if (!/^\d{6}$/.test(form.code)) return showToast('请输入6位验证码')
  if (!isValidPassword(form.newPassword)) return showToast('密码长度为6-20位')

  loading.value = true
  try {
    await forgotPassword({
      account: form.account,
      code: form.code,
      newPassword: form.newPassword
    })
    showToast({ type: 'success', message: '密码已重置，请登录' })
    router.replace('/auth/login')
  } catch {
    // ...
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.forgot-page {
  position: relative;
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-xl);
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
      width: 300px;
      height: 300px;
      top: -120px;
      right: -100px;
    }
  }
}

.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: var(--space-xl);
  position: relative;
}

.lock-icon {
  font-size: 40px;
  margin-bottom: var(--space-md);
}

.title {
  font-size: var(--font-size-xl);
}

.subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  margin-top: 4px;
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

.reset-btn {
  margin-top: var(--space-lg);
  height: 48px;
  font-size: var(--font-size-md);
  font-weight: 600;
  background: var(--gradient-primary);
  border: none;
}

.form-actions {
  text-align: center;
  margin-top: var(--space-lg);

  .link {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }
}
</style>
