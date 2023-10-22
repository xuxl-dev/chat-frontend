<template class="grouplist">
  <div class="header">
    <div class="searchbar">
      <searchbar />
    </div>
    <div class="addGroup">
      <el-button type="primary" :icon="Plus" circle @click="showAddGroup()" />
    </div>
  </div>
  <div class="grpTable">
    <Group :group="group" v-for="(group, i) in store.groups" :key="i"></Group>
  </div>
  <addGroup v-model:dialogVisible="dialogVisible" dialogTitle="添加群" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Group from './component/group.vue'
import groupStore from '@/store/modules/groupStore'
import searchbar from './component/header/searchbar.vue'
import { Plus } from '@element-plus/icons-vue'
import addGroup from './component/header/addGroup.vue'

const dialogVisible = ref(false)
function showAddGroup() {
  dialogVisible.value = true
  console.log(dialogVisible.value)
}

const store = groupStore()
</script>

<style lang="scss">
.grouplist {
  width: 100%;
  height: 100%;
}
.demo-tabs > .el-tabs__content {
  padding-left: 5px;
  color: #6b778c;
  font-size: 25px;
  font-weight: 600;
}
.el-tabs {
  height: 100%;
}

.header {
  height: 60px;
  width: 100%;
}

.searchbar {
  width: 90%;
  height: 60px;
  display: inline-block;
}

.addGroup {
  width: 10%;
  height: 60px;
  display: inline-block;
}

.grpTable {
  max-height: 88%;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 0 !important;
  }
}
</style>
