import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '~/components/ui/navigation-menu'

function createMenu(triggerVariant?: string) {
  return defineComponent({
    components: {
      NavigationMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuList,
      NavigationMenuTrigger
    },
    setup: () => ({ triggerVariant }),
    template: `
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger :variant="triggerVariant">Formations</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/formations">Catalogue</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/centres">Nos centres</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `
  })
}

describe('ui/NavigationMenu', () => {
  it('rend la liste, les items et le trigger avec son icône', () => {
    const wrapper = mount(createMenu())

    const trigger = wrapper.find('button')
    expect(trigger.text()).toContain('Formations')
    expect(trigger.find('svg').exists()).toBe(true)
    expect(wrapper.find('ul').classes()).toContain('list-none')
    expect(wrapper.find('a[href="/centres"]').exists()).toBe(true)
  })

  it('applique le variant header au trigger', () => {
    const wrapper = mount(createMenu('header'))

    expect(wrapper.find('button').classes()).toContain('font-semibold')
    expect(wrapper.find('button').classes()).toContain('border-b-2')
  })

  it('ouvre le contenu du menu au clic sur le trigger', async () => {
    const wrapper = mount(createMenu(), { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('button').attributes('data-state')).toBe('open')
  })
})

describe('navigationMenuTriggerStyle', () => {
  it('retombe sur le variant default', () => {
    expect(navigationMenuTriggerStyle()).toContain('h-9')
    expect(navigationMenuTriggerStyle({ variant: 'header' })).toContain('text-primary')
  })
})
