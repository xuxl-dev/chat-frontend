<template>
  <div class="chat-message flex items-end h-full" ref="msgRef" :msgid="message.value.id" :class="{
    'flex-row-reverse': !isSelfMessage,
  }">
    <div class="message-body break-words ml-2 mr-2 whitespace-pre-wrap text-xl" :class="{
      'message-bubble': !isSelfMessage,
      'my-message-bubble': isSelfMessage,
      'no-tail': displayStyle !== 'tail',
      'left-tailed': displayStyle === 'tail' && !isSelfMessage,
      'right-tailed': displayStyle === 'tail' && isSelfMessage,
    }">
      {{ message.value.id }}
      {{ message.value.text }}
      <div class="flex float-right">
        <div class="receipt" :class="{
          collapse: !isSelfMessage,
          sent: receipt === 'DELIVERED',
          read: receipt === 'READ',
        }">
          <CircleChecked v-if="receipt === 'SENT'" />
          <Checked v-else-if="receipt === 'DELIVERED'" />
          <DoubleChecked v-else />
        </div>

        <div class="read-count flex items-end" v-if="message.value.group || showReadCount && isSelfMessage">
          <span class="text-sm">{{ message.value.readCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Ref } from 'vue';
import { MessageWarp } from './ChatMessage';
import Checked from './icons/Checked.vue';
import DoubleChecked from './icons/DoubleChecked.vue';
import CircleChecked from './icons/CircleChecked.vue';
import useChatStore from '@/store/modules/chatStore';
import { User } from '@/decls/user';

const store = useChatStore()
const msgRef = ref<HTMLElement | null>(null)

const props = defineProps({
  message: {
    type: Object as () => Ref<MessageWarp>,
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
    default: true,
  },
  showReceipt: {
    type: Boolean,
    required: false,
    default: true,
  }
});

const msg = ref(props.message);
const isSelfMessage = computed(() => props.message.value.sender.id === store.me?.id);
const receipt = computed(() => {
  return props.message.value.status;
});

defineExpose({
  msgRef,
  msg,
  isSelfMessage,
  receipt,
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

.receipt {
  color: #72eda7;
  font-size: 24px;
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