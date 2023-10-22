import { getAllChatGroups } from '@/apis/modules/chatGroups'
import { getFriends } from '@/apis/modules/user'
import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, computed } from 'vue'

export class ChatGroupDisplay {
  id: number
  name: string
  description: string
  avatar: string
  allowAnyUserToJoin: boolean
  isGroup: boolean
  
  members?: number[]
  unread?: number

  constructor({
    id,
    name,
    avatar,
    desc,
    members,
    unread,
    isGroup
  }: {
    id: number
    name: string
    avatar: string
    desc: string
    isGroup: boolean
    members?: number[]
    unread?: number
  }) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.description = desc
    this.members = members || []
    this.unread = unread || 0
    this.isGroup = isGroup
  }
}

export async function initGroupStore() {
  await fetchGroups()
  await fetchFriends()
}

export async function fetchGroups() {
  const grps = await getAllChatGroups()
  console.log(`grps:`, grps)
  useGroupStore().rawGroups = grps.map((g) => {
    return new ChatGroupDisplay({
      id: g.id,
      name: g.name,
      avatar: g.avatar,
      desc: g.description,
      isGroup: true
    })
  })
}

export async function fetchFriends() {
  const users = await getFriends()
  console.log(`friends:`, users)
  // here we regrad one user as group of two members(sender and receiver)
  // only used for display!
  const groups = users.map((u) => {
    return new ChatGroupDisplay({
      id: u.id,
      name: u.username,
      avatar: u.avatar,
      desc: u.description,
      isGroup: false
    })
  })

  useGroupStore().rawGroups = useGroupStore().rawGroups.concat(groups)
}

const useGroupStore = defineStore('groupStore', () => {
  const selectedGroup = ref<ChatGroupDisplay | null>(null)
  const rawGroups = ref<ChatGroupDisplay[]>([])
  const keyword = ref<string>('')

  const displayGroups = computed(() => {
    return filterGroups(keyword.value)
  })

  const filterGroups = (keyword: string) => {
    return rawGroups.value.filter((g) => g.name.includes(keyword))
  }

  return {
    rawGroups,
    selectedGroup,
    displayGroups
  }
})

export default useGroupStore
