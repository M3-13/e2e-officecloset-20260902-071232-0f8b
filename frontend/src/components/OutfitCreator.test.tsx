import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import OutfitCreator from './OutfitCreator'
import { getItems, createOutfit, updateOutfit, type Item } from '../api/outfits'

vi.mock('../api/outfits', () => ({
  getItems: vi.fn(),
  createOutfit: vi.fn(),
  updateOutfit: vi.fn(),
}))

const itemA: Item = {
  id: 1,
  name: 'Schwarzes Kleid',
  category: 'kleider',
  image_url: '',
}
const itemB: Item = {
  id: 2,
  name: 'Goldene Schuhe',
  category: 'schuhe',
  image_url: '',
}

describe('OutfitCreator', () => {
  beforeEach(() => {
    vi.mocked(getItems).mockResolvedValue([itemA, itemB])
    vi.mocked(createOutfit).mockReset()
    vi.mocked(updateOutfit).mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders available items and a name field', async () => {
    render(<OutfitCreator onSaved={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Schwarzes Kleid')).toBeTruthy()
    })
    expect(screen.getByText('Goldene Schuhe')).toBeTruthy()
    expect(screen.getByPlaceholderText('z. B. Abendgala')).toBeTruthy()
  })

  it('creates a new outfit with the selected items', async () => {
    vi.mocked(createOutfit).mockResolvedValue({
      id: 5,
      name: 'Abendgala',
      items: [itemA],
    })
    const onSaved = vi.fn()

    render(<OutfitCreator onSaved={onSaved} />)

    await waitFor(() => {
      expect(screen.getByText('Schwarzes Kleid')).toBeTruthy()
    })

    fireEvent.change(screen.getByPlaceholderText('z. B. Abendgala'), {
      target: { value: 'Abendgala' },
    })
    fireEvent.click(screen.getByText('Schwarzes Kleid'))
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => {
      expect(createOutfit).toHaveBeenCalledWith('Abendgala', [1])
    })
    expect(onSaved).toHaveBeenCalledWith({
      id: 5,
      name: 'Abendgala',
      items: [itemA],
    })
  })

  it('pre-fills name and selection when re-combining an existing outfit', async () => {
    const onSaved = vi.fn()

    render(
      <OutfitCreator
        outfit={{ id: 5, name: 'Abendgala', items: [itemA] }}
        onSaved={onSaved}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Schwarzes Kleid')).toBeTruthy()
    })

    const nameInput = screen.getByPlaceholderText(
      'z. B. Abendgala',
    ) as HTMLInputElement
    expect(nameInput.value).toBe('Abendgala')

    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => {
      expect(updateOutfit).toHaveBeenCalledWith(5, 'Abendgala', [1])
    })
  })

  it('shows a validation error when no items are selected', async () => {
    render(<OutfitCreator onSaved={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Schwarzes Kleid')).toBeTruthy()
    })

    fireEvent.change(screen.getByPlaceholderText('z. B. Abendgala'), {
      target: { value: 'Abendgala' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => {
      expect(
        screen.getByText('Bitte wähle mindestens ein Kleidungsstück aus.'),
      ).toBeTruthy()
    })
    expect(createOutfit).not.toHaveBeenCalled()
  })
})
