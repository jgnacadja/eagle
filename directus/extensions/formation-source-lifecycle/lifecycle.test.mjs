import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import hook from './index.js'
import { clearSourceArchiveOnEditorialStatusChange } from './lifecycle.js'

describe('clearSourceArchiveOnEditorialStatusChange', () => {
  it('clears the source marker when an editor changes status', () => {
    assert.deepEqual(clearSourceArchiveOnEditorialStatusChange({ status: 'draft' }), {
      status: 'draft',
      archived_by_source: false
    })
  })

  it('preserves the explicit marker written by source lifecycle automation', () => {
    const payload = { status: 'archived', archived_by_source: true }
    assert.equal(clearSourceArchiveOnEditorialStatusChange(payload), payload)
    assert.deepEqual(
      clearSourceArchiveOnEditorialStatusChange({ status: 'published', archived_by_source: false }),
      { status: 'published', archived_by_source: false }
    )
  })

  it('handles bulk payloads and unrelated field updates', () => {
    assert.deepEqual(
      clearSourceArchiveOnEditorialStatusChange([{ status: 'archived' }, { title: 'Edited' }]),
      [{ status: 'archived', archived_by_source: false }, { title: 'Edited' }]
    )
    const payload = { title: 'Edited' }
    assert.equal(clearSourceArchiveOnEditorialStatusChange(payload), payload)
  })

  it('registers on formation updates', () => {
    const registered = {}
    hook({ filter: (event, handler) => (registered[event] = handler) })
    assert.equal(registered['formations.items.update'], clearSourceArchiveOnEditorialStatusChange)
  })
})
