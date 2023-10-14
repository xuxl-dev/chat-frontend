<template>
  <div class="chat-msg-list " @contextmenu.prevent>
    <el-icon v-if="isLoading" :size="14" class="loading">
      消息加载中
    </el-icon>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="8" class="virtual-list container"
      ref="virtualListRef" @totop="onTopHit()" @tobottom="onBottomHit()"/>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, type Ref, reactive, onMounted } from 'vue';
import { MessageWarp, StackedMessage } from './ChatMessage';
import VirtualList from './VirtualList/index.tsx';
import MessageStack from './MessageStack.vue';
import { getChatSession, ChatSession } from '../../store/modules/chatStore';
import useChatStore from '../../store/modules/chatStore';

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

let chatRange = ref({
  start: 0,
  end: 0
}) //maintain a range of messages to display

const insertMessage = (msg: MessageWarp) => {
  // determine the location to insert the message by sentAt

  // if there is a avaliable stack, insert to the stack

  // else create a new stack and insert to that position
}

// on prop channel change
watch(() => props.channel, (newVal, oldVal) => {
  currentSession = getChatSession(newVal)
  isLoading = currentSession.isLoading
  currentSession.on('new-message', (warp: Ref<MessageWarp>) => {
    //TODO: make this order by time
    // if message is history, add to the front (determined by sentAt)
    // if message is new, add to the back

    if (warp.value._msg.sentAt < source.value[0].messages[0].value._msg.sentAt) {
      source.value.unshift(reactive(new StackedMessage([warp])))
      return
    }

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

const onTopHit = () => {
  currentSession?.loadMore()
}

const onBottomHit = () => {
  console.log('bottom hit')
}

defineExpose({
  scrollToBottom
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