<template>
  <div class="ai-config-page">
    <div class="header-card">
      <div class="hc-left">
        <div class="hc-title">🤖 AI 大模型接入与配置中心</div>
        <div class="hc-desc">
          支持接入 <strong>Google Gemini (Google AI Studio)</strong> 及任何兼容 OpenAI 标准接口协议的大语言模型（如 DeepSeek、阿里通义千问、智谱 GLM、Moonshot Kimi 等）。
          可前往 <a href="https://aistudio.google.com" target="_blank" class="doc-link">Google AI Studio (aistudio.google.com)</a> 免费获取 Gemini API 密钥。配置生效后，AI 智能出题、名师深度解析、考纲归纳等模块将自动进行模型推理。
        </div>
      </div>
      <div class="hc-status" :class="form.enabled === '1' || form.enabled === 1 ? 'on' : 'off'">
        <span class="dot">●</span>
        <span>{{ form.enabled === '1' || form.enabled === 1 ? 'AI 引擎已启用' : 'AI 引擎已关闭' }}</span>
      </div>
    </div>

    <!-- 提供商快捷预设卡片 -->
    <div class="provider-cards-title">选择主流模型服务商快捷预设：</div>
    <div class="provider-grid">
      <div
        v-for="p in providerPresets"
        :key="p.key"
        class="provider-card"
        :class="{ active: form.provider === p.key }"
        @click="applyPreset(p)"
      >
        <div class="pc-icon">{{ p.icon }}</div>
        <div class="pc-info">
          <div class="pc-name">{{ p.name }}</div>
          <div class="pc-models">{{ p.models.join(', ') }}</div>
        </div>
        <div v-if="form.provider === p.key" class="pc-check">✓</div>
      </div>
    </div>

    <!-- 详细参数配置表单 -->
    <div class="config-form-card">
      <div class="cfc-title">⚙️ 模型参数与密钥配置</div>

      <el-form :model="form" label-width="140px" class="config-form">
        <el-form-item label="启用 AI 功能">
          <el-switch
            v-model="form.enabled"
            active-value="1"
            inactive-value="0"
            active-text="开启真实大模型调用"
            inactive-text="关闭（使用内置标准题库模版）"
          />
        </el-form-item>

        <el-form-item label="服务商标识">
          <el-select v-model="form.provider" style="width: 100%" @change="onProviderChange">
            <el-option
              v-for="p in providerPresets"
              :key="p.key"
              :label="p.name"
              :value="p.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="接口 Base URL" required>
          <el-input
            v-model="form.baseUrl"
            placeholder="例如: https://api.deepseek.com/v1 或 https://dashscope.aliyuncs.com/compatible-mode/v1"
          />
          <div class="field-tip">
            兼容 OpenAI 格式的根接口地址，请求时将自动拼接 <code>/chat/completions</code>。
          </div>
        </el-form-item>

        <el-form-item label="API Key (密钥)" required>
          <el-input
            v-model="form.apiKey"
            :type="showApiKey ? 'text' : 'password'"
            placeholder="请输入您的模型 API Key（如 sk-xxxxxxxxxxxx）"
          >
            <template #suffix>
              <span class="key-toggle" @click="showApiKey = !showApiKey">
                {{ showApiKey ? '🙈 隐藏' : '👁️ 显示' }}
              </span>
            </template>
          </el-input>
          <div class="field-tip">
            <span v-if="hasSavedKey" class="has-key-tag">✅ 当前已保存有效 API Key (脱敏展示)</span>
            <span>出于安全考虑，已保存的 Key 将以星号脱敏显示；如需更换直接输入新 Key 保存即可。</span>
          </div>
        </el-form-item>

        <el-form-item label="默认模型名称" required>
          <el-select
            v-model="form.model"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或直接输入模型名称"
            style="width: 100%"
          >
            <el-option
              v-for="m in currentModelOptions"
              :key="m"
              :label="m"
              :value="m"
            />
          </el-select>
          <div class="field-tip">
            可从下拉列表快速选择，亦可直接手动输入自定义模型标识（如 <code>deepseek-chat</code>、<code>deepseek-reasoner</code>、<code>qwen-plus</code> 等）。
          </div>
        </el-form-item>

        <el-form-item label="采样温度 (Temperature)">
          <div class="slider-row">
            <el-slider
              v-model="form.temperature"
              :min="0"
              :max="1.5"
              :step="0.05"
              style="flex: 1; margin-right: 16px"
            />
            <span class="slider-val">{{ form.temperature }}</span>
          </div>
          <div class="field-tip">值越低（如 0.3）输出越严谨稳定，适合考点解析；值适中（如 0.7）适合多样化命题。</div>
        </el-form-item>

        <el-form-item label="最大生成 Token">
          <el-input-number
            v-model="form.maxTokens"
            :min="256"
            :max="8192"
            :step="256"
          />
          <div class="field-tip">单次请求生成的最大 Token 限制（默认 2048）。</div>
        </el-form-item>

        <!-- 测试连通性结果提示区 -->
        <div v-if="testResult" class="test-result-box" :class="testResult.success ? 'success' : 'error'">
          <div class="tr-header">
            <span class="tr-icon">{{ testResult.success ? '🟢' : '🔴' }}</span>
            <span class="tr-title">
              {{ testResult.success ? `连接成功！响应延迟: ${testResult.latency} ms (模型: ${testResult.model})` : '连接失败' }}
            </span>
          </div>
          <div class="tr-content">
            {{ testResult.success ? `大模型回复: 「${testResult.reply}」` : testResult.error }}
          </div>
        </div>

        <div class="form-actions">
          <el-button
            type="warning"
            :loading="testing"
            @click="handleTestConnection"
          >
            ⚡ 测试模型连通性
          </el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleSaveConfig"
          >
            💾 保存配置
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAIConfig, updateAIConfig, testAIConnection } from '@/api/ai'

