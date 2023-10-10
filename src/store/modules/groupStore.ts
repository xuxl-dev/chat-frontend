import { defineStore } from 'pinia'
import { ref } from 'vue'

const useGroupStore = defineStore('vgyvybhnun', () => {

  function getgroup() {

  }

  let groupsList = ref([
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
      number: ref(0)
    },
    {
      id: '3',
      picture: ref('cat'),
      name: ref('3号群'),
      number: ref(0)
    }
  ])

  return {
    groupsList
  }
})

export default useGroupStore
