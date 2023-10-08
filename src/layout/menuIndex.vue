<template>
  <div>
    <el-container class="app-wrapper">
      <el-aside class="sidebar-container">
        <MenuIndex />
      </el-aside>
      <el-container class="container" :class="{ hidderContainer: '210px' }">
        <el-header><headerIndex /></el-header>
        <el-main><ChatView /></el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import MenuIndex from './Menu/MenuIndex.vue'
import headerIndex from './header/headIndex.vue'
import ChatView from '@/pages/ChatView.vue'
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.container {
  width: calc(100% - 210px);
  height: 100%;

  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  transition: all 0.28s;
}
.el-header {
  padding: 0;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  background-color: #304156;
}
</style>
