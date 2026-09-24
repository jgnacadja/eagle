import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import IconAccessibility from '~/components/icons/IconAccessibility.vue'
import IconAward from '~/components/icons/IconAward.vue'
import IconBadgeCheck from '~/components/icons/IconBadgeCheck.vue'
import IconBook from '~/components/icons/IconBook.vue'
import IconBriefcase from '~/components/icons/IconBriefcase.vue'
import IconBuilding from '~/components/icons/IconBuilding.vue'
import IconCalendar from '~/components/icons/IconCalendar.vue'
import IconCheck from '~/components/icons/IconCheck.vue'
import IconChevronDown from '~/components/icons/IconChevronDown.vue'
import IconChevronLeft from '~/components/icons/IconChevronLeft.vue'
import IconChevronRight from '~/components/icons/IconChevronRight.vue'
import IconChevronUp from '~/components/icons/IconChevronUp.vue'
import IconClock from '~/components/icons/IconClock.vue'
import IconClose from '~/components/icons/IconClose.vue'
import IconDownload from '~/components/icons/IconDownload.vue'
import IconFactory from '~/components/icons/IconFactory.vue'
import IconFileOff from '~/components/icons/IconFileOff.vue'
import IconFileText from '~/components/icons/IconFileText.vue'
import IconFilter from '~/components/icons/IconFilter.vue'
import IconGlobe from '~/components/icons/IconGlobe.vue'
import IconHardHat from '~/components/icons/IconHardHat.vue'
import IconLayoutGrid from '~/components/icons/IconLayoutGrid.vue'
import IconLink from '~/components/icons/IconLink.vue'
import IconList from '~/components/icons/IconList.vue'
import IconLocate from '~/components/icons/IconLocate.vue'
import IconMail from '~/components/icons/IconMail.vue'
import IconMap from '~/components/icons/IconMap.vue'
import IconMapPin from '~/components/icons/IconMapPin.vue'
import IconMapPinOff from '~/components/icons/IconMapPinOff.vue'
import IconMinus from '~/components/icons/IconMinus.vue'
import IconMoreHorizontal from '~/components/icons/IconMoreHorizontal.vue'
import IconParking from '~/components/icons/IconParking.vue'
import IconPhone from '~/components/icons/IconPhone.vue'
import IconPlus from '~/components/icons/IconPlus.vue'
import IconRefresh from '~/components/icons/IconRefresh.vue'
import IconSearch from '~/components/icons/IconSearch.vue'
import IconSearchMinus from '~/components/icons/IconSearchMinus.vue'
import IconShare from '~/components/icons/IconShare.vue'
import IconSmartphone from '~/components/icons/IconSmartphone.vue'
import IconSparkle from '~/components/icons/IconSparkle.vue'
import IconTimetable from '~/components/icons/IconTimetable.vue'
import IconUser from '~/components/icons/IconUser.vue'
import IconUsers from '~/components/icons/IconUsers.vue'

const icons = {
  IconAccessibility,
  IconAward,
  IconBadgeCheck,
  IconBook,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClock,
  IconClose,
  IconMoreHorizontal,
  IconDownload,
  IconFactory,
  IconFileOff,
  IconFileText,
  IconFilter,
  IconGlobe,
  IconHardHat,
  IconLayoutGrid,
  IconLink,
  IconList,
  IconLocate,
  IconMail,
  IconMap,
  IconMapPin,
  IconMapPinOff,
  IconMinus,
  IconParking,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSearchMinus,
  IconShare,
  IconSmartphone,
  IconSparkle,
  IconTimetable,
  IconUser,
  IconUsers
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
