<template>
  <div>
    <div>{{ group.picture }}</div>
    <span>{{ group.name }}</span>
    <span>{{ group.number }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

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
</script>

<style scoped></style>
