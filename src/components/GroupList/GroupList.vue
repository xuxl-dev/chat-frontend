<template class="grouplist">
  <div>
    <div>
      <button @click="createGroup">Create grp</button>
    </div>
    <div>
      <Group :group="group" v-for="(group, i) in grpStore.displayGroups" :key="i" @select-group="onGroupSelect(group)"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import Group from './component/group.vue'
import groupStore from '@/store/modules/groupStore'
import { createChatGroup } from '@/apis/modules/chatGroups'
import { lorem } from '../ChatList/randChatG';
const emit = defineEmits(['selectGroup'])
const onGroupSelect = (group: any) => {
  emit('selectGroup', group)
}
const grpStore = groupStore()

const createGroup = () => {
  createChatGroup({
    name: lorem.generateWords(1),
    desc:'abaaba'
  })
}
</script>

<style lang="scss"></style>
