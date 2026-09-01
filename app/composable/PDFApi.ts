const apiUrl = import.meta.env.VITE_API_URL

export async function uploadPDF(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${apiUrl}pdf-upload/`, {
    method: 'POST',
    body: formData,
  })

  return await response.json()
}
