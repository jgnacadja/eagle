import { getHubspotConfig, loadHubspotTrackingCode, type HubspotConfig } from './hubspot'

describe('getHubspotConfig', () => {
  it('returns null when portalId, formId or region is missing', () => {
    expect(getHubspotConfig({})).toBeNull()
    expect(getHubspotConfig({ VITE_HUBSPOT_PORTAL_ID: 'p' })).toBeNull()
    expect(getHubspotConfig({ VITE_HUBSPOT_PORTAL_ID: 'p', VITE_HUBSPOT_FORM_ID: 'f' })).toBeNull()
  })

  it('returns the full config when all 3 fields are set', () => {
    expect(
      getHubspotConfig({
        VITE_HUBSPOT_PORTAL_ID: 'p',
        VITE_HUBSPOT_FORM_ID: 'f',
        VITE_HUBSPOT_REGION: 'eu1'
      })
    ).toEqual({ portalId: 'p', formId: 'f', region: 'eu1' })
  })
})

describe('loadHubspotFormsScript', () => {
  const SELECTOR = 'script[src="//js.hsforms.net/forms/embed/v2.js"]'

  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
  })

  it('injects the HubSpot forms script tag and resolves once it loads', async () => {
    const { loadHubspotFormsScript } = await import('./hubspot')
    const promise = loadHubspotFormsScript(document)

    const script = document.head.querySelector(SELECTOR)
    expect(script).not.toBeNull()

    script?.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('reuses the same in-flight promise and injects only one script tag', async () => {
    const { loadHubspotFormsScript } = await import('./hubspot')
    const first = loadHubspotFormsScript(document)
    const second = loadHubspotFormsScript(document)

    expect(second).toBe(first)
    document.head.querySelector(SELECTOR)?.dispatchEvent(new Event('load'))
    await first

    expect(document.head.querySelectorAll('script').length).toBe(1)
  })

  it('resolves immediately when the script tag is already present in the document', async () => {
    const existing = document.createElement('script')
    existing.src = '//js.hsforms.net/forms/embed/v2.js'
    document.head.appendChild(existing)

    const { loadHubspotFormsScript } = await import('./hubspot')
    await expect(loadHubspotFormsScript(document)).resolves.toBeUndefined()
  })

  it('rejects when the script fails to load', async () => {
    const { loadHubspotFormsScript } = await import('./hubspot')
    const promise = loadHubspotFormsScript(document)

    document.head.querySelector(SELECTOR)?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('Failed to load HubSpot forms script')
  })
})

describe('loadHubspotTrackingCode', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('injects the tracking script tag pointed at the given portalId', () => {
    loadHubspotTrackingCode('12345', document)

    const script = document.getElementById('hs-script-loader') as HTMLScriptElement | null
    expect(script).not.toBeNull()
    expect(script?.src).toContain('js.hs-scripts.com/12345.js')
  })

  it('does not inject a second tag when one is already present', () => {
    loadHubspotTrackingCode('12345', document)
    loadHubspotTrackingCode('12345', document)

    expect(document.head.querySelectorAll('#hs-script-loader').length).toBe(1)
  })
})

describe('renderHubspotForm', () => {
  const config: HubspotConfig = { portalId: 'p', formId: 'f', region: 'eu1' }

  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
  })

  it('loads the forms script then creates the form with the right options', async () => {
    const { renderHubspotForm } = await import('./hubspot')

    const create = vi.fn()
    const fakeWindow = { document, hbspt: { forms: { create } } } as unknown as Window & {
      hbspt: { forms: { create: typeof create } }
    }

    const promise = renderHubspotForm(config, '#target', fakeWindow)
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))
    await promise

    expect(create).toHaveBeenCalledWith({
      region: 'eu1',
      portalId: 'p',
      formId: 'f',
      target: '#target'
    })
  })

  it('throws when window.hbspt is not exposed once the script has loaded', async () => {
    const { renderHubspotForm } = await import('./hubspot')
    const fakeWindow = { document } as unknown as Window

    const promise = renderHubspotForm(config, '#target', fakeWindow as never)
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))

    await expect(promise).rejects.toThrow('did not expose window.hbspt')
  })
})
