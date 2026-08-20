<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Editor from '@tinymce/tinymce-vue'
import tinymce from 'tinymce'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/models/dom'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/table'
import 'tinymce/plugins/wordcount'
import 'tinymce/skins/ui/oxide/content.min.css'
import { tinymceImageUpload } from '@/api/upload'

const props = withDefaults(
  defineProps<{
    modelValue: string
    height?: number
    placeholder?: string
  }>(),
  {
    height: 300,
    placeholder: '请输入内容...',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const content = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== content.value) {
      content.value = val
    }
  },
)

function handleInput(val: string) {
  content.value = val
  emit('update:modelValue', val)
}

const init = {
  language: 'zh_CN',
  height: props.height,
  menubar: 'file edit view insert format tools table',
  plugins:
    'advlist autolink lists link image charmap preview searchreplace visualblocks code fullscreen insertdatetime table wordcount',
  toolbar:
    'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | removeformat fullscreen',
  branding: false,
  promotion: false,
  placeholder: props.placeholder,
  images_upload_handler: (blobInfo: any) => tinymceImageUpload(blobInfo),
}

onMounted(() => {
  // tinymce 初始化占位
  void tinymce
})
</script>

<template>
  <div class="rich-editor">
    <Editor v-model="content" :init="init" @input="handleInput" />
  </div>
</template>

<style scoped lang="scss">
.rich-editor {
  :deep(.tox-tinymce) {
    border-radius: 4px;
  }
}
</style>
