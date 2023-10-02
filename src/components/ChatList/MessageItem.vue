<template>
  <div class="chat-message flex items-end pb-4 pt-5 h-full ">

    <div class="message-body break-all ml-2 mr-2 whitespace-pre-wrap text-xl">
      sentBy?.name:{{ sentBy?.name  }}
      message.senderName: {{ message.senderName }}
      {{ message.text }}
      

      <div class="flex flex-row items-center float-right">
        <div class="receipt" :class="{
          collapse: !isSelfMessage,
          sent: receipt === 'sent',
          read: receipt === 'read',
        }">
          <Checked v-if="receipt === 'sent'" />
          <DoubleChecked v-else-if="receipt === 'read'" />
        </div>

        <div class="read-count" v-if="message.group">
          {{ message.readCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Message, User } from './ChatMessage';
import Checked from './icons/Checked.vue';
import DoubleChecked from './icons/DoubleChecked.vue';


const props = defineProps({
  message: {
    type: Message,
    required: true,
  },
  sentBy: {
    type: User,
    required: false,
  },
  displayStyle: {
    type: String,
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
  }
});
const msg = ref(props.message);
const isSelfMessage = computed(() => props.sentBy?.name === msg.value.senderName);
const receipt = computed(() => {
  return props.message.read ? 'read' : 'sent';
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
$read-color: #4caf50;
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
  color: #888;
}

// 带尾巴的消息框样式
.message-bubble {
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 10px;
  position: relative;
  color: black;

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

// 没有尾巴的消息框样式
.message-bubble-no-tail {
  color: black;
  padding: 10px;
  border-radius: 10px;

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
</style>