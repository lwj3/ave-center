<template>
  <div class="article-edit">
    <el-card>
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="文章标题" required>
              <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="200" show-word-limit />
            </el-form-item>

            <el-form-item label="文章摘要">
              <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="请输入文章摘要" maxlength="500" show-word-limit />
            </el-form-item>

            <el-form-item label="文章内容" required>
              <div style="border: 1px solid #dcdfe6; border-radius: 4px">
                <Toolbar
                  style="border-bottom: 1px solid #dcdfe6"
                  :editor="editorRef"
                  :defaultConfig="toolbarConfig"
                  mode="default"
                />
                <Editor
                  style="height: 500px; overflow-y: hidden"
                  v-model="form.content"
                  :defaultConfig="editorConfig"
                  mode="default"
                  @onCreated="handleCreated"
                  @onDestroyed="handleDestroyed"
                />
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="所属分类">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="标签">
              <el-select v-model="form.tag_ids" multiple placeholder="请选择标签" style="width: 100%">
                <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="作者">
              <el-input v-model="form.author" placeholder="作者名称" />
            </el-form-item>

            <el-form-item label="封面图片">
              <el-tabs size="small" v-model="coverType" style="width: 100%">
                <el-tab-pane label="本地上传" name="local">
                  <el-upload
                    :show-file-list="false"
                    :on-success="handleCoverSuccess"
                    :before-upload="beforeImageUpload"
                    :http-request="uploadCover"
                  >
                    <img v-if="form.cover_image && !isCoverUrl" :src="resolveUploadUrl(form.cover_image)" class="cover-preview" />
                    <el-button v-else type="primary" plain>上传封面</el-button>
                  </el-upload>
                </el-tab-pane>
                <el-tab-pane label="从库中选择" name="library">
                  <div v-if="form.cover_image && !isCoverUrl" style="margin-bottom: 8px">
                    <img :src="resolveUploadUrl(form.cover_image)" class="cover-preview" />
                  </div>
                  <el-button type="primary" @click="openFileSelector('image')">从文件库选择</el-button>
                </el-tab-pane>
                <el-tab-pane label="外链" name="url">
                  <el-input 
                    v-model="form.cover_image" 
                    placeholder="请输入图片URL（https://...）" 
                    clearable
                  />
                  <img v-if="isCoverUrl" :src="form.cover_image" class="cover-preview" style="margin-top: 8px" />
                </el-tab-pane>
              </el-tabs>
            </el-form-item>
            <el-form-item label="排序权重">
              <el-input-number v-model="form.sort_order" :min="0" :max="999" />
            </el-form-item>

            <el-form-item label="发布状态">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">发布</el-radio>
                <el-radio :value="0">草稿</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-divider />

            <el-form-item label="首页轮播">
              <el-switch v-model="form.is_featured" :active-value="1" :inactive-value="0" />
            </el-form-item>

            <el-form-item label="推荐文章">
              <el-switch v-model="form.is_recommended" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存修改' : '创建文章' }}
          </el-button>
          <el-button @click="$router.push('/admin/articles')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文件选择对话框 -->
    <el-dialog v-model="fileSelectorVisible" :title="`选择${fileType === 'image' ? '图片' : '视频'}`" width="80%">
      <div class="file-selector">
        <el-table 
          :data="libraryFiles" 
          v-loading="loadingLibrary"
          @row-click="selectFile"
          highlight-current-row
          style="width: 100%"
        >
          <el-table-column label="预览" width="120">
            <template #default="{ row }">
              <img 
                v-if="row.type === 'image'" 
                :src="resolveUploadUrl(row.url)" 
                class="library-preview"
              />
              <video 
                v-else 
                :src="resolveUploadUrl(row.url)" 
                class="library-preview video"
              />
            </template>
          </el-table-column>
          <el-table-column prop="originalname" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'image' ? 'success' : 'warning'" size="small">
                {{ row.type === 'image' ? '图片' : '视频' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="120">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="libraryPage"
            v-model:page-size="libraryPageSize"
            :total="libraryTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadLibraryFiles"
            @current-change="loadLibraryFiles"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 富文本文件选择对话框 -->
    <el-dialog v-model="richTextFileSelectorVisible" :title="`从文件库选择${richTextFileType === 'image' ? '图片' : '视频'}`" width="80%">
      <div class="file-selector">
        <el-table 
          :data="libraryFiles" 
          v-loading="loadingLibrary"
          @row-click="selectRichTextFile"
          highlight-current-row
          style="width: 100%"
        >
          <el-table-column label="预览" width="120">
            <template #default="{ row }">
              <img 
                v-if="row.type === 'image'" 
                :src="resolveUploadUrl(row.url)" 
                class="library-preview"
              />
              <video 
                v-else 
                :src="resolveUploadUrl(row.url)" 
                class="library-preview video"
              />
            </template>
          </el-table-column>
          <el-table-column prop="originalname" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'image' ? 'success' : 'warning'" size="small">
                {{ row.type === 'image' ? '图片' : '视频' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="120">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="libraryPage"
            v-model:page-size="libraryPageSize"
            :total="libraryTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadRichTextLibraryFiles"
            @current-change="loadRichTextLibraryFiles"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import {
  adminGetArticle, adminCreateArticle, adminUpdateArticle,
  adminGetCategories, getTags, uploadFile, adminGetFiles,
} from '../../api'
import { resolveUploadUrl } from '../../utils/uploadUrl'

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const submitting = ref(false)
const coverType = ref('local')

// 文件选择器
const fileSelectorVisible = ref(false)
const fileType = ref('image') // 'image' or 'video'
const libraryFiles = ref([])
const loadingLibrary = ref(false)
const libraryPage = ref(1)
const libraryPageSize = ref(20)
const libraryTotal = ref(0)

// 富文本文件选择器（用于编辑器内部）
const richTextFileSelectorVisible = ref(false)
const richTextFileType = ref('image')
const richTextInsertFn = ref(null)

// 表单数据
const form = ref({
  title: '',
  summary: '',
  content: '',
  cover_image: '',
  video_url: '',
  category_id: null,
  author: 'AVE学院',
  tag_ids: [],
  sort_order: 0,
  status: 1,
  is_featured: 0,
  is_recommended: 0,
})

const categories = ref([])
const tags = ref([])

// 富文本编辑器
const editorRef = shallowRef()
const toolbarConfig = {}
const editorConfig = {
  placeholder: '请输入文章内容...',
  MENU_CONF: {
    uploadImage: {
      customUpload: async (file, insertFn) => {
        try {
          const res = await uploadFile(file)
          if (res.code === 0) {
            insertFn(res.data.url, file.name, res.data.url)
          }
        } catch (err) {
          ElMessage.error('图片上传失败')
        }
      },
      // 添加从文件库选择功能
      browseServer: () => {
        openRichTextFileSelector('image')
      },
    },
    uploadVideo: {
      customUpload: async (file, insertFn) => {
        try {
          const res = await uploadFile(file)
          if (res.code === 0) {
            insertFn(res.data.url)
          }
        } catch (err) {
          ElMessage.error('视频上传失败')
        }
      },
      // 添加从文件库选择功能
      browseServer: () => {
        openRichTextFileSelector('video')
      },
    },
  },
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

const handleDestroyed = (editor) => {
  editorRef.value = null
}

// 判断是否为外链
const isUrl = (str) => {
  return str && (str.startsWith('http://') || str.startsWith('https://'))
}

const isCoverUrl = computed(() => isUrl(form.value.cover_image))

// 上传处理
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) ElMessage.error('只能上传图片文件')
  return isImage
}

const handleCoverSuccess = (res) => {
  if (res.code === 0) {
    form.value.cover_image = res.data.url
    ElMessage.success('封面上传成功')
  }
}

// 自定义上传封面
const uploadCover = async (options) => {
  try {
    const res = await uploadFile(options.file)
    if (res.code === 0) {
      options.onSuccess(res)
    } else {
      options.onError(new Error(res.message || '上传失败'))
    }
  } catch (err) {
    ElMessage.error('图片上传失败')
    options.onError(err)
  }
}

const handleVideoSuccess = (res) => {
  if (res.code === 0) {
    form.value.video_url = res.data.url
    ElMessage.success('视频上传成功')
  }
}

// 打开文件选择器
const openFileSelector = async (type) => {
  fileType.value = type
  fileSelectorVisible.value = true
  await loadLibraryFiles()
}

// 打开富文本文件选择器（用于编辑器内部）
const openRichTextFileSelector = async (type) => {
  richTextFileType.value = type
  richTextFileSelectorVisible.value = true
  // 重新加载第一页
  libraryPage.value = 1
  await loadRichTextLibraryFiles()
}

// 加载文件库列表（通用）
const loadLibraryFiles = async () => {
  loadingLibrary.value = true
  try {
    const res = await adminGetFiles({
      type: fileType.value,
      page: libraryPage.value,
      pageSize: libraryPageSize.value,
    })
    if (res.code === 0) {
      libraryFiles.value = res.data.list
      libraryTotal.value = res.data.total
    }
  } catch (err) {
    console.error('加载文件库失败:', err)
  } finally {
    loadingLibrary.value = false
  }
}

// 加载富文本文件库列表
const loadRichTextLibraryFiles = async () => {
  loadingLibrary.value = true
  try {
    const res = await adminGetFiles({
      type: richTextFileType.value,
      page: libraryPage.value,
      pageSize: libraryPageSize.value,
    })
    if (res.code === 0) {
      libraryFiles.value = res.data.list
      libraryTotal.value = res.data.total
    }
  } catch (err) {
    console.error('加载文件库失败:', err)
  } finally {
    loadingLibrary.value = false
  }
}

// 选择文件
const selectFile = (file) => {
  if (fileType.value === 'image') {
    form.value.cover_image = file.url
    coverType.value = 'library'
  } else {
    form.value.video_url = file.url
  }
  fileSelectorVisible.value = false
  ElMessage.success('选择成功')
}

// 选择富文本文件
const selectRichTextFile = (file) => {
  if (richTextInsertFn.value) {
    if (richTextFileType.value === 'image') {
      richTextInsertFn.value(file.url, file.originalname, file.url)
    } else {
      richTextInsertFn.value(file.url)
    }
    ElMessage.success('插入成功')
  }
  richTextFileSelectorVisible.value = false
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载数据
const loadData = async () => {
  // 加载分类和标签
  const [catRes, tagRes] = await Promise.all([
    adminGetCategories(),
    getTags(),
  ])
  if (catRes.code === 0) categories.value = catRes.data
  if (tagRes.code === 0) tags.value = tagRes.data

  // 如果是编辑模式，加载文章
  if (route.params.id) {
    isEdit.value = true
    try {
      const res = await adminGetArticle(route.params.id)
      if (res.code === 0) {
        const article = res.data
        form.value = {
          title: article.title,
          summary: article.summary || '',
          content: article.content,
          cover_image: article.cover_image || '',
          video_url: article.video_url || '',
          category_id: article.category_id,
          author: article.author,
          tag_ids: article.tags ? article.tags.map(t => t.id) : [],
          sort_order: article.sort_order,
          status: article.status,
          is_featured: article.is_featured,
          is_recommended: article.is_recommended || 0,
        }
        // 设置编辑器内容
        if (editorRef.value) {
          editorRef.value.setHtml(article.content)
        }
      }
    } catch (err) {
      ElMessage.error('加载文章失败')
    }
  }
}

// 提交
const handleSubmit = async () => {
  if (!form.value.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!form.value.content || form.value.content === '<p><br></p>') {
    ElMessage.warning('请输入文章内容')
    return
  }

  submitting.value = true
  try {
    const data = { ...form.value }
    let res
    if (isEdit.value) {
      res = await adminUpdateArticle(route.params.id, data)
    } else {
      res = await adminCreateArticle(data)
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/admin/articles')
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})
</script>

<style scoped>
.article-edit {
  max-width: 1200px;
}

video{
  max-width: 100%;
}
.cover-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.video-preview {
  width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.file-selector {
  min-height: 400px;
}

.library-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.library-preview.video {
  object-fit: contain;
  background: #000;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
