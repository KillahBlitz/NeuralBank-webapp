<script setup>
import { ref, nextTick } from 'vue'

const documentsRef = ref(null)

function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const today = new Date()
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

const filterStart = ref(formatLocalDate(sevenDaysAgo))
const filterEnd = ref(formatLocalDate(today))

const activeStartDate = ref(new Date(filterStart.value + 'T00:00:00').toISOString())
const activeEndDate = ref(new Date(filterEnd.value + 'T23:59:59').toISOString())

const rangeWarning = ref('')

async function onBuscar() {
  rangeWarning.value = ''

  if (!filterStart.value || !filterEnd.value) {
    rangeWarning.value = 'Selecciona ambas fechas.'
    return
  }

  const start = new Date(filterStart.value)
  const end = new Date(filterEnd.value)

  if (start > end) {
    rangeWarning.value = 'La fecha de inicio no puede ser posterior a la fecha fin.'
    return
  }

  const diffMs = end.getTime() - start.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > 30) {
    rangeWarning.value = 'El rango no puede exceder 30 días.'
    return
  }

  activeStartDate.value = new Date(filterStart.value + 'T00:00:00').toISOString()
  activeEndDate.value = new Date(filterEnd.value + 'T23:59:59').toISOString()

  await nextTick()
  documentsRef.value?.reload()
}

function onUploaded() {
  documentsRef.value?.reload()
}
</script>

<template>
  <div class="data-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="page-title mb-0">Documentos</h1>
      <SubmitFile @uploaded="onUploaded" />
    </div>

    <div class="d-flex flex-wrap align-items-end gap-3 mb-3">
      <div>
        <label for="filter-start" class="form-label filter-label">Fecha inicio</label>
        <input
          id="filter-start"
          v-model="filterStart"
          type="date"
          class="form-control"
        />
      </div>
      <div>
        <label for="filter-end" class="form-label filter-label">Fecha fin</label>
        <input
          id="filter-end"
          v-model="filterEnd"
          type="date"
          class="form-control"
        />
      </div>
      <div>
        <button class="btn btn-buscar" @click="onBuscar">Buscar</button>
      </div>
    </div>

    <p v-if="rangeWarning" class="range-warning">{{ rangeWarning }}</p>

    <Documents
      ref="documentsRef"
      :start-date="activeStartDate"
      :end-date="activeEndDate"
    />
  </div>
</template>

<style scoped>
.data-page {
  padding: 40px 48px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-blue-dark);
  margin-bottom: 4px;
}

.btn-buscar {
  background-color: var(--color-blue-dark);
  color: var(--color-white);
  border: none;
}

.btn-buscar:hover {
  opacity: 0.9;
  background-color: var(--color-blue-dark);
  color: var(--color-white);
}

.range-warning {
  color: var(--color-red);
  font-size: 14px;
  margin-bottom: 8px;
}
</style>
