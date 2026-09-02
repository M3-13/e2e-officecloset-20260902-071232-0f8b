import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  describeWardrobeError,
} from './wardrobe'

describe('wardrobe API', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('getItems requests /api/wardrobe/items without a category', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await getItems()

    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items')
  })

  it('getItems appends the category query parameter', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await getItems('schuhe')

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/wardrobe/items?category=schuhe',
    )
  })

  it('createItem posts a FormData body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          name: 'Schuhe',
          category: 'schuhe',
          image_url: '/uploads/x.png',
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const data = new FormData()
    data.append('name', 'Schuhe')
    data.append('category', 'schuhe')
    data.append('image', new File(['x'], 'x.png'))
    await createItem(data)

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('updateItem PATCHes the item id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 5,
          name: 'Kleid',
          category: 'kleider',
          image_url: '/uploads/x.png',
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await updateItem(5, { name: 'Kleid' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items/5')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('PATCH')
  })

  it('deleteItem DELETEs the item id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteItem(9)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items/9')
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('DELETE')
  })
})

describe('describeWardrobeError', () => {
  it('maps a 413 status to a helpful message', () => {
    expect(describeWardrobeError({ status: 413 })).toContain('zu groß')
  })

  it('maps a 404 status to a not-found message', () => {
    expect(describeWardrobeError({ status: 404 })).toContain('nicht gefunden')
  })

  it('falls back to the error message', () => {
    expect(describeWardrobeError(new Error('Ungültige Daten'))).toBe(
      'Ungültige Daten',
    )
  })

  it('provides a generic fallback', () => {
    expect(describeWardrobeError(undefined)).toContain('schiefgelaufen')
  })
})
