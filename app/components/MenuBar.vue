<script setup>
const router = useRouter()
</script>

<template>
  <aside class="sidebar d-flex flex-column align-items-center">
    <div class="logo-wrap">
      <img src="/banamex.svg" alt="Banamex" class="logo-img" />
    </div>

    <nav class="nav-section">
      <button class="nav-btn" @click="router.push('/DataPage')">
        Documentos
      </button>
      <button class="nav-btn">
        Reporte de Conciliacion
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: var(--color-blue-dark);
  box-sizing: border-box;
  overflow-y: auto;
}

.logo-wrap {
  display: flex;
  justify-content: center;
  padding: 5px 35px;
  margin-top: 20px;
  background-color: var(--color-white);
}

.logo-img {
  width: 160px;
  height: auto;
}

.nav-section {
  width: 100%;
  margin-top: 32px;
  padding: 0 20px;
  box-sizing: border-box;
}

.nav-btn {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 5px;
  padding: 14px 0;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-btn:hover {
  background-color: var(--color-red);
  color: #ffffff;
}
</style>
