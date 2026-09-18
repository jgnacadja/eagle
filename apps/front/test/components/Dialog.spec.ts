import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'

async function waitUntil(ok: () => boolean) {
  for (let i = 0; i < 200 && !ok(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()
  }
}

function createDialogHost(scroll = false) {
  return defineComponent({
    components: {
      UiDialog: Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogScrollContent,
      DialogTitle,
      DialogTrigger
    },
    setup() {
      return { open: ref(false), scroll }
    },
    template: `
      <UiDialog v-model:open="open">
        <DialogTrigger>Ouvrir le dialogue</DialogTrigger>
        <DialogScrollContent v-if="scroll">
          <DialogHeader>
            <DialogTitle>Titre du dialogue</DialogTitle>
            <DialogDescription>Description du dialogue</DialogDescription>
          </DialogHeader>
          <DialogFooter><button type="button">Action</button></DialogFooter>
        </DialogScrollContent>
        <DialogContent v-else>
          <DialogHeader>
            <DialogTitle>Titre du dialogue</DialogTitle>
            <DialogDescription>Description du dialogue</DialogDescription>
          </DialogHeader>
          <DialogFooter><button type="button">Action</button></DialogFooter>
        </DialogContent>
      </UiDialog>
    `
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ui/Dialog', () => {
  it('ouvre le contenu téléporté au clic sur le trigger', async () => {
    const wrapper = mount(createDialogHost(), { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Titre du dialogue')))

    expect(document.body.textContent).toContain('Description du dialogue')
    expect(document.body.textContent).toContain('Action')
    // Overlay + bouton Fermer injectés par DialogContent.
    expect(document.body.querySelector('.dialog-overlay')).not.toBeNull()
    expect(document.body.querySelector('button[aria-label="Fermer"]')).not.toBeNull()
  })

  it('referme le dialogue via le bouton Fermer', async () => {
    const wrapper = mount(createDialogHost(), { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Titre du dialogue')))
    const close = document.body.querySelector<HTMLElement>('button[aria-label="Fermer"]')
    expect(close).not.toBeNull()
    await new DOMWrapper(close!).trigger('click')
    await waitUntil(() => !document.body.textContent?.includes('Titre du dialogue'))
  })

  it('rend aussi le contenu via DialogScrollContent', async () => {
    const wrapper = mount(createDialogHost(true), { attachTo: document.body })

    await wrapper.find('button').trigger('click')
    await waitUntil(() => Boolean(document.body.textContent?.includes('Titre du dialogue')))

    expect(document.body.querySelector('.dialog-scroll-content')).not.toBeNull()
  })
})
