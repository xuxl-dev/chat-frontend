<template>
  <div class="flex flex-row hover:bg-neutral-300 p-1 select-none" @click="chooseGroup">
    <div class="flex items-center m-1">
      <el-avatar> {{ avatar }} </el-avatar>
    </div>
    <div class="flex items-center m-1">
      <p class="whitespace-nowrap">{{ group.name }}</p>
    </div>
    <div class="flex items-center m-1">
      <el-badge class="mark" :value="group.unread" v-if="!!group.unread" />
    </div>
  </div>
</template>

<script setup lang="ts">
import groupStore, { ChatGroup } from '@/store/modules/groupStore'
import { computed } from 'vue';
import bus from '../../../utils/EventBus';

const props = defineProps({
  group: {
    type: Object as () => ChatGroup,
    required: true
  }
})

const emit = defineEmits(['selectGroup'])

const groupstore = groupStore()

const avatar = computed(() => {
  return !!props.group.avatar ? props.group.avatar : props.group.name[0]
})

function chooseGroup() {
  groupstore.selectedGroup = props.group.id
  emit('selectGroup', props.group.id)
  bus.emit('selectGroup', props.group.id)
}


</script>

<style scoped>
/* .oneGroup {
  width: 100%;
  height: 60px;
  padding: 10px;
}

.oneGroup:hover {
  width: 100%;
  height: 60px;
  padding: 10px;
  background-color: #e9e9eb;
}
.picture {
  display: inline-block;
  width: 20%;
}

.name {
  display: inline-block;
  width: 70%;
  padding-left: 20px;
}

.number {
  display: inline-block;
  width: 10%;
} */
</style>
