<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import RichEditor from './RichEditor.vue'
import OptionEditor, { type OptionItem } from './OptionEditor.vue'
import type { QuestionType, Difficulty, QuestionStatus } from '@/api/question'

export interface QuestionFormData {
  id?: number
  subjectId: number | undefined
  chapterId: number | undefined
  knowledgePointIds?: number[]
  type: QuestionType
  difficulty: Difficulty
  title: string
  content: string
  options: OptionItem[]
  answer: string
  analysis: string
  status: QuestionStatus
}

const props = defineProps<{
  modelValue: QuestionFormData
  subjects: { label: string; value: number }[]
  chapterTree: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: QuestionFormData): void
}>()

const formRef = ref<FormInstance>()
const form = reactive<QuestionFormData>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => Object.assign(form, val),
  { deep: true },
)

watch(
  form,
  (val) => emit('update:modelValue', { ...val }),
  { deep: true },
)

const typeOptions = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judge' },
  { label: '案例分析题', value: 'case' },
  { label: '主观题', value: 'subjective' },
]

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已下架', value: 'offline' },
]

// 判断题选项
const judgeOptions: OptionItem[] = [
  { label: 'A', content: '正确', isCorrect: false },
  { label: 'B', content: '错误', isCorrect: false },
]

const rules: FormRules = {
  subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
  chapterId: [{ required: true, message: '请选择章节', trigger: 'change' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  title: [{ required: true, message: '请输入题干', trigger: 'blur' }],
}

// 是否显示选项编辑器
function showOptions() {
  return form.type === 'single' || form.type === 'multiple' || form.type === 'judge'
}

// 题型切换处理
watch(
  () => form.type,
  (val) => {
    if (val === 'judge') {
      form.options = [...judgeOptions]
    } else if (val === 'single' || val === 'multiple') {
      if (!form.options?.length) {
        form.options = [
          { label: 'A', content: '', isCorrect: false },
          { label: 'B', content: '', isCorrect: false },
          { label: 'C', content: '', isCorrect: false },
          { label: 'D', content: '', isCorrect: false },
        ]
      }
    } else {
      form.options = []
    }
  },
)

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  await formRef.value.validate()
  // 校验选项正确答案
  if (showOptions() && form.options?.length) {
    const hasCorrect = form.options.some((o) => o.isCorrect)
    if (!hasCorrect) {
      return false
    }
  }
  return true
}

defineExpose({ validate })
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="科目" prop="subjectId">
          <el-select v-model="form.subjectId" placeholder="请选择科目" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="章节" prop="chapterId">
          <el-cascader
            v-model="form.chapterId"
            :options="chapterTree"
            :props="{ checkStrictly: true, emitPath: false, label: 'name', value: 'id' }"
            placeholder="请选择章节"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="题型" prop="type">
          <el-select v-model="form.type" placeholder="请选择题型" style="width: 100%">
            <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option v-for="o in difficultyOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="题干" prop="title">
      <el-input
        v-model="form.title"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
        placeholder="请输入题干简述（用于列表展示）"
      />
    </el-form-item>

    <el-form-item label="题目内容">
      <RichEditor v-model="form.content" :height="250" placeholder="请输入完整题目内容" />
    </el-form-item>

    <el-form-item v-if="showOptions()" label="选项">
      <OptionEditor
        v-model="form.options"
        :multiple="form.type === 'multiple'"
      />
    </el-form-item>

    <el-form-item v-if="form.type === 'judge' || form.type === 'subjective'" label="参考答案">
      <el-input
        v-model="form.answer"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 5 }"
        placeholder="请输入参考答案"
      />
    </el-form-item>

    <el-form-item label="答案解析">
      <RichEditor v-model="form.analysis" :height="200" placeholder="请输入答案解析" />
    </el-form-item>
  </el-form>
</template>
