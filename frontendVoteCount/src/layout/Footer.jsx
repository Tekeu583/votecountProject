import { Link } from "react-router-dom";
import logo from "../assets/Icon.png"; 


const Footer = () => {
  const columns = [
    {
      title: "Produit",
      links: [
        { label: "Fonctionnalités", to: "/fonctionnalites" },
        { label: "Sécurité", to: "/securite" },
        { label: "Tarification", to: "/tarification" },
        { label: "API", to: "/api" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { label: "Documentation", to: "/documentation" },
        { label: "Centre d'aide", to: "/aide" },
        { label: "Blog", to: "/blog" },
        { label: "Intégrations", to: "/integrations" },
      ],
    },
    {
      title: "Entreprise",
      links: [
        { label: "À propos", to: "/a-propos" },
        { label: "Carrières", to: "/carrieres" },
        { label: "Politique de confidentialité", to: "/confidentialite" },
        { label: "Conditions d'utilisation", to: "/conditions" },
      ],
    },
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-gray-light)",
        backgroundColor: "var(--color-white)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Grille principale */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="VoteCount" style={{ height: 24, width: "auto", objectFit: "contain" }}/>
              <span style={{
                fontWeight: 700,
                fontSize: "var(--text-base)",
                color: "var(--color-dark)",
              }}>
                VoteCount
              </span>
            </Link>
            <p style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-gray)",
              lineHeight: 1.75,
              maxWidth: 210,
            }}>
              La plateforme pour des solutions de vote numérique sécurisées,
              transparentes et faciles à utiliser.
            </p>
          </div>

          {/* Colonnes liens */}
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                color: "var(--color-dark)",
              }}>
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-gray)",
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--color-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--color-gray)")
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Barre du bas */}
      <div
        style={{ borderTop: "1px solid var(--color-gray-light)" }}
        className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-gray)" }}>
          © 2026 VoteCount Inc. Tous droits réservés.
        </p>

        {/* Icônes sociales */}
        <div className="flex items-center gap-4">

          {/* Globe */}
          <button
            aria-label="Langue"
            style={{ color: "var(--color-gray)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-gray)")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>

          {/* Share */}
          <button
            aria-label="Partager"
            style={{ color: "var(--color-gray)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-gray)")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </button>

          {/* Mail */}
          <button
            aria-label="Email"
            style={{ color: "var(--color-gray)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-gray)")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </button>

        </div>
      </div>
    </footer>
  );
};

export default Footer;