const saving = ref(false)
const testing = ref(false)
const showApiKey = ref(false)
const hasSavedKey = ref(false)

const form = ref<any>({
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
  enabled: '1',
})

const testResult = ref<{
  success: boolean
  latency: number
  model: string
  reply: string
  error?: string
} | null>(null)

// 预设主流模型提供商
const providerPresets = [
  {
    key: 'gemini',
    name: 'Google Gemini (AI Studio)',
    icon: '💎',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      'gemini-3.7-flash',
      'gemini-3.1-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3-flash',
    ],
    defaultModel: 'gemini-2.5-flash',
    docsUrl: 'https://aistudio.google.com/docs',
  },
  {
    key: 'deepseek',
    name: 'DeepSeek (深度求索)',
    icon: '🐳',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  {
    key: 'aliyun_qwen',
    name: '阿里通义千问 (DashScope)',
    icon: '⚡',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen2.5-72b-instruct'],
    defaultModel: 'qwen-plus',
  },
  {
    key: 'zhipu_glm',
    name: '智谱清言 (GLM)',
    icon: '🧠',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-flash', 'glm-4', 'glm-4-plus'],
    defaultModel: 'glm-4-flash',
  },
  {
    key: 'moonshot',
    name: 'Moonshot (Kimi)',
    icon: '🌙',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k'],
    defaultModel: 'moonshot-v1-8k',
  },
  {
    key: 'openai',
    name: 'OpenAI 官方',
    icon: '🌐',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    key: 'custom',
    name: '自定义 OpenAI 兼容接口',
    icon: '⚙️',
    baseUrl: 'https://your-custom-llm-domain.com/v1',
    models: ['custom-model'],
    defaultModel: 'custom-model',
  },
]

const currentModelOptions = computed(() => {
  const current = providerPresets.find((p) => p.key === form.value.provider)
  return current ? current.models : ['deepseek-chat', 'gpt-4o-mini', 'qwen-plus']
})

function applyPreset(preset: any) {
  form.value.provider = preset.key
  form.value.baseUrl = preset.baseUrl
  form.value.model = preset.defaultModel
  ElMessage.info(`已切换至【${preset.name}】预设，请输入对应 API Key 即可使用！`)
}

function onProviderChange(key: string) {
  const p = providerPresets.find((item) => item.key === key)
  if (p) {
    form.value.baseUrl = p.baseUrl
    form.value.model = p.defaultModel
  }
}

