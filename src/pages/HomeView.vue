<script setup lang="ts">
import { ref, onMounted } from 'vue'

import ChatList from '@/components/ChatList/index.vue';
import { BakaMessager } from '@/components/ChatList/helpers/messageHelper';
const server = ref('http://localhost:3001');
const bkm = new BakaMessager({
  server: server.value,
  port: 3001,
  token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTY0MDU2MzIsImV4cCI6MTY5NjU3ODQzMn0.wWTjb8nm2k5SMabC3_xw-oz6rfqgdYftPGIhXC9-EbQ`,
})

onMounted(async () => {
  await bkm.init()
  console.log(bkm.user)
})

const msg = ref('')
const send = () => {

}
</script>

<template>
  <main>
    <ChatList />
    <div>
      <input type="text"
             v-model="msg" />
      <button @click="send">send</button>
    </div>
  </main>
</template>
