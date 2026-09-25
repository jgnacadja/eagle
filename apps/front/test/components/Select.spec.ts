import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants
} from '~/components/ui/select'

async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 200 && !ok(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
  }
}

function createSelect(triggerVariant?: string) {
  return defineComponent({
    components: { UiSelect: Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
    setup() {
      return { value: ref(''), triggerVariant }
    },
    template: `
      <UiSelect v-model="value">
        <SelectTrigger :variant="triggerVariant">
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </UiSelect>
    `
  })
}

describe('ui/Select', () => {
  it('rend le trigger avec le placeholder et l’icône', () => {
    const wrapper = mount(createSelect())
    const trigger = wrapper.find('button')

    expect(trigger.text()).toContain('Choisir une option')
    expect(trigger.find('svg').exists()).toBe(true)
    expect(trigger.classes()).toContain('h-9')
  })

  it('applique le variant pill au trigger', () => {
    const wrapper = mount(createSelect('pill'))

    expect(wrapper.find('button').classes()).toEqual(
      expect.arrayContaining(['rounded-full', 'border-outline', 'h-control'])
    )
  })

  it('ouvre la liste des options au pointerdown', async () => {
    const wrapper = mount(createSelect(), { attachTo: document.body })
    const trigger = wrapper.find('button')

    // reka-ui ouvre la liste au pointerdown, pas au click.
    await trigger.trigger('pointerdown', { button: 0 })
    await waitUntil(() => Boolean(document.body.textContent?.includes('Option A')))

    expect(trigger.attributes('data-state')).toBe('open')
    const options = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].map(
      (el) => el.textContent
    )
    expect(options).toEqual(['Option A', 'Option B'])
  })
})

describe('selectTriggerVariants', () => {
  it('retombe sur le variant default', () => {
    expect(selectTriggerVariants()).toContain('h-9')
    expect(selectTriggerVariants({ variant: 'surface' })).toContain('bg-surface')
  })
})
