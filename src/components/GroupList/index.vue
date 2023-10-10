<template class="grouplist">
  <!-- <el-tabs type="border-card" class="demo-tabs" tab-position="left">
    <el-tab-pane
      v-for="item in groupsList"
      :key="index"
      :label="item.name"
      :name="item.id"
    >
      <div v-for="user in item.username">{{ user }}</div>
    </el-tab-pane>
  </el-tabs> -->
  <div>
    <Group :group="group" v-for="(group, i) in groupsList" :key="i"></Group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatList from '@/components/ChatList/index.vue'
import { Calendar } from '@element-plus/icons-vue'
import Group from './component/group.vue'
import groupStore from '@/store/modules/groupStore'

const { groupsList } = groupStore()

// interface group {
//   id: string
//   name: string
//   username: string[]
//   unReadNumber: number
// }

// interface group {
//   id: string
//   picture: string
//   name: string
//   number: number
// }
// let groupsList: group[] = [
//   {
//     id: '1',
//     name: '1号群',
//     username: ['zhangsan', 'lisi'],
//     unReadNumber: 1
//   },
//   {
//     id: '2',
//     name: '2号群',
//     username: ['lisi', 'wangwu'],
//     unReadNumber: 0
//   },
//   {
//     id: '3',
//     name: '3号群',
//     username: ['zhangsan', 'wangwu'],
//     unReadNumber: 0
//   }
// ]
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
