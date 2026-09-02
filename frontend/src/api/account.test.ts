import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteAccount } from './account'

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a DELETE request to /api/auth/me', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteAccount()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/me')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('DELETE')
  })
})
