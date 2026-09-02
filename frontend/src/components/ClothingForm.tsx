import { useState, type CSSProperties, type FormEvent } from 'react'
import {
  CLOTHING_CATEGORIES,
  CLOTHING_CATEGORY_LABELS,
  describeWardrobeError,
  type ClothingCategory,
  type ClothingItem,
} from '../api/wardrobe'

export interface ClothingFormValues {
  name: string
  category: ClothingCategory
  image: File | null
}

interface ClothingFormProps {
  initial?: ClothingItem | null
  onSubmit: (values: ClothingFormValues) => Promise<void>
  onCancel?: () => void
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  marginBottom: 'var(--space-3)',
}

const labelStyle: CSSProperties = {
  fontSize: 'var(--size-sm)',
  color: 'var(--color-muted)',
}

const errorStyle: CSSProperties = {
  color: 'var(--color-danger)',
  fontSize: 'var(--size-sm)',
  marginTop: 'var(--space-1)',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-3)',
}

function ClothingForm({ initial, onSubmit, onCancel }: ClothingFormProps) {
  const isEdit = initial != null
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<ClothingCategory>(
    initial?.category ?? 'oberteile',
  )
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Bitte gib einen Namen für das Kleidungsstück ein.')
      return
    }
    if (!category) {
      setError('Bitte wähle eine Kategorie aus.')
      return
    }
    if (!isEdit && !image) {
      setError('Bitte wähle ein Bild aus.')
      return
    }
    if (image && image.size > MAX_IMAGE_SIZE) {
      setError('Das Bild ist zu groß. Bitte wähle ein Bild mit maximal 5 MB.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ name: trimmedName, category, image })
    } catch (submitError) {
      setError(describeWardrobeError(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={fieldStyle}>
        <label htmlFor="clothing-name" style={labelStyle}>
          Name
        </label>
        <input
          id="clothing-name"
          className="input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Schwarzes Abendkleid"
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="clothing-category" style={labelStyle}>
          Kategorie
        </label>
        <select
          id="clothing-category"
          className="input"
          value={category}
          onChange={(event) => setCategory(event.target.value as ClothingCategory)}
        >
          {CLOTHING_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CLOTHING_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {!isEdit && (
        <div style={fieldStyle}>
          <label htmlFor="clothing-image" style={labelStyle}>
            Bild
          </label>
          <input
            id="clothing-image"
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {error && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}

      <div style={actionsStyle}>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting
            ? 'Wird gespeichert…'
            : isEdit
              ? 'Speichern'
              : 'Anlegen'}
        </button>
        {onCancel && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}

export default ClothingForm
