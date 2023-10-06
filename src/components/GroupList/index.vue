<template>
    <el-menu
      active-text-color="#ffd04b"
      background-color="#304156"
      class="el-menu-vertical-demo"
      :default-active="defaultActive"
      text-color="#fff"
      @open="handleOpen"
      @close="handleClose"
      router
      unique-opened
      :collapse="!$store.getters.siderType"
    >
      <el-sub-menu :index="item.id" v-for="item in groupsList" :key="item.id">
        <template #title>
          <!-- 如果使用的是全局定义的elicon -->
          <el-icon><component :is="iconList[item.icon]"></component></el-icon>
          <span>{{ item.authName }}</span>
        </template>
        <el-menu-item
          v-for="it in item.children"
          :key="it.id"
          ><el-icon><Menu /></el-icon>{{ it.authName }}</el-menu-item
        >
      </el-sub-menu>
    </el-menu>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  //需要全局导入ele-icon
  import {
    User,
    Menu,
    Setting,
    Shop,
    PieChart,
    Tickets
  } from '@element-plus/icons-vue'
  
  //群头像列表（目前拿icon代替）
  const iconList = ref(['User', 'Setting', 'Shop', 'Tickets', 'PieChart'])
  
  const groupsList = ref([])
  const initgroupList = async () => {
    groupsList.value = [
        {
            'id': '125',
            'authName': '聊天群',
            'icon': 0, //此处应为群头像
            'children': [
                    {
                        'id': '1',
                        'authName': '1号群',
                        //群成员列表从这里获取吗？
                        //'userlist': [],   
                        'order' : None,
                    },
                    {
                        'id': '2',
                        'authName': '2号群',
                        //'userlist': [],
                        'order' : None,
                    },
                    {
                        'id': '3',
                        'authName': '3号群',
                        //'userlist': [],
                        'order' : None,
                    },
                    
                    ],
            'order' : 1,
        },
        ]
  }
  initgroupList()
  
  </script>
  
  <style lang="scss" src="./styles.scss" scoped />
  