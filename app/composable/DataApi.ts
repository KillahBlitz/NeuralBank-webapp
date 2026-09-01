const apiUrl = import.meta.env.VITE_API_URL

export async function fetchData(startDate: string, endDate: string) {
  const response = await fetch(`${apiUrl}data/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: startDate,
      end_date: endDate,
    }),
  })

  const data = await response.json()
  return data.files_list || []
}

export async function fetchFileDetail(fileUuid: string) {
  const response = await fetch(`${apiUrl}data/${fileUuid}`)
  const data = await response.json()
  return data.files_list || []
}

export async function fetchFilePage(fileUuid: string, page: number) {
  const response = await fetch(`${apiUrl}data/${fileUuid}/page/${page}`)
  const data = await response.json()
  return {
    totalPages: data.total_pages || 0,
    page: data.page || null,
  }
}
