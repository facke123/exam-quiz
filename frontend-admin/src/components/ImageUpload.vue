<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { uploadImage } from '@/api/upload'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** 上传数量限制（单张图片时为1） */
    limit?: number
    maxSize?: number // MB
  }>(),
  {
    limit: 1,
    maxSize: 2,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const fileList = ref<UploadUserFile[]>(
  props.modelValue ? [{ name: 'image', url: props.modelValue }] : [],
)

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt = file.size / 1024 / 1024 < props.maxSize
  if (!isLt) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

const httpRequest: UploadProps['httpRequest'] = async (options) => {
  const file = options.file as File
  try {
    const res = await uploadImage(file)
    emit('update:modelValue', res.data.url)
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}

function handleRemove() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload">
    <el-upload
      v-model:file-list="fileList"
      :limit="limit"
      :before-upload="beforeUpload"
      :http-request="httpRequest"
      :on-remove="handleRemove"
      list-type="picture-card"
      accept="image/*"
    >
      <el-icon><Plus /></el-icon>
    </el-upload>
  </div>
</template>

<style scoped lang="scss">
.image-upload {
  :deep(.el-upload-list--picture-card) {
    --el-upload-list-picture-card-size: 120px;
  }
}
</style>
