import './style.css'
import {
  getHubspotConfig,
  loadHubspotTrackingCode,
  renderHubspotForm,
  type HubspotEnv
} from './hubspot'

const FORM_TARGET_SELECTOR = '#hubspot-form-target'

export function initPresencePage(doc: Document = document, win: Window = window): void {
  const unavailableNotice = doc.querySelector<HTMLElement>('[data-form-unavailable]')
  // Vite's ImportMetaEnv doesn't structurally overlap with our narrow env subset.
  const config = getHubspotConfig(import.meta.env as unknown as HubspotEnv)

  if (!config) {
    unavailableNotice?.removeAttribute('hidden')
    return
  }

  loadHubspotTrackingCode(config.portalId, doc)

  renderHubspotForm(config, FORM_TARGET_SELECTOR, win).catch(() => {
    unavailableNotice?.removeAttribute('hidden')
  })
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPresencePage())
  } else {
    initPresencePage()
  }
}
