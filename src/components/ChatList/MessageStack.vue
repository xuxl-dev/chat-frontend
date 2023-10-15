<template>
  <div class="message-container items-end mt-4 mb-4"
       :class="{
         'flex-row-reverse': isSelfMessage,
       }">

    <ElAvatar :src="source.sender.avatar"
              :alt="source.sender.name"
              class="sticky bottom-0 avatar z-50" />

    <div class="flex flex-col">
      <!-- {{ stackedMessage.sender }} {{ sender }} -->
      STK({{ source.stack_id }})::sz={{ source.messages?.length }}
      <TransitionGroup name="list"
                       tag="div">
        <MessageItem v-for="(v, i) in source.messages"
                     :key="v.value.tid"
                     :sent-by="source.sender"
                     :message="v"
                     :class="{
                       'justify-end': source.sender.id === source.sender.id,
                       'message-transform': !isSelfMessage,
                       'self-message-transform': isSelfMessage,
                     }"
                     :display-style="i === source.messages.length - 1 ? 'tail' : 'normal'"
                     v-observed="setObserableStateOf(v)" />
      </TransitionGroup>
    </div>
  </div>
</template>
<script setup lang="ts">
import { type Ref, computed } from 'vue'
import { MessageWarp, StackedMessage, User } from './ChatMessage';
import MessageItem from './MessageItem.vue';
import useChatStore from '@/store/modules/chatStore';
import { ACKMsgType } from './helpers/messageHelper';

const props = defineProps({
  source: {
    type: Object as () => StackedMessage,
    required: true,
  }
});

const store = useChatStore()
const isSelfMessage = computed(() => props.source.sender.id === store.me?.id)

const setObserableStateOf = (message: Ref<MessageWarp>) => {
  return (state: boolean) => {
    if (state && (message.value._msg.senderId !== store.me?.id)) { //Do not ack self message
      message.value.ack(ACKMsgType.READ)
    }
  }
}

</script>
<style lang="scss" scoped>
.message-container {
  display: flex;
  height: 100%;
  // overflow-y: scroll;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
    /* make scrollbar transparent */
  }
}

$receipt-color: #72eda7;
$read-color: #4caf50;
$font-size: 24px;

.avatar {
  // margin-right: 10px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  // margin-bottom: $font-size + 4px;
}

.list-move,
/* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(var(--translate-distance));
}


.message-transform {
  --translate-distance: 5%;
}

.self-message-transform {
  --translate-distance: -5%;
}

.list-leave-active {
  position: absolute;
}</style>