<template>
  <div>
    <DynamicScroller :items="items" :min-item-size="54" class="scroller">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.message,
        ]" :data-index="index" :key="index">
          <ChatMessageDisplay :message="item" :reversed="item.read"/>
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
  const msgs = []
  for (let id = 0; id < genChatCount; id++) {
    msgs.push(new Message(id, `sender ${id % 10}`, `avatar ${id % 10}`, `message ${id}`, id % 2 === 0, id % 3 === 0, id % 7))
  }
  runChunked((chunk: Message[]) => {
    items.value.push(...chunk)
  }, msgs, 10)
})

// idlecallback
const idleCallback = globalThis.requestIdleCallback

//TODO: load chats in chunks, and only when idle

function runChunked(task: Function, data: any[], chunkSize: number) {
  function _run() {
    idleCallback(idle => {
      if (idle.timeRemaining() > 0) {
        const chunk = data.splice(0, chunkSize)
        task(chunk)
        if (data.length > 0) {
          _run()
        }
      }
    })
  }
  _run()
}

</script>

<style scoped>
.scroller {
  height: 100%;
}

/* width */
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
 
/* Handle */
::-webkit-scrollbar-thumb {
  background: #888; 
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
</style>