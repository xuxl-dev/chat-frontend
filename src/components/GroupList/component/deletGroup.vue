<template>
  <div>
    <el-button type="danger" :icon="Delete" circle @click="delet()" />
  </div>
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'

function delet() {}
</script>

<style scoped></style>
