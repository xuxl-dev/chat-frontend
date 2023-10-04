<template>
  <div class="message-container items-end mt-4 mb-4"
       :class="{
         'flex-row-reverse': isSelfMessage,
       }">

    <ElAvatar :src="sender.avatar"
              :alt="sender.name"
              class="sticky bottom-0 avatar z-50" />

    <div class="flex flex-col">
      <!-- {{ stackedMessage.sender }} {{ sender }} -->
      <TransitionGroup name="list"
                       tag="div">
        <MessageItem v-for="(v, i) in stackedMessage.messages"
                     :key="v.id"
                     :sent-by="sender"
                     :message="v"
                     :class="{
                       'justify-end': sender.name === stackedMessage.sender,
                       'message-transform': !isSelfMessage,
                       'self-message-transform': isSelfMessage,
                     }"
                     :display-style="i === stackedMessage.messages.length - 1 ? 'tail' : 'normal'" />
      </TransitionGroup>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Message, StackedMessage, User } from './ChatMessage';
import MessageItem from './MessageItem.vue';
const isSelfMessage = computed(() => props.stackedMessage.sender === props.sender.name)
onMounted(() => {
  props
})

const props = defineProps({
  stackedMessage: {
    type: StackedMessage,
    required: true,
  },
  sender: {
    type: User,
    required: false,
    default: new User(1, 'SenderA', ''),
  }
});

const emits = defineEmits({
  'append-message': (message: Message) => true,
});

const appendMessage = (message: Message) => {
};

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
  --translate-distance: 30px;
}

.self-message-transform {
  --translate-distance: -30px;
}

.list-leave-active {
  position: absolute;
}
</style>