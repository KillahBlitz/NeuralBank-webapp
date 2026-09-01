<script setup>
import { ref, onMounted } from 'vue'
import { uploadPDF } from '~/composable/PDFApi'

const emit = defineEmits(['uploaded'])

const fileInput = ref(null)
const modalEl = ref(null)
const bootstrapModal = ref(null)

const statusIcons = ref({})
const uploadState = ref('idle')
const errorMessage = ref('')

onMounted(async () => {
  const res = await fetch('/icons/status-icons.json')
  statusIcons.value = await res.json()

  const { Modal } = await import('bootstrap')
  bootstrapModal.value = new Modal(modalEl.value)
})

function openModal() {
  uploadState.value = 'idle'
  errorMessage.value = ''
  bootstrapModal.value?.show()
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  uploadState.value = 'loading'

  try {
    const data = await uploadPDF(file)

    if (data.error && data.error !== '') {
      uploadState.value = 'error'
      errorMessage.value = data.error
    } else {
      uploadState.value = 'success'
      emit('uploaded', data)
    }
  } catch {
    uploadState.value = 'error'
    errorMessage.value = 'Error de conexión con el servidor'
  }

  setTimeout(() => {
    bootstrapModal.value?.hide()
  }, 2000)

  fileInput.value.value = ''
}
</script>

<template>
  <button class="upload-btn" @click="openModal" :disabled="uploadState === 'loading'">
    <img v-if="statusIcons.upload" :src="statusIcons.upload" alt="Upload" class="upload-icon" />
  </button>

  <!-- Modal Bootstrap -->
  <div class="modal fade" ref="modalEl" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-body text-center p-5">

          <!-- Estado: idle -->
          <div v-if="uploadState === 'idle'" class="drop-area" @click="triggerFileInput">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#aaa" viewBox="0 0 16 16" class="mb-3">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
            </svg>
            <p class="fs-5 text-secondary mb-0">Carga tus archivos aquí</p>
          </div>

          <!-- Estado: loading / success / error -->
          <div v-else class="d-flex flex-column align-items-center gap-3">
            <div class="pdf-wrapper position-relative">
              <img src="/icons/pdfIcon.png" alt="PDF" class="pdf-icon" />

              <div v-if="uploadState === 'loading'" class="state-overlay">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>

              <div v-else-if="uploadState === 'success'" class="state-overlay">
                <img :src="statusIcons.complete" alt="Completado" class="status-icon" />
              </div>

              <div v-else-if="uploadState === 'error'" class="state-overlay">
                <img :src="statusIcons.incomplete" alt="Error" class="status-icon" />
              </div>
            </div>

            <p v-if="uploadState === 'error'" class="text-danger small mb-0">{{ errorMessage }}</p>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept=".pdf,application/pdf"
            style="display: none"
            @change="onFileSelected"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  transition: opacity 0.15s;
}

.upload-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.upload-icon {
  width: 100px;
  height: 100px;
}

.drop-area {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 40px 30px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop-area:hover {
  border-color: var(--color-blue-dark);
  background: #f5f8ff;
}

.pdf-wrapper {
  width: 90px;
  height: 90px;
}

.pdf-icon {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.state-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 6px;
}

.status-icon {
  width: 40px;
  height: 40px;
}
</style>
