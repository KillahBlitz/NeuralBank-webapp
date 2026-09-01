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

// Detail panel state
const expandedUuid = ref(null)
const currentPage = ref(null)
const currentPageNumber = ref(1)
const totalPages = ref(0)
const detailLoading = ref(false)

// Fullscreen image modal state
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

  // Initialize Bootstrap Modal
  if (imageModalEl.value) {
    const bootstrap = await import('bootstrap')
    imageModal = new bootstrap.Modal(imageModalEl.value)
  }
})

defineExpose({ reload })
</script>

<template>
  <div class="documents-container">
    <!-- Loading spinner -->
    <div v-if="loading" class="d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="files.length === 0" class="text-center text-secondary py-5">
      <p class="fs-6">No hay documentos en el rango seleccionado.</p>
    </div>

    <!-- Document rows -->
    <div v-else class="documents-list">
      <!-- Column header row -->
      <div class="header-row d-flex align-items-center gap-3">
        <!-- Empty space for PDF icon column -->
        <span class="doc-icon-placeholder"></span>

        <!-- Column headers -->
        <span class="header-cell flex-grow-1">Nombre de archivo</span>
        <span class="header-cell header-date">Fecha de carga</span>
        <span class="header-cell header-status">Estatus</span>
        <span class="header-cell header-size">Peso</span>
        <span class="header-cell header-pages">P&aacute;ginas</span>

        <!-- Empty space for chevron column -->
        <span class="chevron-placeholder"></span>
      </div>

      <div v-for="file in files" :key="file.uuid">
        <div class="document-row d-flex align-items-center gap-3">
          <!-- 1. PDF icon -->
          <img src="/icons/pdfIcon.png" alt="PDF" class="doc-icon" />

          <!-- 2. File name -->
          <span class="doc-name flex-grow-1">{{ file.file_name }}</span>

          <!-- 3. Upload date -->
          <span class="doc-date">{{ formatDate(file.upload_at) }}</span>

          <!-- 4. Status icon -->
          <img
            v-if="getStatusIcon(file.status)"
            :src="getStatusIcon(file.status)"
            :alt="file.status"
            class="status-icon"
          />

          <!-- 5. File size -->
          <span class="doc-size">{{ formatSize(file.file_size) }}</span>

          <!-- 6. Pages -->
          <span class="doc-pages">{{ file.pages }} p&aacute;gs</span>

          <!-- 7. Chevron-down -->
          <button
            class="chevron-btn"
            :class="{ 'chevron-expanded': expandedUuid === file.uuid }"
            @click="onChevronClick(file.uuid)"
            aria-label="Expandir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
            </svg>
          </button>
        </div>

        <!-- Detail panel -->
        <div v-if="expandedUuid === file.uuid" class="detail-panel">
          <!-- Loading state -->
          <div v-if="detailLoading" class="d-flex justify-content-center align-items-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando detalle...</span>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else-if="!currentPage" class="text-center text-secondary py-4">
            <p class="mb-0">No se encontraron páginas para este documento.</p>
          </div>

          <!-- Page content -->
          <div v-else class="detail-content d-flex">
            <!-- LEFT: Image column -->
            <div class="detail-image-col">
              <img
                v-if="currentPage"
                :src="'data:image/png;base64,' + currentPage.file_bytes"
                alt="P&aacute;gina del documento"
                class="detail-page-image"
                @click="openImageModal"
              />
              <p v-if="currentPage" class="detail-page-label">
                P&aacute;gina {{ currentPage.page }}
              </p>

              <!-- Navigation arrows (only if more than 1 page) -->
              <div v-if="totalPages > 1" class="detail-nav d-flex align-items-center justify-content-center gap-2">
                <button
                  class="detail-nav-btn"
                  :disabled="currentPageNumber <= 1 || detailLoading"
                  @click.stop="prevPage()"
                  aria-label="Página anterior"
                >
                  &#8249;
                </button>
                <span class="detail-nav-info">
                  Página {{ currentPageNumber }} de {{ totalPages }}
                </span>
                <button
                  class="detail-nav-btn"
                  :disabled="currentPageNumber >= totalPages || detailLoading"
                  @click.stop="nextPage()"
                  aria-label="Página siguiente"
                >
                  &#8250;
                </button>
              </div>
            </div>

            <!-- RIGHT: Extraction text column -->
            <div class="detail-text-col">
              <div v-if="currentPage" class="detail-extraction-text">
                {{ currentPage.extraction }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen image modal (Bootstrap Modal) -->
    <div
      ref="imageModalEl"
      class="modal fade"
      tabindex="-1"
      aria-label="Imagen a pantalla completa"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content image-modal-content">
          <div class="modal-header image-modal-header">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body d-flex justify-content-center align-items-center">
            <img
              v-if="currentPage"
              :src="'data:image/png;base64,' + currentPage.file_bytes"
              alt="Imagen de p&aacute;gina completa"
              class="image-modal-img"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.documents-container {
  margin-top: 16px;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

/* Column header row */
.header-row {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-blue-dark);
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-gray);
}

.doc-icon-placeholder {
  width: 32px;
  flex-shrink: 0;
}

.header-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-date {
  flex-shrink: 0;
}

.header-status {
  min-width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.header-size {
  flex-shrink: 0;
  min-width: 70px;
  text-align: right;
}

.header-pages {
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;
}

.chevron-placeholder {
  width: 28px;
  flex-shrink: 0;
}

/* Data rows */
.document-row {
  min-height: 72px;
  padding: 16px 20px;
  background: var(--color-white);
  border: 1px solid var(--color-gray);
  border-radius: 8px;
  font-size: 16px;
  color: var(--color-blue-dark);
}

.doc-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.doc-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.doc-date {
  flex-shrink: 0;
  color: #555;
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
  min-width: 80px;
}

.doc-size {
  flex-shrink: 0;
  min-width: 70px;
  text-align: right;
}

.doc-pages {
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;
}

.chevron-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--color-blue-dark);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, transform 0.3s ease;
}

.chevron-btn:hover {
  opacity: 0.7;
}

.chevron-btn.chevron-expanded {
  transform: rotate(180deg);
}

/* Detail panel */
.detail-panel {
  background: rgba(104, 204, 231, 0.5);
  border: 1px solid var(--color-gray);
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
}

.detail-content {
  gap: 0;
}

.detail-image-col {
  flex-shrink: 0;
  max-width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-page-image {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
}

.detail-page-label {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-blue-dark);
  text-align: center;
}

.detail-nav {
  margin-top: 8px;
}

.detail-nav-btn {
  background: none;
  border: 1px solid var(--color-blue-dark);
  color: var(--color-blue-dark);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.detail-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.detail-nav-btn:not(:disabled):hover {
  background: var(--color-blue-dark);
  color: var(--color-white);
}

.detail-nav-info {
  font-size: 13px;
  color: var(--color-blue-dark);
  white-space: nowrap;
}

.detail-text-col {
  flex-grow: 1;
  padding-left: 20px;
  min-width: 0;
}

.detail-extraction-text {
  font-size: 14px;
  color: var(--color-blue-dark);
  line-height: 1.6;
  white-space: pre-line;
  overflow-y: auto;
  max-height: 320px;
}

/* Fullscreen image modal */
.image-modal-content {
  background: #000;
  border: none;
}

.image-modal-header {
  border-bottom: none;
  padding: 8px 12px;
  background: transparent;
}

.image-modal-header .btn-close {
  filter: invert(1);
}

.image-modal-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}
</style>
