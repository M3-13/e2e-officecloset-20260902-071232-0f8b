import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OutfitCreator from '../components/OutfitCreator'
import { useAuth } from '../context/AuthContext'
import {
  deleteOutfit,
  getOutfit,
  getOutfits,
  type Outfit,
} from '../api/outfits'
import '../styles/outfits.css'

function isUnauthorized(err: unknown): boolean {
  return (err as { status?: number }).status === 401
}

function Outfits() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [detail, setDetail] = useState<Outfit | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Outfit | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOutfits(await getOutfits())
    } catch (err) {
      if (isUnauthorized(err)) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    void load()
  }, [load])

  async function openOutfit(id: number) {
    setError(null)
    try {
      setDetail(await getOutfit(id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Outfit wirklich löschen?')) return
    setError(null)
    try {
      await deleteOutfit(id)
      if (detail?.id === id) setDetail(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleSaved(outfit: Outfit) {
    setCreating(false)
    setEditing(null)
    setDetail(outfit)
    void load()
  }

  function cancelCreate() {
    setCreating(false)
    setEditing(null)
  }

  if (creating || editing) {
    return (
      <section className="page">
        <h1 className="page-title">Outfits</h1>
        <OutfitCreator
          outfit={editing}
          onSaved={handleSaved}
          onCancel={cancelCreate}
        />
      </section>
    )
  }

  if (detail) {
    return (
      <section className="page">
        <h1 className="page-title">{detail.name}</h1>
        <div className="outfit-detail">
          <div className="outfit-detail-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setDetail(null)}
            >
              Zurück
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setEditing(detail)}
            >
              Neu kombinieren
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => handleDelete(detail.id)}
            >
              Löschen
            </button>
          </div>

          {detail.items.length === 0 ? (
            <p className="outfit-empty">Dieses Outfit enthält keine Kleidungsstücke.</p>
          ) : (
            <div className="outfit-items">
              {detail.items.map((item) => (
                <div className="outfit-item" key={item.id}>
                  {item.image_url ? (
                    <img
                      className="outfit-item-image"
                      src={item.image_url}
                      alt={item.name}
                    />
                  ) : (
                    <div className="outfit-item-placeholder" aria-hidden="true" />
                  )}
                  <span className="outfit-item-name">{item.name}</span>
                  <span className="outfit-item-category">{item.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="outfit-toolbar">
        <div>
          <h1 className="page-title">Outfits</h1>
          <p className="page-lead">Kombiniere deine Kleidungsstücke zu Outfits.</p>
        </div>
        <button className="btn" type="button" onClick={() => setCreating(true)}>
          Neu kombinieren
        </button>
      </div>

      {error ? (
        <p className="outfit-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="page-loading">Lädt Outfits…</p>
      ) : outfits.length === 0 ? (
        <p className="outfit-empty">
          Noch keine Outfits gespeichert. Kombiniere dein erstes Outfit.
        </p>
      ) : (
        <div className="outfit-grid">
          {outfits.map((outfit) => (
            <article className="card outfit-card" key={outfit.id}>
              <h2 className="outfit-card-name">{outfit.name}</h2>
              <p className="outfit-card-meta">
                {outfit.items.length}{' '}
                {outfit.items.length === 1 ? 'Kleidungsstück' : 'Kleidungsstücke'}
              </p>
              <div className="outfit-card-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => openOutfit(outfit.id)}
                >
                  Öffnen
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setEditing(outfit)}
                >
                  Neu kombinieren
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => handleDelete(outfit.id)}
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

export default Outfits
