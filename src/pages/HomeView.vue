<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatList from '@/components/ChatList/index.vue';
import { BakaMessager, Message } from '@/components/ChatList/helpers/messageHelper';
import useChatStore from '@/store/modules/chatStore';
const { bkm } = useChatStore()

onMounted(async () => {
  await bkm.init()
  console.log(bkm.user)
})

const msg = ref('Lorem ipsum')
const send = () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  bkm.getConversation(to).send(new Message().from(me.id).text(msg.value))
}
const switchUser = async () => {
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5NjY2NDQwOSwiZXhwIjoxNjk5MjU2NDA5fQ.XDXkPM3smzyY7rle2EbdL0NuoNhH55LMzB40630LFuU`)
  await bkm.init()
}

</script>

<template>
  <main>
    <ChatList />
    <div>
      <input type="text"
             v-model="msg" />
      <p>Current user:{{ useChatStore().me?.id }}</p>
      <button @click="send">send</button> <br>
      <button @click="switchUser">switch user</button> <br>
    </div>
  </main>
</template>
