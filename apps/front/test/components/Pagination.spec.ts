import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, it, expect } from 'vitest'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious
} from '~/components/ui/pagination'

const stubs = {
  IconChevronLeft: { template: '<svg data-testid="chevron-left" />' },
  IconChevronRight: { template: '<svg data-testid="chevron-right" />' },
  IconMoreHorizontal: { template: '<svg data-testid="more-horizontal" />' }
}

function createWrapper(total = 30) {
  return defineComponent({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationFirst,
      PaginationItem,
      PaginationLast,
      PaginationNext,
      PaginationPrevious
    },
    setup() {
      const page = ref(1)
      return { page }
    },
    template: `
      <Pagination
        v-model:page="page"
        :total="${total}"
        :items-per-page="10"
        :sibling-count="1"
        show-edges
        data-testid="pagination-root"
      >
        <PaginationContent v-slot="{ items }" class="gap-sm">
          <PaginationFirst data-testid="first" />
          <PaginationPrevious data-testid="previous" />
          <template v-for="item in items" :key="item.value">
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === page"
              data-testid="item"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else-if="item.type === 'ellipsis'" data-testid="ellipsis" />
          </template>
          <PaginationNext data-testid="next" />
          <PaginationLast data-testid="last" />
        </PaginationContent>
      </Pagination>
    `
  })
}

describe('Pagination', () => {
  it('renders a nav with pagination role', () => {
    const Test = createWrapper()
    const wrapper = mount(Test, { global: { stubs } })

    const root = wrapper.find('[data-testid="pagination-root"]')
    expect(root.exists()).toBe(true)
    expect(root.element.tagName).toBe('NAV')
  })

  it('renders one button per page', () => {
    const Test = createWrapper(30)
    const wrapper = mount(Test, { global: { stubs } })

    const items = wrapper.findAll('[data-testid="item"]')
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.text())).toEqual(['1', '2', '3'])
  })

  it('marks the first page as active by default', () => {
    const Test = createWrapper()
    const wrapper = mount(Test, { global: { stubs } })

    const items = wrapper.findAll('[data-testid="item"]')
    const firstItem = items.at(0)
    expect(firstItem).toBeDefined()
    expect(firstItem!.classes()).toContain('bg-primary')
    expect(firstItem!.classes()).toContain('text-paper')
  })

  it('disables first and previous buttons on the first page', () => {
    const Test = createWrapper()
    const wrapper = mount(Test, { global: { stubs } })

    expect(wrapper.find('[data-testid="first"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="previous"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="next"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="last"]').attributes('disabled')).toBeUndefined()
  })

  it('navigates to the selected page when a page item is clicked', async () => {
    const Test = createWrapper()
    const wrapper = mount(Test, { global: { stubs } })

    const items = wrapper.findAll('[data-testid="item"]')
    const lastItem = items.at(2)
    expect(lastItem).toBeDefined()
    await lastItem!.trigger('click')
    await nextTick()

    expect(lastItem!.classes()).toContain('bg-primary')
    expect(wrapper.find('[data-testid="first"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="last"]').attributes('disabled')).toBeDefined()
  })

  it('renders ellipsis for large page counts', () => {
    const Test = createWrapper(100)
    const wrapper = mount(Test, { global: { stubs } })

    expect(wrapper.findAll('[data-testid="ellipsis"]')).not.toHaveLength(0)
  })
})
