<template>
  <MsgList class="scroller"
           ref="msglistRef"
           channel="1" />

</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { randChat } from './randChatG';
import MsgList from './MsgList.vue';
import useChatStore from '@/store/modules/chatStore';
const msglistRef = ref<any | null>(null)
const { getConversation } = useChatStore()

onMounted(() => {
  const conv = getConversation(1)
  const timer = setInterval(() => {
    conv.notify(Object.freeze(randChat(1)[0]))
    msglistRef.value?.scrollToBottom()
  }, 1000)

  setTimeout(() => {
    clearInterval(timer)
    // msglistRef.value?.scrollToBottom()
  }, 10000)

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
  max-height: 75vh;
  padding-right: 2px;
  overflow: auto;
  position: relative;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: rgba(215, 215, 215, 0);
  background-clip: text;
  transition: all .3s ease-in-out;
}

.scroller:hover {
  background-color: rgba(147, 147, 147, 1);
}

.scroller::-webkit-scrollbar-thumb {
  background-color: inherit;
}

.scroller::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.scroller::-webkit-scrollbar-thumb {
  border-radius: 5px;
}

.scroller:hover::-webkit-scrollbar {
  opacity: 0.1;
}
</style>

<style>

</style>