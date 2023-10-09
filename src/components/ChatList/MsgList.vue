<template>
  <div>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="20" class="scroll-smooth"
      ref="virtualListRef" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
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

let source = computed(() => {
  return Array.from(getChatSession(props.channel).chat.values()).map(msg => new StackedMessage([msg.value]))
})

const virtualListRef = ref<any | null>(null)

watch(() => getChatSession(props.channel).chat, (newVal, oldVal) => {
  console.log('@@newVal', newVal)
  // source.value = newVal.value.map(msg=>new StackedMessage([msg]))
  //TODO: use a better way to update the source
}, { immediate: true, deep: true })

// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {

})

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