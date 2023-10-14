<template class="grouplist">
  <div>
    <Group :group="group" v-for="(group, i) in groups" :key="i"></Group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatList from '@/components/ChatList/index.vue'
import { Calendar } from '@element-plus/icons-vue'
import Group from './component/group.vue'
import groupStore from '@/store/modules/groupStore'

const { groups, selectedGroup } = groupStore()
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
</style>
