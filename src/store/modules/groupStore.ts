import { lorem } from '@/components/ChatList/randChatG'
import { randBetween } from '@/utils/utils'
import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, computed } from 'vue'
interface IGroup {
  id: string,
  picture: Ref<string>,
  name: Ref<string>,
  number: Ref<number>
}
let id = 0

function genRandomGroup() {
  return {
    id: id.toString(),
    picture: ref(lorem.generateWords(3)),
    name: ref(`${id} 号群`),
    number: ref(randBetween(1, 100))
  }
}

function hunTimes() {
  let glist = []
  for (id; id < 100; id++) {
    glist.push(genRandomGroup())
  }
  return glist
}

const useGroupStore = defineStore('vgyvybhnun', () => {

  const selectedGroup = ref<string | null>(null)

  let rawgroups = ref<IGroup[]>(
    hunTimes()
    // {
    //   id: '1',
    //   picture: ref('pig'),
    //   name: ref('1号群'),
    //   number: ref(1)
    // },
    // {
    //   id: '2',
    //   picture: ref('dog'),
    //   name: ref('2号群'),
    //   number: ref(2)
    // },
    // {
    //   id: '3',
    //   picture: ref('cat'),
    //   name: ref('3号群'),
    //   number: ref(0)
    // }
  )

  const sortByFieldName = (fieldName: keyof IGroup, asending = true) => {
    return rawgroups.value.sort(
      (a, b) => (a[fieldName] < b[fieldName]) !== asending ? 1 : -1
    )
  }

  const sortBy = (cmp: (a: any, b: any) => number) => {
    return rawgroups.value.sort(cmp)
  }

  const filterByName = (name: string) => {
    groups.value = rawgroups.value.filter(

      (o) => o.name.includes(name)
    )
  }

  const field = ref<keyof IGroup>('id')
  let groups = ref(
    sortByFieldName(field.value)
  )

  return {
    rawgroups,
    selectedGroup,
    groups,
    filterByName
  }
})

export default useGroupStore
