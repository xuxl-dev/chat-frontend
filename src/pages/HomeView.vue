<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatList from '@/components/ChatList/index.vue';
import { Message } from '@/components/ChatList/helpers/messageHelper';
import useChatStore, { getChatSession } from '@/store/modules/chatStore';
import { Db } from '@/utils/db';
import Dexie from 'dexie';
import { generateRSAKeyPair } from '../components/ChatList/helpers/cipher2';
import { run } from '@/utils/pool';
import { MessageFlag } from '../components/ChatList/helpers/messageHelper';

const { bkm } = useChatStore()

onMounted(async () => {
  await bkm.init()
})

const msg = ref('Lorem ipsum')
const send = () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  getChatSession(to).send(new Message().from(me.id).text(msg.value))
}

const sendE2ee = () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  getChatSession(to).send(new Message().from(me.id).text(msg.value).withFlag(MessageFlag.E2EE))
}

const switchUser = async () => {
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTc1MzE3NzksImV4cCI6MTY5NzcwNDU3OX0.aFk1uV7qYYAdbCTmbtG5E-MGESgrky5rHxvFk-jjdfY`)
  await bkm.init()
}

const showDb = async () => {
  console.log(await Db.instance().getMessages())
}

const clearDB = async () => {
  console.log(Dexie.delete('ChatDatabase'))
}

const establishE2ee = async () => {
  const me = useChatStore().me
  const to = me.id === 1 ? 2 : 1
  await getChatSession(to).getConversation().enableE2EE()
}

const chatListRef = ref<any | null>(null)

const loadMore = async () => {
  chatListRef.value.loadMore()
}

</script>

<template>
  <main>
    <ChatList ref="chatListRef" />
    <div>
      <input type="text" v-model="msg" />
      <p>Current user:{{ useChatStore().me?.id }}</p>
      <button @click="send">send</button> <br>
      <button @click="sendE2ee">sendE2ee</button> <br>
      <button @click="switchUser">switch user</button> <br>
      <button @click="console.log(getChatSession(useChatStore().me.id === 1 ? 2 : 1).getRawChat())">log chat</button> <br>
      <button @click="showDb">Show DB</button> <br>
      <button @click="clearDB">Clear DB</button> <br>
      <button @click="loadMore">loadMore</button> <br>
      <button @click="establishE2ee">E2EE</button>
    </div>
  </main>
</template>
