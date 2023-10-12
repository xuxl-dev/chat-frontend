<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatList from '@/components/ChatList/index.vue';
import { Message } from '@/components/ChatList/helpers/messageHelper';
import useChatStore from '@/store/modules/chatStore';
import { getStatus } from "@/apis/modules/userMeta";
const { bkm } = useChatStore()

onMounted(async () => {
  await bkm.init()
  console.log(bkm.user)
})

const msg = ref('Lorem ipsum')
const send = () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  useChatStore().getChatSession(to).send(new Message().from(me.id).text(msg.value))
}

const switchUser = async () => {
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5NzAzNTk1MiwiZXhwIjoxNjk5NjI3OTUyfQ.-PG_PGdZJTtpTjMgHmtQOW8g_oOdlOk1Q8neR0q-4Ns`)
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
      <button @click="console.log(useChatStore().getChatSession(useChatStore().me.id === 1 ? 2 : 1).getRawChat())">log chat</button> <br>
    </div>
  </main>
</template>
