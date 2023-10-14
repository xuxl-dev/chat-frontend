<template>
  <div>
    <el-button type="success" :icon="Check" circle @click="editGroup()" />
  </div>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'

function editGroup() {}
</script>

<style scoped></style>
