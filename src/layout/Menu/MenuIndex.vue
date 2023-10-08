<template>
  <el-menu
    active-text-color="#ffd04b"
    background-color="#304156"
    class="el-menu-vertical-demo"
    :default-active="defaultActive"
    text-color="#fff"
    router
    unique-opened
  >
    <el-sub-menu index="">
      <template #title>
        <!-- 如果使用的是全局定义的elicon -->
        <el-icon><component :is="iconList[0]"></component></el-icon>
        <span>工作组</span>
      </template>
      <el-menu-item v-for="it in groupsList" :key="it.id"
        ><el-icon><Menu /></el-icon>{{ it.name }}</el-menu-item
      >
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  User,
  Menu,
  Setting,
  Shop,
  PieChart,
  Tickets
} from '@element-plus/icons-vue'
import variables from '@/styles/variables.scss'

//如果是全局导入elicon则适用如下语句
const iconList = ref(['User', 'Setting', 'Shop', 'Tickets', 'PieChart'])
// const icon = ref('menu')

// 规定初始定向页面
const defaultActive = ref(sessionStorage.getItem('path') || '/')

interface grouplist {
  id: string
  name: string
  icon: number
  userid: number[]
}

let groupsList: grouplist[] = [
  {
    id: '1',
    name: '群1',
    icon: 0,
    userid: [1, 2]
  },
  {
    id: '2',
    name: '群2',
    icon: 1,
    userid: [2, 3]
  }
]
</script>

<style lang="scss" scoped></style>
