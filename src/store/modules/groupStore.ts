import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, computed } from 'vue'
interface IGroup {
  id: string,
  picture: Ref<string>,
  name: Ref<string>,
  number: Ref<number>
}
const useGroupStore = defineStore('vgyvybhnun', () => {

  function getgroup() {

  }

  const selectedGroup = ref<string | null>(null)

  let rawgroups = ref<IGroup[]>([
    {
      id: '1',
      picture: ref('pig'),
      name: ref('1号群'),
      number: ref(1)
    },
    {
      id: '2',
      picture: ref('dog'),
      name: ref('2号群'),
      number: ref(2)
    },
    {
      id: '3',
      picture: ref('cat'),
      name: ref('3号群'),
      number: ref(0)
    }
  ])

  const field = ref<keyof IGroup>('id')
  let groups = computed(() => {
    return sortByFieldName(field.value)
  })

  const sortByFieldName = (fieldName: keyof IGroup, asending = true) => {
    return rawgroups.value.sort(
      (a, b) => (a[fieldName] < b[fieldName]) !== asending ? 1 : -1
    )
  }

  const sortBy = (cmp: (a: any, b: any) => number) => {
    return rawgroups.value.sort(cmp)
  }

  return {
    rawgroups,
    selectedGroup,
    groups
  }
})

export default useGroupStore
