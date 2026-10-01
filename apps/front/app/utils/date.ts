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

// Libellés « Mois année » des `count` mois à partir de `from` (mois courant
// inclus) — utilisés pour les options d'échéance : la liste ne peut jamais
// proposer un mois passé. Mois capitalisé pour l'affichage en liste.
export function upcomingMonthLabelsFr(count: number, from = new Date()): string[] {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
  return Array.from({ length: count }, (_, i) => {
    const label = formatter.format(new Date(from.getFullYear(), from.getMonth() + i, 1))
    return label.charAt(0).toUpperCase() + label.slice(1)
  })
}
