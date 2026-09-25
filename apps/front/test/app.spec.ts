import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import App from '~/app.vue'

const useSeoMetaMock = vi.fn()

vi.stubGlobal('computed', computed)
vi.stubGlobal('useSeoMeta', useSeoMetaMock)
vi.stubGlobal('useRoute', () => ({ path: '/formations' }))
vi.stubGlobal('useRequestURL', () => new URL('https://preview.test/formations'))

const stubs = {
  NuxtRouteAnnouncer: true,
  NuxtLayout: { template: '<div><slot /></div>' },
  NuxtPage: true,
  MotionConfig: { template: '<div><slot /></div>' }
}

describe('app.vue', () => {
  it('définit les métadonnées OG/Twitter par défaut', () => {
    mount(App, { global: { stubs } })

    expect(useSeoMetaMock).toHaveBeenCalledOnce()
    const meta = useSeoMetaMock.mock.calls[0]?.[0] as Record<string, unknown>

    // L'image est résolue depuis l'origine de la requête : elle existe sur
    // n'importe quel déploiement (previews Vercel incluses).
    expect(meta.ogImage).toBe('https://preview.test/images/learnup-preview-card.png')
    expect(meta.twitterImage).toBe(meta.ogImage)
    expect(meta.twitterCard).toBe('summary_large_image')
    expect(meta.ogType).toBe('website')
    expect(meta.ogSiteName).toBe('LEARN UP ACADEMY')
    expect(meta.ogLocale).toBe('fr_FR')
    expect(meta.ogImageWidth).toBe(1200)
    expect(meta.ogImageHeight).toBe(630)
    expect(meta.ogImageAlt).toBeTruthy()
    expect(meta.description).toBeTruthy()
  })

  it('résout og:url depuis la route courante', () => {
    mount(App, { global: { stubs } })

    const meta = useSeoMetaMock.mock.calls[0]?.[0] as { ogUrl: { value: string } }
    expect(meta.ogUrl.value).toBe('https://preview.test/formations')
  })
})
