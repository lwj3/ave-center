import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 30000,
})

// 请求拦截器：自动添加 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 未授权
request.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    console.error('API Error:', err)
    return Promise.reject(err)
  }
)

// 首页数据
export const getHomeData = () => request.get('/api/articles/home')

// 文章列表
export const getArticles = (params) => request.get('/api/articles', { params })

// 文章详情
export const getArticleDetail = (id) => request.get(`/api/articles/${id}`)

// 分类列表
export const getCategories = () => request.get('/api/categories')

// 标签列表
export const getTags = () => request.get('/api/tags')

// 轮播列表
export const getCarousels = () => request.get('/api/carousels')

// ========== 后台管理接口 ==========

// 文章管理
export const adminGetArticles = (params) => request.get('/api/articles/admin/list', { params })
export const adminGetArticle = (id) => request.get(`/api/articles/admin/${id}`)
export const adminCreateArticle = (data) => request.post('/api/articles', data)
export const adminUpdateArticle = (id, data) => request.put(`/api/articles/${id}`, data)
export const adminDeleteArticle = (id) => request.delete(`/api/articles/${id}`)

// 分类管理
export const adminGetCategories = () => request.get('/api/categories/all')
export const adminCreateCategory = (data) => request.post('/api/categories', data)
export const adminUpdateCategory = (id, data) => request.put(`/api/categories/${id}`, data)
export const adminDeleteCategory = (id) => request.delete(`/api/categories/${id}`)

// 标签管理
export const adminCreateTag = (data) => request.post('/api/tags', data)
export const adminUpdateTag = (id, data) => request.put(`/api/tags/${id}`, data)
export const adminDeleteTag = (id) => request.delete(`/api/tags/${id}`)

// 轮播管理
export const adminGetCarousels = () => request.get('/api/carousels')
export const adminCreateCarousel = (data) => request.post('/api/carousels', data)
export const adminUpdateCarousel = (id, data) => request.put(`/api/carousels/${id}`, data)
export const adminDeleteCarousel = (id) => request.delete(`/api/carousels/${id}`)

// 文件上传
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 文件管理
export const adminGetFiles = (params) => request.get('/api/files', { params })
export const adminDeleteFile = (id) => request.delete(`/api/files/${id}`)
