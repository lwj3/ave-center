<template>
  <router-view />
</template>

<script setup>
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* 暗色主题 */
html.dark {
  --bg-dark: #080A0E;
}
html.dark.android {
  --bg-dark: #21262F;
}
html.dark #app {
  background-color: var(--bg-dark);
  color: #fff;
}

html.dark .category-name {
  color: #fff;
}

html.dark .featured-title {
  color: #fff;
}

html.dark .featured-meta {
  color: #aaa;
}

html.dark .carousel-overlay {
  background: rgba(0, 0, 0, 0.6);
}

html.dark .play-icon {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

/* 文章列表页暗色 */
html.dark .nav {
  background: var(--bg-dark);
  border-bottom-color: #333;
}

html.dark .back-btn {
  color: #ccc;
}

html.dark .filter-title {
  color: #fff;
}

html.dark .article-list-page .featured-title {
  color: #fff;
}

/* 文章详情页暗色 */
html.dark .article-detail-page .nav {
  background: var(--bg-dark);
  border-bottom-color: #333;
}
html.dark .article-content p *, 
html.dark .article-content *  {
  color: #fff !important;
}

html.dark .article-main {
  background: var(--bg-dark);
}

html.dark .article-title {
  color: #fff;
}

html.dark .article-content {
  color: #ddd;
}

html.dark .article-content :is(h1, h2, h3) {
  color: #fff;
}

html.dark .article-content :is(blockquote) {
  background: #222;
  color: #bbb;
}

html.dark .article-content :is(code) {
  background: #222;
  color: #ddd;
}

html.dark .sidebar-card {
  background: var(--bg-dark);
}

html.dark .sidebar-title {
  color: #fff;
}

html.dark .recommend-title {
  color: #ddd;
}

html.dark .recommend-item:hover {
  background: #222;
}

html.dark .meta-category {
  background: #1a3a5c;
  color: #6ea8fe;
}

html.dark .tag-chip {
  background: var(--bg-dark);
}

/* 分页暗色 */
html.dark .el-pagination {
  --el-pagination-bg-color: var(--bg-dark);
  --el-pagination-text-color: #fff;
  --el-pagination-button-bg-color: var(--bg-dark);
  --el-pagination-button-color: #fff;
  --el-pagination-hover-color: #409EFF;
  --el-pagination-disabled-color: #666;
}

html.dark .el-pagination .el-pager li {
  background: var(--bg-dark);
  color: #fff;
}

html.dark .el-pagination .el-pager li.is-active {
  color: #409EFF;
}

html.dark .el-pagination .btn-prev,
html.dark .el-pagination .btn-next {
  background: var(--bg-dark);
  color: #fff;
}

html.dark .el-pagination .el-select .el-input__wrapper {
  background: var(--bg-dark);
}

html.dark .el-pagination .el-input__wrapper {
  background: var(--bg-dark);
}

html.dark .el-pagination .el-select-dropdown__item.selected {
  color: #409EFF;
}
</style>
