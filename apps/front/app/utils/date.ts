export function formatDateFr(value: string | null | undefined): string {
  if (!value) return 'Date à préciser'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à préciser'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  })
}

export function formatMonthYearFr(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris'
  })
}
