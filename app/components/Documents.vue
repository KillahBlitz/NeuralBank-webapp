<script setup>
import { ref, onMounted } from 'vue'
import { fetchData, fetchFilePage } from '~/composable/DataApi'

const props = defineProps({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
})

const files = ref([])
const statusIcons = ref({})
const loading = ref(false)

const expandedUuid = ref(null)
const currentPage = ref(null)
const currentPageNumber = ref(1)
const totalPages = ref(0)
const detailLoading = ref(false)

const imageModalEl = ref(null)
let imageModal = null

async function fetchDocuments() {
  loading.value = true
  try {
    files.value = await fetchData(props.startDate, props.endDate)
  } catch {
    files.value = []
  } finally {
    loading.value = false
  }
}

function reload() {
  fetchDocuments()
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusIcon(status) {
  const key = status.toLowerCase()
  return statusIcons.value[key] || ''
}

async function loadPage(uuid, page) {
  detailLoading.value = true
  currentPage.value = null
  try {
    const result = await fetchFilePage(uuid, page)
    totalPages.value = result.totalPages
    currentPage.value = result.page
    currentPageNumber.value = page
  } catch {
    currentPage.value = null
    totalPages.value = 0
  } finally {
    detailLoading.value = false
  }
}

async function onChevronClick(uuid) {
  if (expandedUuid.value === uuid) {
    expandedUuid.value = null
    currentPage.value = null
    totalPages.value = 0
    return
  }
  expandedUuid.value = uuid
  await loadPage(uuid, 1)
}

function prevPage() {
  if (currentPageNumber.value > 1) {
    loadPage(expandedUuid.value, currentPageNumber.value - 1)
  }
}

function nextPage() {
  if (currentPageNumber.value < totalPages.value) {
    loadPage(expandedUuid.value, currentPageNumber.value + 1)
  }
}

function openImageModal() {
  if (imageModal) {
    imageModal.show()
  }
}

onMounted(async () => {
  const res = await fetch('/icons/status-icons.json')
  statusIcons.value = await res.json()
  fetchDocuments()

  if (imageModalEl.value) {
    const bootstrap = await import('bootstrap')
    imageModal = new bootstrap.Modal(imageModalEl.value)
  }
})

defineExpose({ reload })
</script>

<template>
  <div class="mt-3">
    <div v-if="loading" class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else-if="files.length === 0" class="text-center text-secondary py-5">
      <p class="fs-6">No hay documentos en el rango seleccionado.</p>
    </div>

    <div v-else class="documents-list d-flex flex-column gap-2">
      <div class="header-row d-flex align-items-center gap-3 px-3 py-2">
        <span class="header-icon-space flex-shrink-0"></span>
        <span class="flex-grow-1 text-truncate">Nombre de archivo</span>
        <span class="flex-shrink-0">Fecha de carga</span>
        <span class="header-status flex-shrink-0 text-center">Estatus</span>
        <span class="header-size flex-shrink-0 text-end">Peso</span>
        <span class="header-pages flex-shrink-0 text-end">Páginas</span>
        <span class="header-chevron-space flex-shrink-0"></span>
      </div>

      <div v-for="file in files" :key="file.uuid">
        <div class="document-row d-flex align-items-center gap-3 px-3 py-3 rounded-3 border">
          <img src="/icons/pdfIcon.png" alt="PDF" class="doc-icon flex-shrink-0" />
          <span class="flex-grow-1 fw-medium text-truncate" style="min-width: 0">{{ file.file_name }}</span>
          <span class="flex-shrink-0 text-secondary">{{ formatDate(file.upload_at) }}</span>
          <img
            v-if="getStatusIcon(file.status)"
            :src="getStatusIcon(file.status)"
            :alt="file.status"
            class="status-icon flex-shrink-0"
          />
          <span class="doc-size flex-shrink-0 text-end">{{ formatSize(file.file_size) }}</span>
          <span class="doc-pages flex-shrink-0 text-end">{{ file.pages }} págs</span>
          <button
            class="chevron-btn flex-shrink-0 btn btn-sm p-1 border-0"
            :class="{ 'chevron-expanded': expandedUuid === file.uuid }"
            @click="onChevronClick(file.uuid)"
            aria-label="Expandir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
            </svg>
          </button>
        </div>

        <div v-if="expandedUuid === file.uuid" class="detail-panel d-flex rounded-3 border mt-2 p-3">
          <div v-if="detailLoading" class="detail-loading-left d-flex justify-content-center align-items-center flex-shrink-0">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando detalle...</span>
            </div>
          </div>

          <div v-else-if="!currentPage" class="w-100 text-center text-secondary py-4">
            <p class="mb-0">No se encontraron páginas para este documento.</p>
          </div>

          <template v-else>
            <div class="detail-image-col d-flex flex-column align-items-center flex-shrink-0">
              <img
                v-if="currentPage"
                :src="'data:image/png;base64,' + currentPage.file_bytes"
                alt="Página del documento"
                class="detail-page-image rounded shadow-sm"
                @click="openImageModal"
              />
              <p v-if="currentPage" class="mt-2 mb-1 fw-medium small text-center">
                Página {{ currentPage.page }}
              </p>
              <div v-if="totalPages > 1" class="d-flex align-items-center justify-content-center gap-2 mt-1">
                <button
                  class="btn btn-outline-primary btn-sm detail-nav-btn d-flex align-items-center justify-content-center"
                  :disabled="currentPageNumber <= 1 || detailLoading"
                  @click.stop="prevPage()"
                >&#8249;</button>
                <span class="small text-nowrap">Página {{ currentPageNumber }} de {{ totalPages }}</span>
                <button
                  class="btn btn-outline-primary btn-sm detail-nav-btn d-flex align-items-center justify-content-center"
                  :disabled="currentPageNumber >= totalPages || detailLoading"
                  @click.stop="nextPage()"
                >&#8250;</button>
              </div>
            </div>

            <div class="flex-grow-1 ps-3" style="min-width: 0">
              <div v-if="currentPage" class="detail-extraction-text">
                {{ currentPage.extraction }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div
      ref="imageModalEl"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content bg-black border-0">
          <div class="modal-header border-0 bg-transparent p-2">
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body d-flex justify-content-center align-items-center">
            <img
              v-if="currentPage"
              :src="'data:image/png;base64,' + currentPage.file_bytes"
              alt="Imagen completa"
              class="image-modal-img"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.documents-list {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.header-row {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-blue-dark);
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-gray);
}

.header-icon-space { width: 32px; }
.header-status { min-width: 80px; }
.header-size { min-width: 70px; }
.header-pages { min-width: 60px; }
.header-chevron-space { width: 28px; }

.document-row {
  min-height: 72px;
  background: var(--color-white);
  border-color: var(--color-gray) !important;
  font-size: 16px;
  color: var(--color-blue-dark);
}

.doc-icon { width: 32px; height: 32px; object-fit: contain; }
.status-icon { width: 32px; height: 32px; object-fit: contain; min-width: 80px; }
.doc-size { min-width: 70px; }
.doc-pages { min-width: 60px; }

.chevron-btn {
  color: var(--color-blue-dark);
  transition: opacity 0.15s, transform 0.3s ease;
}
.chevron-btn:hover { opacity: 0.7; }
.chevron-btn.chevron-expanded { transform: rotate(180deg); }

.detail-panel {
  background: rgba(104, 204, 231, 0.5);
  border-color: var(--color-gray) !important;
}

.detail-loading-left {
  width: 35%;
  min-height: 320px;
}

.detail-image-col { max-width: 35%; }

.detail-page-image {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  cursor: pointer;
}

.detail-nav-btn { width: 32px; height: 32px; font-weight: 600; }

.detail-extraction-text {
  font-size: 14px;
  color: var(--color-blue-dark);
  line-height: 1.6;
  white-space: pre-line;
  overflow-y: auto;
  max-height: 320px;
}

.image-modal-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}
</style>
