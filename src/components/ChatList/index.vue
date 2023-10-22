<template>
  Channel::{{ channel }}, isGroup::{{ isGroup }}
  <MsgList class="scroller" ref="msglistRef" :channel="channel" />
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, defineProps } from 'vue';
import MsgList from './MsgList.vue';
import useChatStore from '@/store/modules/chatStore';

const props = defineProps({
  channel: {
    type: Number,
    required: true
  },
  isGroup: {
    type: Boolean,
    required: true
  }
})

const msglistRef = ref<any | null>(null)

// const curChannel = computed(() => {
//   return store.me?.id === 1 ? 2 : 1
// })

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

<style scoped lang="scss">
.scroller {
  max-height: 40vh;
}
</style>