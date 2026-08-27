import { initPresencePage } from './main'
import * as hubspot from './hubspot'

vi.mock('./hubspot', () => ({
  getHubspotConfig: vi.fn(),
  renderHubspotForm: vi.fn()
}))

const CONFIG = { portalId: 'p', formId: 'f', region: 'eu1', profileFieldName: 'profil' }

function buildFixture(): Document {
  const doc = document.implementation.createHTMLDocument('presence')
  doc.body.innerHTML = `
    <button type="button" data-profile-cta="entreprise">Entreprise</button>
    <button type="button" data-profile-cta="unknown-profile">Invalide</button>
    <button type="button">Sans profil</button>
    <div id="hubspot-form-target"></div>
    <p data-form-unavailable hidden>indisponible</p>
  `
  const target = doc.querySelector<HTMLElement>('#hubspot-form-target')
  if (target) {
    target.scrollIntoView = vi.fn()
  }
  return doc
}

describe('initPresencePage', () => {
  beforeEach(() => {
    vi.mocked(hubspot.getHubspotConfig).mockReset()
    vi.mocked(hubspot.renderHubspotForm).mockReset()
  })

  it('ignores clicks on buttons with no valid data-profile-cta', () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(CONFIG)
    const doc = buildFixture()
    initPresencePage(doc)

    doc.querySelector<HTMLElement>('[data-profile-cta="unknown-profile"]')?.click()
    doc.querySelectorAll('button')[2]?.click()

    expect(hubspot.renderHubspotForm).not.toHaveBeenCalled()
  })

  it('scrolls to the form and renders it prefilled when HubSpot is configured', async () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(CONFIG)
    vi.mocked(hubspot.renderHubspotForm).mockResolvedValue(undefined)

    const doc = buildFixture()
    initPresencePage(doc)

    const target = doc.querySelector<HTMLElement>('#hubspot-form-target')
    doc.querySelector<HTMLElement>('[data-profile-cta="entreprise"]')?.click()
    await Promise.resolve()

    expect(target?.scrollIntoView).toHaveBeenCalled()
    expect(hubspot.renderHubspotForm).toHaveBeenCalledWith(CONFIG, '#hubspot-form-target', 'Entreprise')
    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(true)
  })

  it('reveals the unavailable notice when HubSpot is not configured', () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(null)
    const doc = buildFixture()
    initPresencePage(doc)

    doc.querySelector<HTMLElement>('[data-profile-cta="entreprise"]')?.click()

    expect(hubspot.renderHubspotForm).not.toHaveBeenCalled()
    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(false)
  })

  it('reveals the unavailable notice when rendering the form fails', async () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(CONFIG)
    vi.mocked(hubspot.renderHubspotForm).mockRejectedValue(new Error('boom'))

    const doc = buildFixture()
    initPresencePage(doc)
    doc.querySelector<HTMLElement>('[data-profile-cta="entreprise"]')?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(false)
  })
})
