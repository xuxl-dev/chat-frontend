<template>
  <div class="chat-message">
    <div class="avatar">
      <ElAvatar :src="message.senderAvatar" :alt="message.senderName"></ElAvatar>
      avatar
    </div>
    <div class="message-content">
      <div class="sender-name">{{ message.senderName ?? '<Annormous>' }}</div>
      <div class="message-text">{{ message.text ?? '<None>' }}</div>
    </div>
    <div class="message-status">
      <div class="read-receipt">
        <el-icon v-if="message.read" name="check"></el-icon>
        icon
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
  }
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
  color: #4caf50; /* 已读回执颜色 */
}

.read-count {
  font-size: 12px;
  color: #888;
}
</style>
