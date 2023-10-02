<template>
  <MsgList class="scroller m-4"
           ref="msglistRef" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { randChat } from './randChatG';
import MsgList from './MsgList.vue';
import useChatStore from '@/store/modules/chatStore';
const msglistRef = ref<any | null>(null)
const { initMessages, appendMessage } = useChatStore()
const genChatCount = 100
onMounted(() => {
  // let msgs = randChat(genChatCount)
  // msgs.forEach((m) => {
  //   Object.freeze(m)
  // })
  // initMessages(msgs)

  const timer = setInterval(() => {
    appendMessage(Object.freeze(randChat(1)[0]))
    msglistRef.value?.scrollToBottom()
  }, 20)

  setTimeout(() => {
    clearInterval(timer)
    // msglistRef.value?.scrollToBottom()
  }, 400)

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
  max-height: 250px;
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