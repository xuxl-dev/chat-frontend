<template>
  <el-breadcrumb separator="/">
    <!-- 循环操作v-for -->
    <el-breadcrumb-item>
      <span class="no-redirect">工作组: </span>
      <span class="redirect">{{ gName }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
//获取当前路由的完整路由表
import { useRoute, useRouter } from 'vue-router'
//监听操作
import { watch, ref } from 'vue'
const route = useRoute()
const router = useRouter()

function getGroupName() {
  let name = '群1'
  return name
}

let gName = getGroupName()
</script>

<style lang="scss" scoped>
.redirect {
  color: #666;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    color: #304156;
  }
}
</style>
