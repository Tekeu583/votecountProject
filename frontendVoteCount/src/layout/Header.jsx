import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/Icon.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [connexionHovered, setConnexionHovered] = useState(false);
  const [inscriptionHovered, setInscriptionHovered] = useState(false);

  const navLinks = [
    { label: "Accueil", to: "/" },
    { label: "Comment ça marche", to: "/comment-ca-marche" },
    { label: "Elections", to: "/elections" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-gray-light)",
        backgroundColor: "var(--color-white)",
        fontFamily: "var(--font-sans)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={logo}
            alt="VoteCount"
            style={{ height: 24, width: "auto", objectFit: "contain" }}
          />
          <span style={{
                fontWeight: 700,
                fontSize: "var(--text-base)",
                color: "var(--color-dark)",
              }}>
                VoteCount
            </span>
        </Link>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                fontSize: "var(--text-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-gray-dark)",
                fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
                whiteSpace: "nowrap",
                position: "relative",
                paddingBottom: 2,
                transition: "color 0.2s",
              })}
              className="nav-link"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">

          {/* Bouton Connexion */}
          <Link
            to="/auth/login"
            onMouseEnter={() => setConnexionHovered(true)}
            onMouseLeave={() => setConnexionHovered(false)}
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid transparent",
              transition: "all 0.2s",
              backgroundColor: connexionHovered ? "var(--color-primary)" : "transparent",
              color: connexionHovered ? "var(--color-white)" : "var(--color-dark)",
              borderColor: connexionHovered ? "var(--color-primary)" : "transparent",
            }}
          >
            Connexion
          </Link>

          {/* Bouton S'inscrire */}
          <Link
            to="/auth/register"
            onMouseEnter={() => setInscriptionHovered(true)}
            onMouseLeave={() => setInscriptionHovered(false)}
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-primary)",
              transition: "all 0.2s",
              backgroundColor: inscriptionHovered ? "var(--color-white)" : "var(--color-primary)",
              color: inscriptionHovered ? "var(--color-dark)" : "var(--color-white)",
            }}
          >
            S'inscrire
          </Link>
        </div>

        {/* Burger Mobile */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: 22,
                height: 2,
                backgroundColor: "var(--color-dark)",
                borderRadius: 2,
                transition: "all 0.3s",
                transform:
                  menuOpen && i === 0 ? "rotate(45deg) translateY(6px)" :
                  menuOpen && i === 2 ? "rotate(-45deg) translateY(-6px)" : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--color-gray-light)",
            backgroundColor: "var(--color-white)",
            padding: "1rem 1.5rem 1.5rem",
          }}
          className="md:hidden flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                fontSize: "var(--text-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-gray-dark)",
                fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
              })}
            >
              {link.label}
            </NavLink>
          ))}
          <div
            className="flex flex-col gap-2 pt-3"
            style={{ borderTop: "1px solid var(--color-gray-light)" }}
          >
            <Link
              to="/connexion"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-gray-light)",
                color: "var(--color-dark)",
                textAlign: "center",
              }}
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-white)",
                textAlign: "center",
              }}
            >
              S'inscrire
            </Link>
          </div>
        </div>
      )}

      {/* Hover underline effet navbar */}
      <style>{`
        .nav-link:hover {
          color: var(--color-primary) !important;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--color-primary);
          border-radius: 2px;
          transition: width 0.25s ease;
        }
        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }
      `}</style>
    </header>
  );
};

export default Header;
