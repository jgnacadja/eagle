import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IconAccessibility from '~/components/icons/IconAccessibility.vue'
import IconAward from '~/components/icons/IconAward.vue'
import IconBook from '~/components/icons/IconBook.vue'
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'
import IconChevronLeft from '~/components/icons/IconChevronLeft.vue'
import IconChevronRight from '~/components/icons/IconChevronRight.vue'
import IconClock from '~/components/icons/IconClock.vue'
import IconDownload from '~/components/icons/IconDownload.vue'
import IconFactory from '~/components/icons/IconFactory.vue'
import IconFileOff from '~/components/icons/IconFileOff.vue'
import IconFilter from '~/components/icons/IconFilter.vue'
import IconLink from '~/components/icons/IconLink.vue'
import IconMail from '~/components/icons/IconMail.vue'
import IconMapPin from '~/components/icons/IconMapPin.vue'
import IconMapPinOff from '~/components/icons/IconMapPinOff.vue'
import IconMoreHorizontal from '~/components/icons/IconMoreHorizontal.vue'
import IconParking from '~/components/icons/IconParking.vue'
import IconPhone from '~/components/icons/IconPhone.vue'
import IconRefresh from '~/components/icons/IconRefresh.vue'
import IconSearchMinus from '~/components/icons/IconSearchMinus.vue'
import IconShare from '~/components/icons/IconShare.vue'
import IconTimetable from '~/components/icons/IconTimetable.vue'

const icons = {
  IconAccessibility,
  IconAward,
  IconBook,
  IconBuilding,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMoreHorizontal,
  IconDownload,
  IconFactory,
  IconFileOff,
  IconFilter,
  IconLink,
  IconMail,
  IconMapPin,
  IconMapPinOff,
  IconParking,
  IconPhone,
  IconRefresh,
  IconSearchMinus,
  IconShare,
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
