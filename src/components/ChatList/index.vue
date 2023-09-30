<template>
  <div style="height: 40vh;" class="relative m-4" sticky-container>
    <VirtualList v-if="items?.length" dataPropName="message" :data="items" :data-key="getKey" :item="ChatMessageDisplay"
      :size="20" :class="'scroller'" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Message, mergeAdjacentMessages } from './ChatMessage';
import ChatMessageDisplay from './ChatMessageDisplay.vue';
import { randChat } from './randChatG';
import VirtualList from './VirtualList/index.tsx';
const items = ref<Message[]>([] as any)
const genChatCount = 100
const me = 'SenderA'
const getKey = (item: Message) => item.id

onMounted(() => {
  let msgs = randChat(genChatCount).map((m) => {
    m['isSelfMessage'] = m.senderName === me
    return m
  })


  msgs.forEach((message, index) => {
    message.showAvatar = true; // always show avatar
  });
  // is self message, senderName === me
  msgs.forEach((message, index) => {
    if (message.senderName === me) {
      message.isSelfMessage = true;
    } else {
      message.isSelfMessage = false;
    }
  });

  msgs = mergeAdjacentMessages(msgs)

  runChunked((chunk: Message[]) => {
    items.value = items.value.concat(chunk)
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
        } else {
          console.log(items.value);
          console.log('done')
        }
      }
    })
  }
  _run()
}

</script>

<style scoped>
.scroller {
  max-height: 80vh;
  padding-right: 2px;
  overflow: auto;
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