

<template>
  <div class="flex flex-row ">
    <div>
      <GroupList @select-group="onGroupSelect" />
    </div>
    <main class="w-full">
      <div class="spacer" v-loading="isConnected" :element-loading-text="loadingText">
        <KeepAlive :max="20">
          <component :is="tabs[currentTab]?.render" />
        </KeepAlive>
      </div>
      <div>
        <input type="text" v-model="msg" />
        <p>Current user:{{ useChatStore().me?.id }}</p>
        <button @click="send">send</button> <br>
        <button @click="sendE2ee">sendE2ee</button> <br>
        <button @click="switchUser">switch user</button> <br>
        <button @click="console.log(getChatSession(useChatStore().me.id === 1 ? 2 : 1).getRawChat())">log chat</button>
        <br>
        <!-- <button @click="showDb">Show DB</button> <br>
        <button @click="clearDB">Clear DB</button> <br> -->
        <button @click="establishE2ee">E2EE</button> <br>
        <button @click="getChatSession(useChatStore().me.id === 1 ? 2 : 1).heartBeat()">HeartBeat</button> <br>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import useChatStore, { getChatSession } from '@/store/modules/chatStore';
import { Db } from '@/utils/db';
import Dexie from 'dexie';
import { Message, MessageFlag } from '../modules/advancedChat/base';
import GroupList from '@/components/GroupList/GroupList.vue';
import { login } from '@/modules/auth/auth'
import { initGroupStore } from '@/store/modules/groupStore';
import getChatListOf from '@/components/ChatList/ChatListHelper';
import { getPlaceholder } from '../components/ChatList/ChatListHelper';

const { bkm } = useChatStore()

onMounted(async () => {
  const usr = await login("admin", "admin")
  console.log(usr)
  await bkm.init(usr.jwt)
  initGroupStore()
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
  const usr = await login("user", "user", true)
  await bkm.init(usr.jwt)
  initGroupStore()
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

let isConnected = ref(false)
onMounted(() => {
  useChatStore().bkm.on('status', (status) => {
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

const defaultSymbol = Symbol('default')
const tabs: {
  [key: string | symbol]: {
    isGroup: boolean
    render: JSX.Element
  }
} = {
  [defaultSymbol]: {
    isGroup: false,
    render: getPlaceholder(114514)
  }
}
const currentTab = ref<string | symbol>(defaultSymbol)

const requireNewTab = (channel: number, isGroup: boolean) => {
  const name = isGroup ? `group:${channel}` : `user:${channel}`
  if (!tabs[name]) {
    tabs[name] = {
      isGroup,
      render: getChatListOf(channel)
    }
  }
  currentTab.value = name
}

const onGroupSelect = (group: any) => {
  requireNewTab(group.id, true) //TODO: this may not a group but a user
}

</script>
<style lang="scss">
.spacer {
  min-height: 40vh;
  height: 50vh;
}
</style>