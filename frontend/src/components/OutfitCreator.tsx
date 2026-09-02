import { useEffect, useState, type FormEvent } from 'react'
import {
  createOutfit,
  getItems,
  updateOutfit,
  type Item,
  type Outfit,
} from '../api/outfits'
import '../styles/outfits.css'

interface OutfitCreatorProps {
  outfit?: Outfit | null
  onSaved: (outfit: Outfit) => void
  onCancel?: () => void
}

function OutfitCreator({ outfit, onSaved, onCancel }: OutfitCreatorProps) {
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [name, setName] = useState('')
  const [loadingItems, setLoadingItems] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingItems(true)
    getItems()
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingItems(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (outfit) {
      setName(outfit.name)
      setSelected(new Set(outfit.items.map((item) => item.id)))
    } else {
      setName('')
      setSelected(new Set())
    }
  }, [outfit])

  function toggleItem(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Bitte gib deinem Outfit einen Namen.')
      return
    }
    if (selected.size === 0) {
      setError('Bitte wähle mindestens ein Kleidungsstück aus.')
      return
    }

    setSaving(true)
    setError(null)
    const item_ids = Array.from(selected)
    try {
      const saved = outfit
        ? await updateOutfit(outfit.id, trimmed, item_ids)
        : await createOutfit(trimmed, item_ids)
      onSaved(saved)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2 className="outfit-creator-title">
        {outfit ? 'Outfit neu kombinieren' : 'Neues Outfit kombinieren'}
      </h2>

      <label className="field">
        <span className="field-label">Name</span>
        <input
          className="input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Abendgala"
        />
      </label>

      <div className="field">
        <span className="field-label">Kleidungsstücke</span>
        {loadingItems ? (
          <p className="page-loading">Lädt Kleidungsstücke…</p>
        ) : items.length === 0 ? (
          <p className="outfit-creator-empty">
            Noch keine Kleidungsstücke vorhanden. Lege zuerst etwas in deiner
            Garderobe an.
          </p>
        ) : (
          <div className="item-grid" role="group" aria-label="Kleidungsstücke">
            {items.map((item) => {
              const isSelected = selected.has(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    isSelected ? 'item-tile item-tile-selected' : 'item-tile'
                  }
                  aria-pressed={isSelected}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.image_url ? (
                    <img
                      className="item-tile-image"
                      src={item.image_url}
                      alt={item.name}
                    />
                  ) : (
                    <div className="item-tile-placeholder" aria-hidden="true" />
                  )}
                  <span className="item-tile-name">{item.name}</span>
                  <span className="item-tile-category">{item.category}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error ? (
        <p className="outfit-creator-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="outfit-creator-actions">
        <button className="btn" type="submit" disabled={saving || loadingItems}>
          {saving ? 'Speichert…' : 'Speichern'}
        </button>
        {onCancel ? (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Abbrechen
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default OutfitCreator
