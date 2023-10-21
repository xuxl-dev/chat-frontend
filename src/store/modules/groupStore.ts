import { getAllChatGroups } from '@/apis/modules/chatGroups'
import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, computed } from 'vue'

export class ChatGroup {
  id: string
  name: string
  avatar: string
  desc: string
  members: number[]
  unread: number

  constructor({
    id,
    name,
    avatar,
    desc,
    members,
    unread
  }: {
    id: string
    name: string
    avatar: string
    desc: string
    members?: number[]
    unread?: number
  }) {
    this.id = id
    this.name = name
    this.avatar = avatar
    this.desc = desc
    this.members = members || []
    this.unread = unread || 0
  }
}

export async function initGroupStore() {
  await fetchGroups()
}

export async function fetchGroups() {
  const grps = await getAllChatGroups()
  console.log(`grps:`, grps)
  useGroupStore().rawGroups = grps
}

const useGroupStore = defineStore('groupStore', () => {
  const selectedGroup = ref<string | null>(null)
  const rawGroups = ref<ChatGroup[]>([])
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
