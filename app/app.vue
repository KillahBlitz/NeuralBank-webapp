<script setup>
import MenuBar from './components/MenuBar.vue';
</script>

<template>
  <div class="app-layout">
    <MenuBar />
    <main class="app-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-content {
  margin-left: 220px;
  flex: 1;
}
</style>
