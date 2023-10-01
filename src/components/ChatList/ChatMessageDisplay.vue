<template>
  <div class="chat-message flex items-end pb-4 pt-5 h-full" :class="{
    reversed: isSelfMessage,
    normal: !isSelfMessage,
  }">

    <ElAvatar :src="message.senderAvatar" :alt="message.senderName" class="sticky bottom-0 avatar z-50" :class="{
      collapsed: !message.showAvatar,
    }"></ElAvatar>

    <div class="message-body break-all ml-2 mr-2 whitespace-pre-wrap text-xl">
      <!-- {{ message.texts.join('\n') }} -->
      <div v-for="i in Math.max(0, message.texts.length - 2)" class="message-bubble-no-tail mt-1 mb-1" :class="{
        'normal': !message.isSelfMessage,
        'self': message.isSelfMessage,
      }"> {{message.texts[i]}} </div>
      <div :class="{
        'my-message-bubble': message.isSelfMessage,
        'message-bubble': !message.isSelfMessage,
      }"> {{message.texts[message.texts.length - 1]}} </div>
      <div class="float-right">
        <div class="flex flex-col items-end">
          <div class="receipt flex flex-row items-center" :class="{
            sent: !message.read, //TODO: use message.sent
            read: message.read,
          }">
            <div :class="{
              collapse: !isSelfMessage,
            }">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Message } from './ChatMessage';

const props = defineProps({
  message: {
    type: Message,
    required: true,
  }
});
const isSelfMessage = computed(() => props.message.isSelfMessage);
const message = ref(props.message);

onMounted(() => {
  // print all props
  // console.log(props);
})

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

.avatar {
  // margin-right: 10px;
  width: 40px;
  height: 40px;
  margin-bottom: $font-size + 4px;
}


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
