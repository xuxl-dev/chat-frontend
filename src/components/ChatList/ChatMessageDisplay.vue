<template>
  <div class="chat-message">
    <div class="avatar">
      <ElAvatar :src="message.senderAvatar" :alt="message.senderName"></ElAvatar>
    </div>
    <div class="message-content">
      <div class="sender-name">{{ message.senderName ?? '<Annormous>' }}</div>
      <div class="message-text">{{ message.text ?? '<None>' }}</div>
    </div>
    <div class="message-status">
      <div class="receipt" :class="message.read ? 'read' : 'sent'">
        <el-icon v-if="message.read" name="check">
          <Check />
        </el-icon>
        <el-icon v-else name="check-empty">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor"
              d="M 341.656 706.944 L 130.84 496.256 C 85.735 541.52 130.928 496.351 85.592 541.504 L 341.592 797.504 L 849.812 290.84 C 817.028 290.84 819.394 290.508 792.335 290.508 L 341.592 706.944 L 341.656 706.944 Z" />
            <path fill="currentColor"
              d="M 965.48 291.029 L 455.687 798.727 C 476.97 798.727 509.174 797.737 509.174 797.737 L 1017.018 292.144 C 1002.923 292.144 984.08 291.029 965.48 291.029 Z" />
          </svg>
        </el-icon>
      </div>
      <div class="read-count" v-if="message.group">
        {{ message.readCount }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Message } from './ChatMessage';

const props = defineProps({
  message: {
    type: Message,
    required: true,
  },
  reversed: {
    type: Boolean,
    default: false,
  },
  showReadCount: {
    type: Boolean,
    default: false,
  },
  showReadReceipt: {
    type: Boolean,
    default: false,
  },
  isTail: {
    type: Boolean,
    default: false,
  },
});

const message = ref(props.message);

</script>

<style scoped lang="scss">
.chat-message {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.avatar {
  margin-right: 10px;
}

.message-content {
  flex-grow: 1;
}

.sender-name {
  font-weight: bold;
}

.message-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}



$receipt-color: #72eda7;
$read-color: #4caf50;
$font-size: 24px;

.receipt {
  &.sent, &.read {
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
</style>
