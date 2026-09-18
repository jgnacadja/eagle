import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  accordionItemVariants,
  accordionTriggerVariants
} from '~/components/ui/accordion'

function createAccordion(props: { itemVariant?: string; triggerVariant?: string } = {}) {
  return defineComponent({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup: () => ({
      itemVariant: props.itemVariant ?? 'default',
      triggerVariant: props.triggerVariant ?? 'default'
    }),
    template: `
      <Accordion type="single" collapsible>
        <AccordionItem value="a" :variant="itemVariant">
          <AccordionTrigger :variant="triggerVariant">Titre section</AccordionTrigger>
          <AccordionContent>Contenu section</AccordionContent>
        </AccordionItem>
      </Accordion>
    `
  })
}

describe('ui/Accordion', () => {
  it('rend le trigger avec son icône et le contenu replié', () => {
    const wrapper = mount(createAccordion())
    const trigger = wrapper.find('button')

    expect(trigger.text()).toContain('Titre section')
    expect(trigger.find('svg').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Contenu section')
  })

  it('déplie le contenu au clic sur le trigger', async () => {
    const wrapper = mount(createAccordion())

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Contenu section')
  })

  it('applique les classes de variant au trigger et à l’item', () => {
    const wrapper = mount(createAccordion({ itemVariant: 'submenu', triggerVariant: 'panel' }))

    expect(wrapper.find('button').classes()).toContain('uppercase')
    expect(wrapper.find('[data-state]').classes()).toContain('rounded-md')
  })

  it('fusionne les classes du slot icon', () => {
    const Host = defineComponent({
      components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
      template: `
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>
              Titre
              <template #icon><span data-testid="custom-icon" /></template>
            </AccordionTrigger>
            <AccordionContent>x</AccordionContent>
          </AccordionItem>
        </Accordion>
      `
    })
    const wrapper = mount(Host)

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    expect(wrapper.find('button svg').exists()).toBe(false)
  })
})

describe('accordion variants', () => {
  it('accordionTriggerVariants retombe sur le variant default', () => {
    expect(accordionTriggerVariants()).toContain('font-medium')
    expect(accordionTriggerVariants({ variant: 'menu' })).toContain('text-h3')
  })

  it('accordionItemVariants retombe sur le variant default', () => {
    expect(accordionItemVariants()).toContain('border-b')
    expect(accordionItemVariants({ variant: 'menu' })).toContain('border-b-0')
  })
})
