<template>
  <div class="flex flex-row ">
    <div>
      <GroupList @select-group="onGroupSelect" />
    </div>
    <main class="w-full">
      <div class="spacer" v-loading="isConnected" :element-loading-text="loadingText">
        <KeepAlive :max="20">
          <component :is="currentTab" />
        </KeepAlive>
      </div>
      <div>
        <input type="text" v-model="msg" />
        <p>Current user:{{ useChatStore().me?.id }}</p>
        <button @click="send">send</button> <br>
        <button @click="sendE2ee">sendE2ee</button> <br>
        <button @click="switchUser">switch user</button> <br>
        <button
          @click="console.log(getChatSession(useChatStore().me.id === 1 ? 2 : 1, grpStore.selectedGroup.isGroup).getRawChat())">log
          chat</button>
        <br>
        <!-- <button @click="showDb">Show DB</button> <br>
        <button @click="clearDB">Clear DB</button> <br> -->
        <button @click="establishE2ee">E2EE</button> <br>
        <button @click="getChatSession(useChatStore().me.id === 1 ? 2 : 1, false).heartBeat()">HeartBeat</button> <br>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onActivated } from 'vue';
import useChatStore, { getChatSession } from '@/store/modules/chatStore';
import { Db } from '@/utils/db';
import Dexie from 'dexie';
import { Message, MessageFlag } from '../modules/advancedChat/base';
import GroupList from '@/components/GroupList/GroupList.vue';
import { login } from '@/modules/auth/auth'
import useGroupStore, { initGroupStore } from '@/store/modules/groupStore';
import getChatListOf from '@/components/ChatList/ChatListHelper';
import { getPlaceholder } from '../components/ChatList/ChatListHelper';
import { ChatGroupDisplay } from '../store/modules/groupStore';

const store = useChatStore()
const grpStore = useGroupStore()

onMounted(async () => {
  const usr = await login("admin", "admin")
  console.log(usr)
  await store.bkm.init(usr.jwt)
  initGroupStore()
})

const msg = ref('Lorem ipsum')

const send = () => {
  const me = store.me
  const to = me.id === 1 ? 2 : 1
  getChatSession(to, grpStore.selectedGroup.isGroup).send(new Message().from(me.id).text(msg.value))
}

const sendE2ee = () => {
  const me = store.me
  const to = me.id === 1 ? 2 : 1
  getChatSession(to, grpStore.selectedGroup.isGroup).send(new Message().from(me.id).text(msg.value).withFlag(MessageFlag.E2EE))
}

const switchUser = async () => {
  const usr = await login("user", "user", true)
  await store.bkm.init(usr.jwt)
  initGroupStore()
}

const showDb = async () => {
  console.log(await Db.instance().getMessages())
}

const clearDB = async () => {
  console.log(Dexie.delete('ChatDatabase'))
}

const establishE2ee = async () => {
  const me = store.me
  const to = me.id === 1 ? 2 : 1
  await getChatSession(to, grpStore.selectedGroup.isGroup).getConversation().enableE2EE()
}

let isConnected = ref(false)
onMounted(() => {
  store.bkm.on('status', (status) => {
    isConnected.value = status !== 'connected'
    const attempts = store.bkm.attempts
    const maxRetry = store.bkm.maxRetry
    if (attempts === maxRetry) {
      loadingText.value = `Failed to connect to server. Please refresh the page.`
      return
    }
    loadingText.value = `Disconnected from server... Reconnecting... (${attempts}/${maxRetry})`
  })
})

onActivated(() => {
  console.log('activated')
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
const currentTabId = ref<string | symbol>(defaultSymbol)

const requireNewTab = (channel: number, isGroup: boolean) => {
  const name = isGroup ? `group:${channel}` : `user:${channel}`
  if (!tabs[name]) {
    tabs[name] = {
      isGroup,
      render: getChatListOf(channel, isGroup)
    }
    console.log(`new tab: ${name}`)
  }
  currentTabId.value = name
}

const currentTab = computed(() => {
  return tabs[currentTabId.value].render
})

const onGroupSelect = (group: ChatGroupDisplay) => {
  requireNewTab(group.id, group.isGroup)
  console.log(`selected group: ${group.id}`)
  console.log(tabs)
}

</script>
<style lang="scss">
.spacer {
  min-height: 40vh;
  height: 50vh;
}
</style>