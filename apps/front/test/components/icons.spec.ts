import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IconAccessibility from '~/components/icons/IconAccessibility.vue'
import IconAward from '~/components/icons/IconAward.vue'
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconClock from '~/components/icons/IconClock.vue'
import IconDownload from '~/components/icons/IconDownload.vue'
import IconFactory from '~/components/icons/IconFactory.vue'
import IconMail from '~/components/icons/IconMail.vue'
import IconMapPin from '~/components/icons/IconMapPin.vue'
import IconParking from '~/components/icons/IconParking.vue'
import IconPhone from '~/components/icons/IconPhone.vue'
import IconTimetable from '~/components/icons/IconTimetable.vue'

const icons = {
  IconAccessibility,
  IconAward,
  IconBuilding,
  IconClock,
  IconDownload,
  IconFactory,
  IconMail,
  IconMapPin,
  IconParking,
  IconPhone,
  IconTimetable
}

describe('icons', () => {
  it.each(Object.entries(icons))('%s renders an svg honoring the size prop', (_name, component) => {
    const wrapper = mount(component, { props: { size: 17 } })
    const svg = wrapper.find('svg')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('17')
    expect(svg.attributes('height')).toBe('17')
    expect(svg.attributes('aria-hidden')).toBe('true')
  })
})
