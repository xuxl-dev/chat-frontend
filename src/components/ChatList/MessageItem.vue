<template>
  <div class="chat-message flex items-end h-full"
       ref="msgRef"
       :msgid="message.id"
       :class="{
         'flex-row-reverse': !isSelfMessage,
       }">
    <div class="message-body break-words ml-2 mr-2 whitespace-pre-wrap text-xl"
         :class="{
           'message-bubble': !isSelfMessage,
           'my-message-bubble': isSelfMessage,
           'no-tail': displayStyle !== 'tail',
           'left-tailed': displayStyle === 'tail' && !isSelfMessage,
           'right-tailed': displayStyle === 'tail' && isSelfMessage,
         }">
      {{ message.text }}
      <div class="flex float-right">
        <div class="receipt"
             :class="{
               collapse: !isSelfMessage,
               sent: receipt === 'DELIVERED',
               read: receipt === 'READ',
             }
               ">
          <Checked v-if="receipt === 'DELIVERED'" />
          <DoubleChecked v-else-if="receipt === 'READ'" />
        </div>

        <div class="read-count flex items-end"
             v-if="message.group">
          <span class="text-sm">{{ message.readCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { MessageWarp, User } from './ChatMessage';
import Checked from './icons/Checked.vue';
import DoubleChecked from './icons/DoubleChecked.vue';
import useChatStore, { Conversation } from '@/store/modules/chatStore';
const { me } = useChatStore()
const msgRef = ref<HTMLElement | null>(null)
onMounted(() => {
  if (!msgRef.value) return
  props.conversation.observer.observe(msgRef.value)
  // console.log(props.message)
  props.conversation.map.set(+props.message.id, setObservableState)
})

const props = defineProps({
  message: {
    type: Object as () => MessageWarp | Readonly<MessageWarp>,
    required: true,
  },
  sentBy: {
    type: User,
    required: false,
  },
  displayStyle: {
    type: String, // normal, tail
    required: false,
    default: 'normal',
  },
  showReadCount: {
    type: Boolean,
    required: false,
    default: false,
  },
  showReceipt: {
    type: Boolean,
    required: false,
    default: true,
  },
  conversation: {
    type: Conversation,
    required: true,
  }
});

const emits = defineEmits(['click', 'sean']);

const msg = ref(props.message);
const isSelfMessage = computed(() => props.message.sender.id === me.id);
const receipt = computed(() => {
  return props.message.status;
});


const canBeSeen = ref(false);
const setObservableState = (state: boolean) => {
  canBeSeen.value = state;
};

defineExpose({
  msgRef,
  msg,
  isSelfMessage,
  receipt,
  canBeSeen,
  setObservableState,
});

</script>
<style scoped lang="scss">
.collapsed {
  visibility: hidden;
}

.chat-message {
  &.reversed {
    flex-direction: row-reverse;
  }

  &.normal {
    flex-direction: row;
  }
}

.message-body {
  max-width: 70%;
  padding: 0 4px;

  &.normal {
    justify-content: left;
    margin-left: 10px;
  }

  &.reversed {
    justify-content: flex-start; // items are reversely arranged in the DOM flow
    flex-direction: row-reverse;
    margin-right: 10px;
  }
}

$receipt-color: #72eda7;
$read-color: #72eda7;
$font-size: 24px;

.receipt {

  &.sent,
  &.read {
    color: $receipt-color;
    font-size: $font-size;
  }

  &.read {
    color: $read-color;
  }
}


.read-count {
  font-size: 12px;
}

// 带尾巴的消息框样式
.message-bubble {
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 10px;
  position: relative;
  color: black;
}

.left-tailed {
  &::before {
    content: "";
    position: absolute;
    bottom: 0px;
    left: -10px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid #e0e0e0;
    transform: translateY(-50%);
  }
}

.right-tailed {
  &::before {
    content: "";
    position: absolute;
    right: -10px;
    bottom: 0px;
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid #007bff;
    transform: translateY(-50%);
  }
}

// 没有尾巴的消息框样式
.no-tail {
  color: black;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 3px;

  &.normal {
    background-color: #e0e0e0;
  }

  &.self {
    background-color: #007bff;
    color: #fff;
  }
}

// 自己发出的反向尾巴靠右的消息框样式
.my-message-bubble {
  background-color: #007bff;
  padding: 10px;
  border-radius: 10px;
  color: #fff;
  position: relative;


}
</style>