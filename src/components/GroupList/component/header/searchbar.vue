<template>
  <div class="searchbar">
    <el-input
      placeholder="请输入要查找的工作组"
      clearable
      v-model="search"
      :change="searchTheGroup()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import groupStore from '@/store/modules/groupStore'

const { filterByName } = groupStore()
const search = ref('')
function searchTheGroup() {
  filterByName(search.value)
  console.log(search.value)
}
</script>

<style scoped>
.searchbar {
  height: 60px;
}
</style>
