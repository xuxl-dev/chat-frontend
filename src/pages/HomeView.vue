<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatList from '@/components/ChatList/index.vue';
import { BakaMessager, Message } from '@/components/ChatList/helpers/messageHelper';
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
  const to = curUid.value === 1 ? 2 : 1
  bkm.getConversation(to).send(new Message().from(curUid.value).text(msg.value))
}
const switchUser = () => {
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5NjY2NDQwOSwiZXhwIjoxNjk5MjU2NDA5fQ.XDXkPM3smzyY7rle2EbdL0NuoNhH55LMzB40630LFuU`)
  curUid.value = bkm.user.id
}
const curUid = ref(2)
</script>

<template>
  <main>
    <ChatList />
    <div>
      <input type="text"
             v-model="msg" />
             <p>Current user:{{ curUid }}</p>
      <button @click="send">send</button>
      <button @click="switchUser">switch user</button>
    </div>
  </main>
</template>
