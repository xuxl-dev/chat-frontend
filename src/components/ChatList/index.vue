<template>
  cur channel::{{ curChannel }}
  <MsgList class="scroller" ref="msglistRef" :channel="curChannel" />
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import MsgList from './MsgList.vue';
import useChatStore from '@/store/modules/chatStore';
const msglistRef = ref<any | null>(null)
const store = useChatStore()
const curChannel = computed(() => {
  return store.me?.id === 1 ? 2 : 1
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

const loadMore = ()=>{
  msglistRef.value.onTopHit()
}

defineExpose({
  loadMore
})

</script>

<style scoped lang="scss">
.scroller {
  max-height: 40vh;
}
</style>