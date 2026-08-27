import './style.css'
import { PROFILES, isProfileId } from './profiles'
import { getHubspotConfig, renderHubspotForm, type HubspotEnv } from './hubspot'

const FORM_TARGET_SELECTOR = '#hubspot-form-target'

export function initPresencePage(doc: Document = document): void {
  const buttons = doc.querySelectorAll<HTMLElement>('[data-profile-cta]')
  const unavailableNotice = doc.querySelector<HTMLElement>('[data-form-unavailable]')
  // Vite's ImportMetaEnv doesn't structurally overlap with our narrow env subset.
  const config = getHubspotConfig(import.meta.env as unknown as HubspotEnv)

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const profileId = button.dataset.profileCta
      if (!profileId || !isProfileId(profileId)) {
        return
      }

      doc.querySelector(FORM_TARGET_SELECTOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      if (!config) {
        unavailableNotice?.removeAttribute('hidden')
        return
      }

      const profile = PROFILES.find((candidate) => candidate.id === profileId)
      if (!profile) {
        return
      }

      renderHubspotForm(config, FORM_TARGET_SELECTOR, profile.hubspotValue).catch(() => {
        unavailableNotice?.removeAttribute('hidden')
      })
    })
  })
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPresencePage())
  } else {
    initPresencePage()
  }
}
