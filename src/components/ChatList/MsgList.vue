<template>
  <div>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="20" class="scroll-smooth"
      ref="virtualListRef" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, type Ref, reactive } from 'vue';
import { MessageWarp, StackedMessage } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack from './MessageStack.vue';
import { getChatSession } from '../../store/modules/chatStore';


const props = defineProps({
  channel: {
    type: Number,
    required: true
  }
})

const getKey = (item: StackedMessage) => item.stack_id
const source = ref<StackedMessage[]>([])

const virtualListRef = ref<any | null>(null)

// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {
  getChatSession(newVal).on('new-message', (warp: Ref<MessageWarp>) => {
    const lst = lastStack()
    if (lst && lst.sender.id === warp.value.sender.id) {
      lst.append(warp)
      return
    }
    source.value.push(reactive(new StackedMessage([warp])))
  })

  oldVal && getChatSession(oldVal).off('new-message')
}, { immediate: true })

const lastStack = () => {
  // return source.value.at(-1)
  return source.value.at(-1)
}

const scrollToBottom = () => {
  virtualListRef.value?.scrollToBottom()
}

defineExpose({
  scrollToBottom
})

</script>
<style lang="scss" scoped></style>