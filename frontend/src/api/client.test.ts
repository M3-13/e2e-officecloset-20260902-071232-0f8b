import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, getToken } from './client'

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('requests the given path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/health')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/health')
  })

  it('sets the Authorization header when a token is present', async () => {
    localStorage.setItem('token', 'abc123')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/health')

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer abc123')
  })

  it('does not set the Authorization header without a token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/health')

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBeNull()
  })

  it('throws an Error carrying the detail on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Ungültige Daten' }), { status: 400 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/api/x')).rejects.toThrow('Ungültige Daten')
  })

  it('returns undefined for a 204 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiFetch('/api/x')).resolves.toBeUndefined()
  })
})

describe('getToken', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads the token from localStorage', () => {
    localStorage.setItem('token', 'token-value')
    expect(getToken()).toBe('token-value')
  })

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })
})
