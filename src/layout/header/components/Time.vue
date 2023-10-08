<template>
  <div class="time">{{ time }}</div>
</template>

<script setup lang="ts">
let today = new Date()
let time =
  today.getFullYear() +
  '-' +
  (today.getMonth() + 1) +
  '-' +
  today.getDate() +
  ' ' +
  today.getHours() +
  ':' +
  today.getMinutes() +
  ':' +
  today.getSeconds()
</script>

<style scoped>
.time {
  width: 150px;
  height: 20px;
}
</style>
