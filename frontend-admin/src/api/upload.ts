import { request } from './request'

export interface UploadResult {
  url: string
  filename: string
  size: number
  mimeType: string
}

// 通用文件上传
export function uploadFile(file: File, dir = 'common') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('dir', dir)
  return request<UploadResult>({
    url: '/admin/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 图片上传
export function uploadImage(file: File) {
  return uploadFile(file, 'images')
}

// 富文本编辑器图片上传回调
export function tinymceImageUpload(blobInfo: { blob: () => Blob; filename: () => string }) {
  const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type })
  return uploadImage(file).then((res) => res.data.url)
}
