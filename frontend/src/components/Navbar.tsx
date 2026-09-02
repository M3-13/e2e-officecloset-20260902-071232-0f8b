import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link active' : 'nav-link'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          Kleiderschrank
        </Link>
        <nav className="navbar-links">
          <NavLink to="/" end className={linkClass}>
            Start
          </NavLink>
          <NavLink to="/wardrobe" className={linkClass}>
            Garderobe
          </NavLink>
          <NavLink to="/outfits" className={linkClass}>
            Outfits
          </NavLink>
        </nav>
        <div className="navbar-auth">
          {user ? (
            <>
              <NavLink to="/account" className={linkClass}>
                Konto
              </NavLink>
              <button type="button" className="nav-link nav-button" onClick={logout}>
                Abmelden
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Anmelden
              </NavLink>
              <NavLink to="/register" className="nav-link nav-cta">
                Registrieren
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
