<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatList from '@/components/ChatList/index.vue';
import { BakaMessager, Message } from '@/components/ChatList/helpers/messageHelper';
import useChatStore from '@/store/modules/chatStore';
import { getStatus } from "@/apis/modules/userMeta";
const server = ref('http://localhost:3001');
const bkm = new BakaMessager({
  server: server.value,
  port: 3001,
  token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTY2NjQzOTIsImV4cCI6MTY5OTI1NjM5Mn0.Vz5xa46oyYX5pbIphpNeuOyXvWTfBlLNH_fvv5IF6Mc`,
})

onMounted(async () => {
 console.log(`store`, useChatStore().me)
  if (await getStatus(1) === 'OFFLINE') {
    await bkm.init()
  } else {
    await switchUser()
  }
  console.log(bkm.user)
})

const msg = ref('Lorem ipsum')
const send = () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  bkm.getConversation(to).send(new Message().from(me.id).text(msg.value))
}
const switchUser = async () => {
  const me = useChatStore().me
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5NjY2NDQwOSwiZXhwIjoxNjk5MjU2NDA5fQ.XDXkPM3smzyY7rle2EbdL0NuoNhH55LMzB40630LFuU`)
  await bkm.init()
  me.id = bkm.user.id
}

</script>

<template>
  <main>
    <ChatList />
    <div>
      <input type="text" v-model="msg" />
      <p>Current user:{{ useChatStore().me?.id }}</p>
      <button @click="send">send</button> <br>
      <button @click="switchUser">switch user</button> <br>
    </div>
  </main>
</template>
