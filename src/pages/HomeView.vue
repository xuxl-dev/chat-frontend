<script setup lang="ts">
import { ref, onMounted } from 'vue'

import ChatList from '@/components/ChatList/index.vue';
import { BakaMessager } from '@/components/ChatList/helpers/messageHelper';
const server = ref('http://localhost:3001');
const bkm = new BakaMessager({
  server: server.value,
  port: 3001,
  token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTY2NjQzOTIsImV4cCI6MTY5OTI1NjM5Mn0.Vz5xa46oyYX5pbIphpNeuOyXvWTfBlLNH_fvv5IF6Mc`,
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
