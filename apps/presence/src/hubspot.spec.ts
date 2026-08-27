import { getHubspotConfig, type HubspotConfig } from './hubspot'

describe('getHubspotConfig', () => {
  it('returns null when portalId, formId or region is missing', () => {
    expect(getHubspotConfig({})).toBeNull()
    expect(getHubspotConfig({ VITE_HUBSPOT_PORTAL_ID: 'p' })).toBeNull()
    expect(getHubspotConfig({ VITE_HUBSPOT_PORTAL_ID: 'p', VITE_HUBSPOT_FORM_ID: 'f' })).toBeNull()
  })

  it('applies the default profile field name when none is provided', () => {
    expect(
      getHubspotConfig({
        VITE_HUBSPOT_PORTAL_ID: 'p',
        VITE_HUBSPOT_FORM_ID: 'f',
        VITE_HUBSPOT_REGION: 'eu1'
      })
    ).toEqual({ portalId: 'p', formId: 'f', region: 'eu1', profileFieldName: 'profil' })
  })

  it('uses the provided profile field name when set', () => {
    expect(
      getHubspotConfig({
        VITE_HUBSPOT_PORTAL_ID: 'p',
        VITE_HUBSPOT_FORM_ID: 'f',
        VITE_HUBSPOT_REGION: 'eu1',
        VITE_HUBSPOT_PROFILE_FIELD: 'custom_field'
      })
    ).toEqual({ portalId: 'p', formId: 'f', region: 'eu1', profileFieldName: 'custom_field' })
  })
})

describe('loadHubspotScript', () => {
  const SELECTOR = 'script[src="//js.hsforms.net/forms/embed/v2.js"]'

  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
  })

  it('injects the HubSpot script tag and resolves once it loads', async () => {
    const { loadHubspotScript } = await import('./hubspot')
    const promise = loadHubspotScript(document)

    const script = document.head.querySelector(SELECTOR)
    expect(script).not.toBeNull()

    script?.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('reuses the same in-flight promise and injects only one script tag', async () => {
    const { loadHubspotScript } = await import('./hubspot')
    const first = loadHubspotScript(document)
    const second = loadHubspotScript(document)

    expect(second).toBe(first)
    document.head.querySelector(SELECTOR)?.dispatchEvent(new Event('load'))
    await first

    expect(document.head.querySelectorAll('script').length).toBe(1)
  })

  it('resolves immediately when the script tag is already present in the document', async () => {
    const existing = document.createElement('script')
    existing.src = '//js.hsforms.net/forms/embed/v2.js'
    document.head.appendChild(existing)

    const { loadHubspotScript } = await import('./hubspot')
    await expect(loadHubspotScript(document)).resolves.toBeUndefined()
  })

  it('rejects when the script fails to load', async () => {
    const { loadHubspotScript } = await import('./hubspot')
    const promise = loadHubspotScript(document)

    document.head.querySelector(SELECTOR)?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow('Failed to load HubSpot forms script')
  })
})

describe('renderHubspotForm', () => {
  const config: HubspotConfig = { portalId: 'p', formId: 'f', region: 'eu1', profileFieldName: 'profil' }

  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
  })

  it('loads the script, creates the form and prefills the profile field on ready', async () => {
    const { renderHubspotForm } = await import('./hubspot')

    const val = vi.fn()
    const find = vi.fn().mockReturnValue({ val })
    const create = vi.fn(
      (options: { onFormReady?: (form: { find: typeof find }) => void }) => {
        options.onFormReady?.({ find })
      }
    )
    const fakeWindow = { document, hbspt: { forms: { create } } } as unknown as Window & {
      hbspt: { forms: { create: typeof create } }
    }

    const promise = renderHubspotForm(config, '#target', 'Entreprise', fakeWindow)
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))
    await promise

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ region: 'eu1', portalId: 'p', formId: 'f', target: '#target' })
    )
    expect(find).toHaveBeenCalledWith('[name="profil"]')
    expect(val).toHaveBeenCalledWith('Entreprise')
  })

  it('throws when window.hbspt is not exposed once the script has loaded', async () => {
    const { renderHubspotForm } = await import('./hubspot')
    const fakeWindow = { document } as unknown as Window

    const promise = renderHubspotForm(config, '#target', 'Entreprise', fakeWindow as never)
    document.head.querySelector('script')?.dispatchEvent(new Event('load'))

    await expect(promise).rejects.toThrow('did not expose window.hbspt')
  })
})
