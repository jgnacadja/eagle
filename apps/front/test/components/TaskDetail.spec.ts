import { mount } from '@vue/test-utils'
import TaskDetail from '~/components/TaskDetail.vue'
import type { Task } from '~/stores/tasks'

const mockTask: Task = {
  id: 'task-uuid-1',
  shortDescription: 'Ma tâche importante',
  longDescription: null,
  dueDate: new Date('2026-07-15').toISOString(),
  completedAt: null,
  listId: 'list-uuid-1',
  createdAt: new Date('2026-01-10').toISOString(),
  updatedAt: new Date('2026-01-10').toISOString()
}

const mockTaskB: Task = {
  ...mockTask,
  id: 'task-uuid-2',
  shortDescription: 'Autre tâche'
}

const mountDetail = (task: Task | null = mockTask, deleting = false, error: string | null = null) =>
  mount(TaskDetail, {
    props: { task, deleting, error },
    global: { stubs: { Teleport: true, ConfirmModal: true, Transition: false } }
  })

describe('TaskDetail', () => {
  describe('display', () => {
    it('does not render the panel if task is null', () => {
      const wrapper = mountDetail(null)
      expect(wrapper.find('[data-testid="detail-panel"]').exists()).toBe(false)
    })

    it('renders the panel if task is defined', () => {
      const wrapper = mountDetail()
      expect(wrapper.find('[data-testid="detail-panel"]').exists()).toBe(true)
    })

    it('displays the short description', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('Ma tâche importante')
    })

    it('displays the due date', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('juil')
    })

    it('displays the creation date', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('janv')
    })

    it('displays the long description if present', () => {
      const task = { ...mockTask, longDescription: 'Détail complet de la tâche' }
      const wrapper = mountDetail(task)
      expect(wrapper.text()).toContain('Détail complet de la tâche')
    })

    it('does not display the long description section if absent', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).not.toContain('Description')
    })

    it('displays the error message if error is set', () => {
      const wrapper = mountDetail(mockTask, false, 'Impossible de supprimer la tâche.')
      expect(wrapper.find('[data-testid="delete-error"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Impossible de supprimer la tâche.')
    })

    it('does not display an error message if error is null', () => {
      const wrapper = mountDetail()
      expect(wrapper.find('[data-testid="delete-error"]').exists()).toBe(false)
    })
  })

  describe('close', () => {
    it('emits close on close button click', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="close-btn"]').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('delete', () => {
    it('shows the confirmation modal on delete button click', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)
    })

    it('hides the modal on cancel', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      wrapper.findComponent({ name: 'ConfirmModal' }).vm.$emit('cancel')
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })

    it('emits delete with the task id on confirm', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      wrapper.findComponent({ name: 'ConfirmModal' }).vm.$emit('confirm')
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockTask.id])
    })

    it('resets the modal when task becomes null', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)

      await wrapper.setProps({ task: null })
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })

    it('resets the modal when task changes to another task', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)

      await wrapper.setProps({ task: mockTaskB })
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })
  })
})