async function loadConfig() {
  try {
    const res = await getAIConfig()
    if (res?.data) {
      form.value = {
        provider: res.data.provider || 'deepseek',
        baseUrl: res.data.baseUrl || 'https://api.deepseek.com/v1',
        apiKey: res.data.apiKey || '',
        model: res.data.model || 'deepseek-chat',
        temperature: res.data.temperature !== undefined ? res.data.temperature : 0.7,
        maxTokens: res.data.maxTokens || 2048,
        enabled: String(res.data.enabled !== undefined ? res.data.enabled : '1'),
      }
      hasSavedKey.value = Boolean(res.data.hasKey)
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取 AI 配置失败')
  }
}

async function handleTestConnection() {
  testResult.value = null
  testing.value = true
  try {
    const res = await testAIConnection({
      baseUrl: form.value.baseUrl,
      apiKey: form.value.apiKey,
      model: form.value.model,
    })
    if (res?.data) {
      testResult.value = res.data
      if (res.data.success) {
        ElMessage.success(`模型连接成功！延迟: ${res.data.latency}ms`)
      } else {
        ElMessage.error(res.data.error || '模型连接失败')
      }
    }
  } catch (err: any) {
    testResult.value = {
      success: false,
      latency: 0,
      model: form.value.model,
      reply: '',
      error: err.message || '网络请求错误',
    }
    ElMessage.error(err.message || '测试连接失败')
  } finally {
    testing.value = false
  }
}

async function handleSaveConfig() {
  saving.value = true
  try {
    const res = await updateAIConfig({
      provider: form.value.provider,
      baseUrl: form.value.baseUrl,
      apiKey: form.value.apiKey,
      model: form.value.model,
      temperature: Number(form.value.temperature),
      maxTokens: Number(form.value.maxTokens),
      enabled: form.value.enabled,
    })
    if (res?.data?.success) {
      ElMessage.success('AI 模型配置已成功保存并生效！')
      loadConfig()
    }
  } catch (err: any) {
    ElMessage.error(err.message || '保存配置失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped lang="scss">
.ai-config-page {
  padding: 24px;
}

.header-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .hc-left {
    max-width: 80%;

    .hc-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--gray-9);
      margin-bottom: 6px;
    }

    .hc-desc {
      font-size: 13px;
      color: var(--gray-6);
      line-height: 1.6;
    }
  }

  .hc-status {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;

    &.on {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }

    &.off {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
  }
}

.provider-cards-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-7);
  margin-bottom: 12px;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.provider-card {
  background: #fff;
  border: 1px solid var(--gray-2);
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
  }

  &.active {
    border-color: var(--primary);
    background: #eef2ff;

    .pc-name {
      color: var(--primary);
    }
  }

  .pc-icon {
    font-size: 26px;
  }

  .pc-info {
    flex: 1;

    .pc-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-8);
      margin-bottom: 3px;
    }

    .pc-models {
      font-size: 11px;
      color: var(--gray-5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }
  }

  .pc-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    color: #fff;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
}

.config-form-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .cfc-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--gray-8);
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--gray-2);
  }
}

.config-form {
  max-width: 800px;
}

.field-tip {
  font-size: 12px;
  color: var(--gray-5);
  margin-top: 4px;
  line-height: 1.5;

  code {
    background: var(--gray-1);
    color: var(--primary);
    padding: 1px 4px;
    border-radius: 3px;
  }

  .has-key-tag {
    color: #16a34a;
    font-weight: 600;
    margin-right: 8px;
  }
}

.key-toggle {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  user-select: none;
  padding-right: 4px;

  &:hover {
    text-decoration: underline;
  }
}

.slider-row {
  display: flex;
  align-items: center;
  width: 100%;

  .slider-val {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    min-width: 32px;
  }
}

.test-result-box {
  margin: 16px 0 24px 140px;
  padding: 14px 16px;
  border-radius: 6px;
  font-size: 13px;

  &.success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #15803d;
  }

  &.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .tr-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .tr-content {
    font-size: 12px;
    line-height: 1.5;
  }
}

.form-actions {
  margin-left: 140px;
  margin-top: 24px;
  display: flex;
  gap: 16px;
}
</style>
