<template>
  <div>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="20" class="scroll-smooth"
      ref="virtualListRef" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed, type Ref, shallowRef, reactive } from 'vue';
import { MessageWarp, StackedMessage, User } from './ChatMessage';
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

// let source = computed(() => {
//   return Array.from(getChatSession(props.channel).chat.values()).map(msg => new StackedMessage([msg.value]))
// })
const source = ref<Ref<StackedMessage[]>>(ref([]))

const virtualListRef = ref<any | null>(null)
onMounted(() => {

})
// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {
  getChatSession(newVal).on('new-or-update-message', (warp: Ref<MessageWarp>) => {
    const lst = lastStack()
    if (lst && lst.sender.id === warp.value.sender.id) {
      lst.append(warp)
      return
    }
    source.value.push(new StackedMessage([warp]))
  })
}, { immediate: true })

const lastStack = () => {
  return source.value.at(-1)
}

const scrollToBottom = () => {
  virtualListRef.value?.scrollToBottom()
}

defineExpose({
  lastStack,
  getKey,
  virtualListRef,
  scrollToBottom
})

</script>
<style lang="scss"></style>