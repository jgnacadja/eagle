export interface HubspotConfig {
  portalId: string
  formId: string
  region: string
  profileFieldName: string
}

export interface HubspotEnv {
  VITE_HUBSPOT_PORTAL_ID?: string
  VITE_HUBSPOT_FORM_ID?: string
  VITE_HUBSPOT_REGION?: string
  VITE_HUBSPOT_PROFILE_FIELD?: string
}

const DEFAULT_PROFILE_FIELD_NAME = 'profil'

/**
 * portalId/formId/region must all be set — a missing region silently breaks the
 * HubSpot embed rather than degrading, so config is only valid when complete.
 */
export function getHubspotConfig(env: HubspotEnv): HubspotConfig | null {
  const portalId = env.VITE_HUBSPOT_PORTAL_ID
  const formId = env.VITE_HUBSPOT_FORM_ID
  const region = env.VITE_HUBSPOT_REGION

  if (!portalId || !formId || !region) {
    return null
  }

  return {
    portalId,
    formId,
    region,
    profileFieldName: env.VITE_HUBSPOT_PROFILE_FIELD || DEFAULT_PROFILE_FIELD_NAME
  }
}

const HUBSPOT_SCRIPT_SRC = '//js.hsforms.net/forms/embed/v2.js'

let scriptLoadPromise: Promise<void> | null = null

export function loadHubspotScript(doc: Document = document): Promise<void> {
  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = doc.querySelector(`script[src="${HUBSPOT_SCRIPT_SRC}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = doc.createElement('script')
    script.src = HUBSPOT_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load HubSpot forms script'))
    doc.head.appendChild(script)
  })

  return scriptLoadPromise
}

interface HubspotFormInstance {
  find(selector: string): { val(value: string): unknown }
}

interface HubspotWindow extends Window {
  hbspt?: {
    forms: {
      create(options: {
        region: string
        portalId: string
        formId: string
        target: string
        onFormReady?: (form: HubspotFormInstance) => void
      }): void
    }
  }
}

export async function renderHubspotForm(
  config: HubspotConfig,
  targetSelector: string,
  profileValue: string,
  win: HubspotWindow = window as HubspotWindow
): Promise<void> {
  await loadHubspotScript(win.document)

  if (!win.hbspt) {
    throw new Error('HubSpot forms script did not expose window.hbspt')
  }

  win.hbspt.forms.create({
    region: config.region,
    portalId: config.portalId,
    formId: config.formId,
    target: targetSelector,
    onFormReady: (form) => {
      form.find(`[name="${config.profileFieldName}"]`).val(profileValue)
    }
  })
}
