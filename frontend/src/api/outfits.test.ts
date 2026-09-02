import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getItems,
  getOutfits,
  createOutfit,
  getOutfit,
  updateOutfit,
  deleteOutfit,
} from './outfits'

const item = { id: 1, name: 'Schwarzes Kleid', category: 'kleider', image_url: '/uploads/1.png' }
const outfit = { id: 10, name: 'Abendgala', items: [item] }

describe('outfits API', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('getItems requests the wardrobe items endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([item]), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getItems()

    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items')
  })

  it('getItems appends a category query parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([item]), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getItems('kleider')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/wardrobe/items?category=kleider')
  })

  it('getOutfits requests the outfits endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([outfit]), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOutfits()

    expect(fetchMock.mock.calls[0][0]).toBe('/api/outfits')
    expect(result).toEqual([outfit])
  })

  it('createOutfit posts name and item_ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(outfit), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await createOutfit('Abendgala', [1, 2])

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/outfits')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Abendgala',
      item_ids: [1, 2],
    })
  })

  it('getOutfit requests a single outfit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(outfit), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getOutfit(10)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/outfits/10')
    expect(result).toEqual(outfit)
  })

  it('updateOutfit patches name and item_ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(outfit), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await updateOutfit(10, 'Gala', [1])

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/outfits/10')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Gala', item_ids: [1] })
  })

  it('deleteOutfit deletes a single outfit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await deleteOutfit(10)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/outfits/10')
    expect(init.method).toBe('DELETE')
  })
})
