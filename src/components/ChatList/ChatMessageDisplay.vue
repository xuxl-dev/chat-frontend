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
      <div class="read-receipt">
        <el-icon v-if="message.read" name="check">
          <Check />
        </el-icon>
        <el-icon v-else name="check-empty">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor"
              d="M 406.656 706.944 L 195.84 496.256 C 150.735 541.52 195.928 496.351 150.592 541.504 L 406.592 797.504 L 914.812 290.84 C 882.028 290.84 884.394 290.508 857.335 290.508 L 406.592 706.944 L 406.656 706.944 Z"
              transform="matrix(0.9999999999999999, 0, 0, 0.9999999999999999, 0, 0)" />
            <path fill="currentColor"
              d="M 926.48 291.029 L 416.687 798.727 C 437.97 798.727 470.174 797.737 470.174 797.737 L 978.018 292.144 C 963.923 292.144 945.08 291.029 926.48 291.029 Z"
              transform="matrix(0.9999999999999999, 0, 0, 0.9999999999999999, 0, 0)" />
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

<style scoped>
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

.read-receipt {
  color: #4caf50;
  /* 已读回执颜色 */
}

.read-count {
  font-size: 12px;
  color: #888;
}</style>
