<template>
  <div class="register-page">
    <div class="bg-decor">
      <div class="circle c1" />
      <div class="circle c2" />
    </div>

    <div class="logo-area">
      <div class="logo">
        软
      </div>
      <h1 class="title">
        创建账号
      </h1>
      <p class="subtitle">
        开启你的备考之旅
      </p>
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
          <van-button
            size="small"
            type="primary"
            plain
            :disabled="counting"
            @click="sendCode"
          >
            {{ codeText }}
          </van-button>
        </template>
      </van-field>
      <van-field
        v-model="form.password"
        type="password"
        placeholder="密码（6-20位）"
        left-icon="lock"
        clearable
        class="input-field"
      />
      <div
        v-if="form.password"
        class="strength-bar"
      >
        <div class="strength-segs">
          <span
            v-for="i in 4"
            :key="i"
            :style="{ background: i <= score ? scoreColor : '' }"
          />
        </div>
        <span class="strength-text">{{ strengthTextVal }}</span>
      </div>
      <van-field
        v-model="form.confirmPassword"
        type="password"
        placeholder="确认密码"
        left-icon="lock"
        clearable
        class="input-field"
      />

      <van-button
        type="primary"
        block
        round
        :loading="loading"
        class="register-btn"
        @click="onRegister"
      >
        注册
      </van-button>

      <div class="form-actions">
        <router-link
          to="/auth/login"
          class="link"
        >
          已有账号？去登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register, sendCode as apiSendCode } from '@/api/auth'
import { isAccount, isValidPassword, passwordStrength, strengthText, strengthColor } from '@/utils/validate'

const router = useRouter()
const form = reactive({
  account: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const counting = ref(false)
let count = 60

const score = computed(() => passwordStrength(form.password))
const scoreColor = computed(() => strengthColor(score.value))
const strengthTextVal = computed(() => strengthText(score.value))

const codeText = computed(() => (counting.value ? `${count}s 后重发` : '获取验证码'))

async function sendCode() {
  if (!isAccount(form.account)) return showToast('请输入正确的手机号或邮箱')
  try {
    await apiSendCode(form.account, 'register')
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

async function onRegister() {
  if (!isAccount(form.account)) return showToast('请输入正确的手机号或邮箱')
  if (!/^\d{6}$/.test(form.code)) return showToast('请输入6位验证码')
  if (!isValidPassword(form.password)) return showToast('密码长度为6-20位')
  if (form.password !== form.confirmPassword) return showToast('两次密码不一致')

  loading.value = true
  try {
    await register({ account: form.account, code: form.code, password: form.password })
    showToast({ type: 'success', message: '注册成功' })
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

.register-page {
  position: relative;
  min-height: 100vh;
  padding: var(--space-2xl) var(--space-xl) var(--space-xl);
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
      width: 240px;
      height: 240px;
      top: -80px;
      left: -80px;
    }
    &.c2 {
      width: 180px;
      height: 180px;
      bottom: -40px;
      right: -40px;
    }
  }
}

.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: var(--space-xl);
  position: relative;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-md);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  font-size: 32px;
  font-weight: 700;
  @include flex-center;
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

.strength-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);

  .strength-segs {
    flex: 1;
    display: flex;
    gap: 4px;

    span {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--border-light);
      transition: background var(--transition-base);
    }
  }

  .strength-text {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
}

.register-btn {
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
