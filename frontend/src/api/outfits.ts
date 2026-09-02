import { apiFetch } from './client'

export type Category =
  | 'oberteile'
  | 'unterteile'
  | 'kleider'
  | 'schuhe'
  | 'accessoires'

export interface Item {
  id: number
  name: string
  category: Category
  image_url: string
}

export interface Outfit {
  id: number
  name: string
  items: Item[]
}

export function getItems(category?: Category): Promise<Item[]> {
  const path = category
    ? `/api/wardrobe/items?category=${category}`
    : '/api/wardrobe/items'
  return apiFetch<Item[]>(path)
}

export function getOutfits(): Promise<Outfit[]> {
  return apiFetch<Outfit[]>('/api/outfits')
}

export function createOutfit(name: string, item_ids: number[]): Promise<Outfit> {
  return apiFetch<Outfit>('/api/outfits', {
    method: 'POST',
    body: JSON.stringify({ name, item_ids }),
  })
}

export function getOutfit(id: number): Promise<Outfit> {
  return apiFetch<Outfit>(`/api/outfits/${id}`)
}

export function updateOutfit(
  id: number,
  name: string,
  item_ids: number[],
): Promise<Outfit> {
  return apiFetch<Outfit>(`/api/outfits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, item_ids }),
  })
}

export function deleteOutfit(id: number): Promise<void> {
  return apiFetch<void>(`/api/outfits/${id}`, { method: 'DELETE' })
}
