<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatList from '@/components/ChatList/index.vue';
import useChatStore, { getChatSession } from '@/store/modules/chatStore';
import { Db } from '@/utils/db';
import Dexie from 'dexie';
import { Message, MessageFlag } from '../modules/advancedChat/base';

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
  bkm.switchUser(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTc3MjY2NTMsImV4cCI6MTcwMDMxODY1M30.MQ7A6aiLxZt9a-QkyvJrt_eIpEBcfVzzBnCgGWT3Ag8`)
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
let isConnected = ref(false)
onMounted(() => {
  useChatStore().bkm.on('status', (status) => {
    console.log('status', status)
    isConnected.value = status !== 'connected'
    const attempts = useChatStore().bkm.attempts
    const maxRetry = useChatStore().bkm.maxRetry
    if (attempts === maxRetry) {
      loadingText.value = `Failed to connect to server. Please refresh the page.`
      return
    }
    loadingText.value = `Disconnected from server... Reconnecting... (${attempts}/${maxRetry})`
  })
})
const loadingText = ref('Disconnected from server... Reconnecting...')
</script>

<template>
  <main>
    <div class="spacer" v-loading="isConnected" :element-loading-text="loadingText">
      <ChatList ref="chatListRef" />
    </div>
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
      <button @click="establishE2ee">E2EE</button> <br>
      <button @click="getChatSession(useChatStore().me.id === 1 ? 2 : 1).heartBeat()">HeartBeat</button> <br>
    </div>
  </main>
</template>

<style lang="scss">
.spacer {
  min-height: 40vh;
  height: 50vh;
}
</style>