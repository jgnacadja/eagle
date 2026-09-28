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
    expect(wrapper.find('li button').exists()).toBe(true)

    await wrapper.find('input').setValue('Lyon (69)')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['45.764,4.8357'])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Lyon (69)')
  })

  it('emits lat,lng when a suggestion is clicked in the list', async () => {
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
    await wrapper.find('li button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['45.764,4.8357'])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Lyon (69)')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('emits the département code when a département suggestion is picked', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/departements') ? [{ code: '69', nom: 'Rhône' }] : [])
    )
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, '69')
    await wrapper.find('input').setValue('Rhône (département 69)')

    expect(fetchMock).toHaveBeenCalledWith('https://geo.api.gouv.fr/departements')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['69'])
  })

  it('proposes postal code suggestions for a numeric input', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/departements')) {
        return Promise.resolve([{ code: '69', nom: 'Rhône' }])
      }
      if (url.includes('/departements/69/communes')) {
        return Promise.resolve([
          {
            nom: 'Lyon 3e',
            codeDepartement: '69',
            codesPostaux: ['69003'],
            centre: { coordinates: [4.9, 45.76] }
          }
        ])
      }
      return Promise.resolve([])
    })
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, '69003')

    expect(wrapper.find('li button').text()).toBe('69003 Lyon 3e')
    await wrapper.find('input').setValue('69003 Lyon 3e')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['45.76,4.9'])
  })

  it('keeps working when the geo API fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, 'lyon')

    expect(wrapper.find('li button').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['lyon'])
  })

  it('emits undefined when cleared', async () => {
    fetchMock.mockResolvedValue([])
    const wrapper = mountSuggest('Lyon')

    await wrapper.find('[aria-label="Effacer la localisation"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })

  it('navigue au clavier dans la liste', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.8357, 45.764] } },
          { nom: 'Lyon 3e', codeDepartement: '69', centre: { coordinates: [4.9, 45.76] } }
        ])
      }
      return Promise.resolve([])
    })
    const wrapper = mountSuggest()
    const input = wrapper.find('input')

    // Ouverture au focus, puis navigation haut/bas et surbrillance souris.
    await input.trigger('focus')
    await typeAndSuggest(wrapper, 'lyon')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowUp' })
    await wrapper.findAll('li button')[1]!.trigger('mouseenter')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['45.76,4.9'])
  })

  it('ignore les autres touches et ferme au blur ou Échap', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.8357, 45.764] } }
        ])
      }
      return Promise.resolve([])
    })
    const wrapper = mountSuggest()
    const input = wrapper.find('input')

    // Liste fermée : la touche n'est pas consommée.
    await input.trigger('keydown', { key: 'ArrowDown' })
    await typeAndSuggest(wrapper, 'lyon')
    await input.trigger('keydown', { key: 'Tab' })
    expect(wrapper.find('ul').exists()).toBe(true)

    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('ul').exists()).toBe(false)

    await input.trigger('focus')
    await input.trigger('blur')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('resynchronise le label depuis la valeur du modèle', async () => {
    fetchMock.mockResolvedValue([])
    const wrapper = mountSuggest()

    // Valeur reconnue → libellé de la suggestion ; valeur brute sinon.
    await wrapper.setProps({ modelValue: 'zzz' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('zzz')
  })

  it('traduit une valeur de modèle connue en libellé de suggestion', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/departements') ? [{ code: '69', nom: 'Rhône' }] : [])
    )
    const wrapper = mountSuggest()

    await typeAndSuggest(wrapper, '69')

    await wrapper.setProps({ modelValue: '69' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Rhône (département 69)')

    await wrapper.setProps({ modelValue: undefined })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('émet undefined quand la saisie est vidée à la main', async () => {
    fetchMock.mockResolvedValue([])
    const wrapper = mountSuggest('Lyon')

    await wrapper.find('input').setValue('')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })

  it('ignore un Enter sans suggestion active', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/communes')) {
        return Promise.resolve([
          { nom: 'Lyon', codeDepartement: '69', centre: { coordinates: [4.83, 45.76] } }
        ])
      }
      return Promise.resolve([])
    })
    const wrapper = mountSuggest()
    const input = wrapper.find('input')

    await typeAndSuggest(wrapper, 'lyon')
    const emitsBefore = wrapper.emitted('update:modelValue')?.length ?? 0
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')?.length).toBe(emitsBefore)
  })

  it('monte sans valeur de modèle', () => {
    const wrapper = mount(LocationSuggest, {
      global: { stubs: { IconMapPin: true, IconClose: true } }
    })

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })
})
