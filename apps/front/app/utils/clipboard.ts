// Copie presse-papiers : Clipboard API en contexte sécurisé, repli
// execCommand sinon (HTTP local, permission refusée, vieux navigateurs).
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return fallbackCopy(text)
  }
}

// execCommand est déprécié mais reste le seul repli hors contexte
// sécurisé : on le retype à part pour ne pas propager la dépréciation.
interface LegacyDocument {
  execCommand?: (commandId: string) => boolean
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = (document as LegacyDocument).execCommand?.call(document, 'copy') ?? false
  textarea.remove()
  return copied
}
