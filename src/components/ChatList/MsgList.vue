<template>
  <div class="chat-msg-list " @contextmenu.prevent>
    <el-icon v-if="false" :size="14" class="loading">
      消息加载中
    </el-icon>
    <VirtualList :data="source" :data-key="getKey" :item="MessageStack" :size="8" class="virtual-list container"
      ref="virtualListRef" @totop="onTopHit()" @tobottom="onBottomHit()" @scroll="onScroll" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, type Ref, reactive, onMounted } from 'vue';
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

onMounted(() => {

})

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

const onTopHit = () => {
  // console.log('top hit')
}

const onBottomHit = () => {
  // console.log('bottom hit')
}

const onScroll = () => {
  // console.log('scroll')
}

defineExpose({
  scrollToBottom
})

</script>
<style lang="scss" scoped>
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
  transition: all 1s;
}

.container::-webkit-scrollbar-thumb {
  // background-color: rgba(255, 0, 0, 1.0);
  border-radius: 5px;
  transition: all 1s;
}

.container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(89, 89, 89, 0.851);
}

.container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(31, 31, 31, 0.851);
}

.container {
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: rgba(0, 0, 0, 0);
  background-clip: text;
  -webkit-background-clip: text;
  transition: background-color .8s;
}

.container:hover {
  background-color: rgba(0, 0, 0, 0.18);
}

.container::-webkit-scrollbar-thumb {
  background-color: inherit;
}

.container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  transition: width 1s;
}

.container:hover::-webkit-scrollbar {
  width: 10px;
  background-color: rgba(92, 92, 92, 0.1);
  opacity: 0.1;
}
</style>