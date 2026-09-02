import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  describeWardrobeError,
  CLOTHING_CATEGORIES,
  CLOTHING_CATEGORY_LABELS,
  type ClothingCategory,
  type ClothingItem,
} from '../api/wardrobe'
import ClothingForm, { type ClothingFormValues } from '../components/ClothingForm'

const filterBarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-1)',
  margin: 'var(--space-4) 0',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-4)',
}

const tileStyle: CSSProperties = {
  position: 'relative',
  padding: 0,
  overflow: 'hidden',
  aspectRatio: '1 / 1',
  display: 'flex',
  flexDirection: 'column',
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: 'var(--space-5) var(--space-2) var(--space-2)',
  background:
    'linear-gradient(to top, rgba(14, 11, 16, 0.85), rgba(14, 11, 16, 0))',
  color: 'var(--color-fg)',
  fontSize: 'var(--size-sm)',
}

const tileActionsStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  gap: 'var(--space-1)',
  padding: 'var(--space-2)',
  backgroundColor: 'var(--color-surface)',
  borderTop: '1px solid var(--color-border)',
}

const errorStyle: CSSProperties = {
  color: 'var(--color-danger)',
  fontSize: 'var(--size-sm)',
  marginTop: 'var(--space-3)',
}

const formCardStyle: CSSProperties = {
  maxWidth: 480,
  marginTop: 'var(--space-3)',
}

function Wardrobe() {
  const { token } = useAuth()

  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<ClothingCategory | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ClothingItem | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async (activeCategory: ClothingCategory | null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getItems(activeCategory ?? undefined)
      setItems(data)
    } catch (loadError) {
      setError(describeWardrobeError(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    void load(category)
  }, [token, category, reloadKey, load])

  async function handleCreate(values: ClothingFormValues) {
    const data = new FormData()
    data.append('name', values.name)
    data.append('category', values.category)
    if (values.image) {
      data.append('image', values.image)
    }
    await createItem(data)
    setFormOpen(false)
    setCategory(null)
    setReloadKey((key) => key + 1)
  }

  async function handleUpdate(values: ClothingFormValues) {
    if (!editing) {
      return
    }
    await updateItem(editing.id, {
      name: values.name,
      category: values.category,
    })
    setEditing(null)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(item: ClothingItem) {
    await deleteItem(item.id)
    setReloadKey((key) => key + 1)
  }

  return (
    <section className="page">
      <h1 className="page-title">Garderobe</h1>
      <p className="page-lead">
        Deine Kleidungsstücke auf einen Blick – filtere, lege an, bearbeite und
        lösche.
      </p>

      <div style={filterBarStyle}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCategory(null)}
          style={
            category === null
              ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }
              : undefined
          }
        >
          Alle
        </button>
        {CLOTHING_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            className="btn btn-ghost"
            onClick={() => setCategory(value)}
            style={
              category === value
                ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                : undefined
            }
          >
            {CLOTHING_CATEGORY_LABELS[value]}
          </button>
        ))}
      </div>

      {!editing && (
        <button
          type="button"
          className="btn"
          onClick={() => setFormOpen((open) => !open)}
        >
          {formOpen ? 'Formular schließen' : 'Neues Kleidungsstück anlegen'}
        </button>
      )}

      {formOpen && !editing && (
        <div className="card" style={formCardStyle}>
          <ClothingForm
            onSubmit={handleCreate}
            onCancel={() => setFormOpen(false)}
          />
        </div>
      )}

      {editing && (
        <div className="card" style={formCardStyle}>
          <h2 className="page-lead" style={{ margin: 0 }}>
            „{editing.name}“ bearbeiten
          </h2>
          <ClothingForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {error && (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      )}

      {loading && <div className="page-loading">Lädt…</div>}

      {!loading && !error && items.length === 0 && (
        <p className="page-lead">
          Noch keine Kleidungsstücke vorhanden. Lege dein erstes an!
        </p>
      )}

      {!loading && items.length > 0 && (
        <div style={gridStyle}>
          {items.map((item) => (
            <article key={item.id} className="card" style={tileStyle}>
              <img src={item.image_url} alt={item.name} style={imageStyle} />
              <div style={overlayStyle}>
                <span>{item.name}</span>
                <br />
                <span style={{ color: 'var(--color-muted)' }}>
                  {CLOTHING_CATEGORY_LABELS[item.category]}
                </span>
              </div>
              <div style={tileActionsStyle}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(item)}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(item)}
                >
                  Löschen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Wardrobe
