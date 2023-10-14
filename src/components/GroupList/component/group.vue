<template>
  <div class="oneGroup" @click="chooseGroup()">
    <div class="picture">
      <el-avatar> {{ group.picture }} </el-avatar>
    </div>
    <div class="name">{{ group.name }}</div>
    <div class="number"><el-badge class="mark" :value="group.number" /></div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import groupStore from '@/store/modules/groupStore'

const groupstore = groupStore()

class Group {
  id: string
  picture: string
  name: string
  number: number
}

const props = defineProps({
  group: {
    type: Object as () => Group,
    required: true
  }
})

function chooseGroup() {
  groupstore.selectedGroup = props.group.id
}
</script>

<style scoped>
.oneGroup {
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
}
</style>
