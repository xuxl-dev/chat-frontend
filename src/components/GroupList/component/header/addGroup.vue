<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="dialogTitle"
    width="40%"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="70px" :rules="rules">
      <el-form-item label="群名" prop="username">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="描述" prop="password">
        <el-input v-model="form.password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, ref, defineProps, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  dialogTitle: {
    type: String,
    default: '',
    required: true
  },
  dialogVisible: {
    type: Boolean,
    required: true
  }
})

const emits = defineEmits(['update:dialogVisible', 'initUserList'])

const handleClose = () => {
  emits('update:dialogVisible', false)
}

const handleConfirm = () => {
  // 统一效验
  formRef.value.validate(async (valid) => {
    if (valid) {
      // props.dialogTitle === '添加用户' ? await addUser(form.value) : await editUser(form.value)
    }
  })
}

const formRef = ref(null)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: 'Please input Activity name', trigger: 'blur' },
    { min: 3, max: 20, message: 'Length should be 3 to 20', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please input password', trigger: 'blur' },
    { min: 4, max: 20, message: 'Length should be 4 to 20', trigger: 'blur' }
  ]
}
</script>

<style scoped></style>
