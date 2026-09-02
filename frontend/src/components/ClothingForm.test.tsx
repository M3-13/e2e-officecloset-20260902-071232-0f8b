import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ClothingForm from './ClothingForm'

afterEach(cleanup)

describe('ClothingForm', () => {
  it('shows a validation message when the name is missing', async () => {
    const onSubmit = vi.fn()
    render(<ClothingForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    expect(await screen.findByText(/Namen/i)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows a validation message when the image is missing', async () => {
    const onSubmit = vi.fn()
    render(<ClothingForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Kleid' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    expect(await screen.findByText(/wähle ein Bild/i)).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ClothingForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Kleid' },
    })
    fireEvent.change(screen.getByLabelText('Kategorie'), {
      target: { value: 'kleider' },
    })
    fireEvent.change(screen.getByLabelText('Bild'), {
      target: { files: [new File(['x'], 'x.png')] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const values = onSubmit.mock.calls[0][0] as {
      name: string
      category: string
      image: File
    }
    expect(values.name).toBe('Kleid')
    expect(values.category).toBe('kleider')
    expect(values.image).toBeInstanceOf(File)
  })
})
