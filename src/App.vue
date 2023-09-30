<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div>
    <div sticky-container>
      <div v-sticky sticky-offset="3" sticky-side="bottom">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/demos">Demos</RouterLink>
      </div>
      <RouterView/>
    </div>
  </div>
</template>

<style scoped></style>
