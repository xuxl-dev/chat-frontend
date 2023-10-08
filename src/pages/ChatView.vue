<template>
  <div class="leftPart">
    <grouplist />
  </div>
  <div class="rightPart">
    <ChatList />
  </div>
</template>

<script setup lang="ts">
import ChatList from '@/components/ChatList/index.vue'
import grouplist from '@/components/GroupList/index.vue'
</script>

<style scoped>
.leftPart {
  width: 25%;
  height: 100%;
  display: inline-block;
}

.rightPart {
  width: 75%;
  display: inline-block;
}
</style>
