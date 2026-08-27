export interface HubspotConfig {
  portalId: string
  formId: string
  region: string
}

export interface HubspotEnv {
  VITE_HUBSPOT_PORTAL_ID?: string
  VITE_HUBSPOT_FORM_ID?: string
  VITE_HUBSPOT_REGION?: string
}

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

  return { portalId, formId, region }
}

const HUBSPOT_FORMS_SCRIPT_SRC = '//js.hsforms.net/forms/embed/v2.js'
const HUBSPOT_TRACKING_SCRIPT_ID = 'hs-script-loader'

let formsScriptLoadPromise: Promise<void> | null = null

export function loadHubspotFormsScript(doc: Document = document): Promise<void> {
  if (formsScriptLoadPromise) {
    return formsScriptLoadPromise
  }

  formsScriptLoadPromise = new Promise((resolve, reject) => {
    const existing = doc.querySelector(`script[src="${HUBSPOT_FORMS_SCRIPT_SRC}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = doc.createElement('script')
    script.src = HUBSPOT_FORMS_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load HubSpot forms script'))
    doc.head.appendChild(script)
  })

  return formsScriptLoadPromise
}

/**
 * Site-wide HubSpot tracking snippet, required by the ticket's reuse procedure
 * for an external (non-HubSpot-hosted) domain. Fire-and-forget: nothing on this
 * page depends on it having loaded, so this doesn't return a promise.
 */
export function loadHubspotTrackingCode(portalId: string, doc: Document = document): void {
  if (doc.getElementById(HUBSPOT_TRACKING_SCRIPT_ID)) {
    return
  }

  const script = doc.createElement('script')
  script.id = HUBSPOT_TRACKING_SCRIPT_ID
  script.type = 'text/javascript'
  script.async = true
  script.defer = true
  script.src = `//js.hs-scripts.com/${portalId}.js`
  doc.head.appendChild(script)
}

interface HubspotWindow extends Window {
  hbspt?: {
    forms: {
      create(options: { region: string; portalId: string; formId: string; target: string }): void
    }
  }
}

export async function renderHubspotForm(
  config: HubspotConfig,
  targetSelector: string,
  win: HubspotWindow = window as HubspotWindow
): Promise<void> {
  await loadHubspotFormsScript(win.document)

  if (!win.hbspt) {
    throw new Error('HubSpot forms script did not expose window.hbspt')
  }

  win.hbspt.forms.create({
    region: config.region,
    portalId: config.portalId,
    formId: config.formId,
    target: targetSelector
  })
}
