<template>
  <div class="admin-categories">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon> 新建分类
      </el-button>
    </div>

    <el-table :data="categories" v-loading="loading" stripe row-key="id" :tree-props="{ children: 'children' }" default-expand-all>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="icon" label="图标" width="120">
        <template #default="{ row }">
          <span style="font-size: 24px">
            <img :src="row.icon" v-if="row.icon" style="width: 1em; height: 1em; margin-right: 8px" />
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分类编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建分类'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="上级分类">
          <el-select v-model="form.parent_id" placeholder="无（作为顶级分类）" clearable style="width: 100%">
            <el-option
              v-for="cat in categories.filter(c => !c.parent_id)"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" required>
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="输入emoji图标，如 " />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="分类描述" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api'

const categories = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editId = ref(null)

const form = ref({
  name: '',
  icon: '',
  description: '',
  sort_order: 0,
  status: 1,
  parent_id: null,
})

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await adminGetCategories()
    if (res.code === 0) categories.value = res.data
  } catch (err) {
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row) => {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.value = {
      name: row.name,
      icon: row.icon || '',
      description: row.description || '',
      sort_order: row.sort_order,
      status: row.status,
      parent_id: row.parent_id || null,
    }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = { name: '', icon: '', description: '', sort_order: 0, status: 1, parent_id: null }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  submitting.value = true
  try {
    let res
    if (isEdit.value) {
      res = await adminUpdateCategory(editId.value, form.value)
    } else {
      res = await adminCreateCategory(form.value)
    }
    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadCategories()
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '提示', { type: 'warning' })
    const res = await adminDeleteCategory(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadCategories()
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
</style>
