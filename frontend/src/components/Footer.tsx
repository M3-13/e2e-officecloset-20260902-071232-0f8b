import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">© {new Date().getFullYear()} Kleiderschrank</span>
        <nav className="footer-links">
          <Link to="/impressum" className="footer-link">
            Impressum
          </Link>
          <Link to="/datenschutz" className="footer-link">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
