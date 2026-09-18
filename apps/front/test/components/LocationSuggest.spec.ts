import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LocationSuggest from '~/components/Catalogue/LocationSuggest.vue'

const fetchMock = vi.fn()

function mountSuggest(modelValue = '') {
  return mount(LocationSuggest, {
    props: { modelValue, 'onUpdate:modelValue': () => {} },
    global: { stubs: { IconMapPin: true, IconClose: true } }
  })
}

async function typeAndSuggest(wrapper: ReturnType<typeof mountSuggest>, value: string) {
  await wrapper.find('input').setValue(value)
  await vi.advanceTimersByTimeAsync(250)
}

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  vi.stubGlobal('$fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('LocationSuggest', () => {
  it('emits the raw text while typing', async () => {
    fetchMock.mockResolvedValue([])
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, 'pari')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['pari'])
  })

  it('emits lat,lng when a commune suggestion is picked', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.8357, 45.764] } }
        ])
      }
      return Promise.resolve([])
    })
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, 'lyon')
    expect(wrapper.find('datalist option').exists()).toBe(true)

    await wrapper.find('input').setValue('Lyon (69)')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['45.764,4.8357'])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Lyon (69)')
  })

  it('emits the département code when a département suggestion is picked', async () => {
    fetchMock.mockResolvedValue([{ code: '69', nom: 'Rhône' }])
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, '69')
    await wrapper.find('input').setValue('Rhône (69)')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/departements',
      expect.objectContaining({ params: { code: '69' } })
    )
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['69'])
  })

  it('queries communes by postal code for a 5-digit input', async () => {
    fetchMock.mockResolvedValue([{ nom: 'Lyon 3e', codeDepartement: '69' }])
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, '69003')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://geo.api.gouv.fr/communes',
      expect.objectContaining({ params: expect.objectContaining({ codePostal: '69003' }) })
    )
  })

  it('keeps working when the geo API fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, 'lyon')

    expect(wrapper.find('datalist option').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['lyon'])
  })

  it('emits undefined when cleared', async () => {
    fetchMock.mockResolvedValue([])
    const wrapper = mountSuggest('Lyon')

    await wrapper.find('[aria-label="Effacer la localisation"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })
})
