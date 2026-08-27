import { initPresencePage } from './main'
import * as hubspot from './hubspot'

vi.mock('./hubspot', () => ({
  getHubspotConfig: vi.fn(),
  loadHubspotTrackingCode: vi.fn(),
  renderHubspotForm: vi.fn()
}))

const CONFIG = { portalId: 'p', formId: 'f', region: 'eu1' }

function buildFixture(): Document {
  const doc = document.implementation.createHTMLDocument('presence')
  doc.body.innerHTML = `
    <div id="hubspot-form-target"></div>
    <p data-form-unavailable hidden>indisponible</p>
  `
  return doc
}

describe('initPresencePage', () => {
  beforeEach(() => {
    vi.mocked(hubspot.getHubspotConfig).mockReset()
    vi.mocked(hubspot.loadHubspotTrackingCode).mockReset()
    vi.mocked(hubspot.renderHubspotForm).mockReset()
  })

  it('loads the tracking code and renders the form once when HubSpot is configured', async () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(CONFIG)
    vi.mocked(hubspot.renderHubspotForm).mockResolvedValue(undefined)

    const doc = buildFixture()
    initPresencePage(doc, window)
    await Promise.resolve()

    expect(hubspot.loadHubspotTrackingCode).toHaveBeenCalledWith('p', doc)
    expect(hubspot.renderHubspotForm).toHaveBeenCalledWith(CONFIG, '#hubspot-form-target', window)
    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(true)
  })

  it('reveals the unavailable notice and skips HubSpot wiring when not configured', () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(null)

    const doc = buildFixture()
    initPresencePage(doc, window)

    expect(hubspot.loadHubspotTrackingCode).not.toHaveBeenCalled()
    expect(hubspot.renderHubspotForm).not.toHaveBeenCalled()
    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(false)
  })

  it('reveals the unavailable notice when rendering the form fails', async () => {
    vi.mocked(hubspot.getHubspotConfig).mockReturnValue(CONFIG)
    vi.mocked(hubspot.renderHubspotForm).mockRejectedValue(new Error('boom'))

    const doc = buildFixture()
    initPresencePage(doc, window)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(doc.querySelector('[data-form-unavailable]')?.hasAttribute('hidden')).toBe(false)
  })
})
