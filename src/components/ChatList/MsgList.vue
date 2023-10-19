<template>
  <div class="chat-msg-list" @contextmenu.prevent>
    <el-icon v-if="isLoading" :size="14" class="loading">
      消息加载中
    </el-icon>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="8" class="virtual-list container"
      ref="virtualListRef" @totop="onTopHit()" @tobottom="onBottomHit()" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, type Ref, reactive, onMounted } from 'vue';
import { MessageWarp, StackedMessage } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack from './MessageStack.vue';
import { getChatSession, ChatSession } from '../../store/modules/chatStore';

const props = defineProps({
  channel: {
    type: Number,
    required: true
  }
})

const getKey = (item: StackedMessage) => item.stack_id
const source = ref<StackedMessage[]>([])

const virtualListRef = ref<any | null>(null)
let isLoading = ref(false)
let currentSession: ChatSession | null = null
onMounted(() => {

})

const getChatRange = () => {
  const lst = lastStack()
  const fst = firstStack()
  if (!lst || !fst) {
    return null
  }
  const [beg, _] = fst.range
  const [__, end] = lst.range
  return {
    start: beg,
    end: end
  }
}

const insertNewStackAt = (msg: MessageWarp, idx: number) => {
  source.value.splice(idx, 0, reactive(new StackedMessage([ref(msg)])))
}

//TODO: this is buggy
const insertMessage = (msg: MessageWarp) => {
  // determine the location to insert the message by sentAt
  // since messages are ordered by time and seperated by stacks (sender)
  // we can use binary search to find the stack to insert (if there is one)
  // or the position to create (if there is none)
  const { senderId, sentAt } = msg
  if (source.value.length === 0) {
    // empty
    insertNewStackAt(msg, 0)
    console.log('empty, insert to the front')
    return
  }
  const { start, end } = getChatRange()!
  // console.log(`start: ${start}, ${typeof start}, end: ${end}, new msg: ${sentAt}`, start)
  // console.log(`first: ${firstStack().sender.id}, last: ${lastStack().sender.id}, new msg: ${senderId}`)
  // insert to the front of the first stack, only if the sender is the same as the first stack
  if (sentAt < start && senderId === firstStack().sender.id) {
    console.warn('insert to the front of the first stack')
    firstStack().insertAt(ref(msg), 0)
    return
  }
  // append to the last stack, only if the sender is the same as the last stack
  if (sentAt > end && senderId === lastStack().sender.id) {
    console.warn('append to the last stack')
    lastStack().append(ref(msg))
    return
  }
  // insert to the front, only if the sender is not the same as the first stack
  if (sentAt < start && senderId !== firstStack().sender.id) {
    console.warn('insert to the front')
    insertNewStackAt(msg, 0)
    return
  }
  // insert to the back, only if the sender is not the same as the last stack
  if (sentAt > end && senderId !== lastStack().sender.id) {
    console.warn('insert to the back')
    insertNewStackAt(msg, source.value.length)
    return
  }


  // search
  // the target may be:
  //  1. the stack that has same sender as the message
  //  2. the space between stacks
  //    2.1. the previous stack or the next stack belongs to the same sender: 
  //      *insert into that stack:
  //    2.2. the previous stack and the next stack belongs to another sender:
  //      *create a new stack and insert to that position
  //  3. the stack that belongs to another sender:
  //    * split the stack into two stacks according to the sentAt of the message, and insert a new stack between them
  // binary search
  let l = 0, r = source.value.length - 1
  while (l <= r) {
    const mid = Math.floor((l + r) / 2)
    const stack = source.value[mid]
    if (stack.sender.id === senderId) {
      // found case 1
      // find the position to insert
      const position = stack.messages.findIndex(msg => msg.value._msg.sentAt < sentAt) //TODO: optimize by binary search
      stack.insertAt(ref(msg), position)
      console.warn('case 1, insert to the stack')
      return
    }
    if (stack.sender.id < senderId) {
      l = mid + 1
    } else {
      r = mid - 1
    }
  }
  // not found case 1
  // case 2: check if the previous stack or the next stack belongs to the same sender
  const prev = source.value[l - 1]
  const next = source.value[l]
  // case 2.1
  if (prev && prev.sender.id === senderId) {
    console.warn('case 2.1 insert to the back')
    prev.append(ref(msg)) // insert to the back
    return
  }
  // case 2.2
  if (next && next.sender.id === senderId) {
    console.warn('case 2.2 insert to the front')
    next.insertAt(ref(msg), 0) // insert to the front
    return
  }
  // case 3
  // split the stack into two stacks according to the sentAt of the message, and insert a new stack between them
  // [oooooooo] -> [ooooo] [ooooo] -> [ooooo] [new msg] [ooooo]
  const newStack = reactive(new StackedMessage([ref(msg)]))
  const oldStack = source.value[l]
  const beforeSentMsgs = oldStack.messages.filter(msg => msg.value._msg.sentAt < sentAt)
  const afterSentMsgs = oldStack.messages.filter(msg => msg.value._msg.sentAt >= sentAt)
  console.warn(`before: ${beforeSentMsgs.length}, after: ${afterSentMsgs.length}`)
  const stackLeft = reactive(new StackedMessage(beforeSentMsgs))
  const stackRight = reactive(new StackedMessage(afterSentMsgs))
  source.value.splice(l, 1, stackLeft, newStack, stackRight)
  console.warn('case 3, split the stack and insert')
}

// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {
  currentSession = getChatSession(newVal)
  isLoading = currentSession.isLoading
  currentSession.on('new-message', (warp: Ref<MessageWarp>) => {
    // if (warp.value._msg.sentAt < source.value[0].messages[0].value._msg.sentAt) {
    //   source.value.unshift(reactive(new StackedMessage([warp])))
    //   return
    // }

    // const lst = lastStack()
    // if (lst && lst.sender.id === warp.value.sender.id) {
    //   lst.append(warp)
    //   return
    // }
    // source.value.push(reactive(new StackedMessage([warp])))
    insertMessage(warp.value)
    currentSession.mostEarlyMsgId.value = firstStack()?.messages.at(0)?.value?.id ?? null
    currentSession.mostLateMsgId.value = lastStack()?.messages.at(-1)?.value?.id ?? null
  })

  oldVal && getChatSession(oldVal).off('new-message')
}, { immediate: true })

const lastStack = () => {
  return source.value.at(-1)
}

const firstStack = () => {
  return source.value.at(0)
}

const scrollToBottom = () => {
  virtualListRef.value?.scrollToBottom()
}

const onTopHit = async () => {
  // load more history messages
  // fix the scroll position
  // get the pos
  const scr = virtualListRef.value
  const szPre = scr.getScrollSize()
  const offset = scr.getOffset()
  const res = await currentSession?.loadMore()
  const szPost = scr.getScrollSize()
  const newOffset = offset + (szPost - szPre)
  console.log(`offset: ${offset}, szPre: ${szPre}, szPost: ${szPost}, newOffset: ${newOffset}`)
  virtualListRef.value?.scrollToOffset(newOffset)
}

const onBottomHit = () => {
  console.log('bottom hit')
}

defineExpose({
  scrollToBottom,
  onTopHit
})

</script>
<style lang="scss" scoped>
.chat-msg-list {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  overflow-y: auto;

  // 取消滚动链接
  overscroll-behavior-y: contain;

  // 强制硬件加速
  transform: translate3d(0, 0, 0);
  perspective: 1000;
  transition: all 1s;
  -webkit-transition: all 1s;

  .loading {
    position: absolute;
    z-index: 20;
    gap: 4px;
    width: 100%;
    padding: 16px 0;
    font-size: 14px;
    color: var(--font-light-1);
    background: linear-gradient(180deg, rgb(50, 54, 68) 0%, transparent 85%);

    svg {
      @keyframes rotate {
        from {
          transform: rotate(0);
        }

        to {
          transform: rotate(360deg);
        }
      }

      animation: rotate 2s linear infinite;
    }
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 14px;
    color: var(--font-light);
  }
}

.virtual-list {
  position: relative;
  width: 100%;
  height: 99%; // 100%时谷歌浏览器会出现无法滚动问题
  padding-right: 20px;
  padding-left: 20px;
  overflow-y: auto;
  transition: all 200ms;
}

.container {
  overflow-x: hidden;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0);
  background-clip: text;
  -webkit-background-clip: text;

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: inherit;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: inherit;

    &:hover {
      background-color: rgba(31, 31, 31, 0.455);
    }
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.18);

    &::-webkit-scrollbar {
      width: 10px;
    }
  }
}
</style>