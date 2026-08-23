import { mount } from '@vue/test-utils'
import TaskCard from '~/components/TaskCard.vue'
import type { Task } from '~/stores/tasks'

const mockTask: Task = {
  id: 'task-uuid-1',
  shortDescription: 'Ma tâche',
  longDescription: null,
  dueDate: new Date('2026-07-15').toISOString(),
  completedAt: null,
  listId: 'list-uuid-1',
  createdAt: new Date('2026-01-10').toISOString(),
  updatedAt: new Date('2026-01-10').toISOString()
}

describe('TaskCard', () => {
  describe('display', () => {
    it('displays the short description', () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).toContain('Ma tâche')
    })

    it('displays the formatted due date', () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).toContain('juil')
    })

    it('displays the long description if present', () => {
      const task = { ...mockTask, longDescription: 'Description détaillée' }
      const wrapper = mount(TaskCard, { props: { task } })
      expect(wrapper.text()).toContain('Description détaillée')
    })

    it('does not display the long description if absent', () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).not.toContain('Description')
    })

    it('applies opacity-70 if the task is completed', () => {
      const task = { ...mockTask, completedAt: new Date().toISOString() }
      const wrapper = mount(TaskCard, { props: { task } })
      expect(wrapper.find('div').classes()).toContain('opacity-70')
    })

    it('does not apply opacity-70 if the task is active', () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.find('div').classes()).not.toContain('opacity-70')
    })
  })

  describe('completion button', () => {
    it('emits complete on click if the task is active', async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('complete')?.[0]).toEqual([mockTask.id])
    })

    it('emits reactivate on click if the task is completed', async () => {
      const task = { ...mockTask, completedAt: new Date().toISOString() }
      const wrapper = mount(TaskCard, { props: { task } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('reactivate')?.[0]).toEqual([task.id])
    })

    it('does not emit select on button click (stop propagation)', async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('select')).toBeUndefined()
    })
  })

  describe('card selection', () => {
    it('emits select with the task on card click', async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('div').trigger('click')
      expect(wrapper.emitted('select')?.[0]).toEqual([mockTask])
    })
  })
})
