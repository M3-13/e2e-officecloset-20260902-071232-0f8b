import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(email, password)
      navigate('/wardrobe', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <div className="card auth-form">
        <h1 className="page-title">Registrieren</h1>
        <p className="page-lead">
          Erstelle einen Account, um deine Garderobe zu verwalten und Outfits zu
          kombinieren.
        </p>
        <form onSubmit={handleSubmit} className="auth-form-body" noValidate>
          <label className="auth-field">
            E-Mail
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-field">
            Passwort
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Registrieren…' : 'Registrieren'}
          </button>
        </form>
        <p className="auth-switch">
          Schon dabei? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </section>
  )
}

export default Register
