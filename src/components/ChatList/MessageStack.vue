<template>
  <div>

  </div>
</template>
<script setup lang="ts">
import { Message } from './ChatMessage';

const props = defineProps({
  messages: {
    type: Array<Message>,
    required: true,
  }
});

const emits = defineEmits({
  'append-message': (message: Message) => true,
});

const appendMessage = (message: Message) => {
};

</script>
<style lang="scss"></style>