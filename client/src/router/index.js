import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '../store/admin'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home/Index.vue'),
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/Article/Detail.vue'),
  },
  {
    path: '/articles',
    name: 'ArticleList',
    component: () => import('../views/Article/List.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Admin/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/articles',
      },
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('../views/Admin/Articles.vue'),
      },
      {
        path: 'article/edit/:id?',
        name: 'AdminArticleEdit',
        component: () => import('../views/Admin/ArticleEdit.vue'),
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('../views/Admin/Categories.vue'),
      },
      {
        path: 'tags',
        name: 'AdminTags',
        component: () => import('../views/Admin/Tags.vue'),
      },
      {
        path: 'carousels',
        name: 'AdminCarousels',
        component: () => import('../views/Admin/Carousels.vue'),
      },
      {
        path: 'files',
        name: 'AdminFiles',
        component: () => import('../views/Admin/Files.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 路由守卫：保护需要登录的页面
router.beforeEach((to, from, next) => {
  const adminStore = useAdminStore()

  // GitHub Pages 404.html 回跳逻辑
  const redirectPath = sessionStorage.getItem('redirect_path')
  if (redirectPath && to.path === '/') {
    sessionStorage.removeItem('redirect_path')
    return next(redirectPath)
  }

  if (to.meta.requiresAuth && !adminStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && adminStore.isLoggedIn) {
    next('/admin/articles')
  } else {
    next()
  }
})

export default router
