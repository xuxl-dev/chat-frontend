<template>
  <div>
    <DynamicScroller :items="items" :min-item-size="54" class="scroller">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.message,
        ]" :data-index="index">
          <ChatMessageDisplay :message="item" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Message } from './ChatMessage';
import ChatMessageDisplay from './ChatMessageDisplay.vue';
const items = ref<Message[]>([] as any)

const genChatCount = 100
onMounted(() => {
  for (let id = 0; id < genChatCount; id++) {
    items.value.push(new Message(id, `sender ${id%10}`, `avatar ${id%10}`, `message ${id}`, id%2===0, id%3===0, id%7))
  }
})

</script>

<style scoped>
.scroller {
  height: 40vh;
}
</style>