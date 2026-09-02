import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteAccount } from '../api/account'

function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeleteAccount() {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount()
      localStorage.removeItem('token')
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Account konnte nicht gelöscht werden.',
      )
      setDeleting(false)
    }
  }

  return (
    <section className="page">
      <h1 className="page-title">Konto</h1>
      <p className="page-lead">
        {user ? `Angemeldet als ${user.email}.` : 'Verwalte hier dein Konto.'}
      </p>

      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2>Account löschen</h2>
        <p className="page-lead">
          Wenn du deinen Account löschst, werden dein Profil, alle Kleidungsstücke
          einschließlich der Bilddateien sowie deine Outfits dauerhaft und unwiderruflich
          gelöscht.
        </p>

        {error && (
          <p
            role="alert"
            style={{
              color: 'var(--color-danger)',
              fontSize: 'var(--size-sm)',
              marginTop: 'var(--space-3)',
            }}
          >
            {error}
          </p>
        )}

        {confirming ? (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Wird gelöscht…' : 'Ja, endgültig löschen'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirming(true)}
          >
            Account löschen
          </button>
        )}
      </div>
    </section>
  )
}

export default Account
