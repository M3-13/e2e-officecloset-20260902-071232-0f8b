import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

function Home() {
  const { user } = useAuth()

  return (
    <section className="page">
      <div className="card home-hero">
        <h1 className="page-title">Dein glamouröser Kleiderschrank</h1>
        <p className="page-lead">
          Bewahre deine schönsten Stücke auf, kombiniere sie zu perfekten Outfits und
          tritt jeden Tag stilvoll auf den Red Carpet.
        </p>
        <div className="home-actions">
          {user ? (
            <Link to="/wardrobe" className="btn">
              Zur Garderobe
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn">
                Jetzt registrieren
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Anmelden
              </Link>
            </>
          )}
        </div>
        {!user && (
          <p className="home-hint">
            Noch kein Konto? Registriere dich, um deine Garderobe zu verwalten – oder
            melde dich an, wenn du bereits dabei bist.
          </p>
        )}
      </div>
    </section>
  )
}

export default Home
