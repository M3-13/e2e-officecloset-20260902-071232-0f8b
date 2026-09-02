import { apiFetch } from './client'

export type ClothingCategory =
  | 'oberteile'
  | 'unterteile'
  | 'kleider'
  | 'schuhe'
  | 'accessoires'

export interface ClothingItem {
  id: number
  name: string
  category: ClothingCategory
  image_url: string
}

export interface ClothingItemUpdate {
  name?: string
  category?: ClothingCategory
}

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  'oberteile',
  'unterteile',
  'kleider',
  'schuhe',
  'accessoires',
]

export const CLOTHING_CATEGORY_LABELS: Record<ClothingCategory, string> = {
  oberteile: 'Oberteile',
  unterteile: 'Unterteile',
  kleider: 'Kleider',
  schuhe: 'Schuhe',
  accessoires: 'Accessoires',
}

export function getItems(category?: ClothingCategory): Promise<ClothingItem[]> {
  const search = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch<ClothingItem[]>('/api/wardrobe/items' + search)
}

export function createItem(data: FormData): Promise<ClothingItem> {
  return apiFetch<ClothingItem>('/api/wardrobe/items', {
    method: 'POST',
    body: data,
  })
}

export function updateItem(
  id: number,
  data: ClothingItemUpdate,
): Promise<ClothingItem> {
  return apiFetch<ClothingItem>(`/api/wardrobe/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteItem(id: number): Promise<void> {
  return apiFetch<void>(`/api/wardrobe/items/${id}`, {
    method: 'DELETE',
  })
}

export function describeWardrobeError(error: unknown): string {
  const status = (error as { status?: number } | null)?.status

  if (status === 413) {
    return 'Das Bild ist zu groß. Bitte wähle ein Bild mit maximal 5 MB.'
  }

  const message = (error as { message?: string } | null)?.message
  if (message) {
    return message
  }

  if (status === 404) {
    return 'Das Kleidungsstück wurde nicht gefunden.'
  }
  if (status === 401) {
    return 'Du bist nicht angemeldet. Bitte melde dich an.'
  }

  return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
}
