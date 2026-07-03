
import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";

// ── Images
import heroImage from "@assets/hero.jpg";
import maisonImage from "@assets/maison.png";
import groupImage from "@assets/group.png";

// ── Icônes features
import iconSecurite from "@assets/Icon (1).png";
import iconAnalyses from "@assets/Icon (2).png";
import iconAppareils from "@assets/Icon (3).png";

// ─── Hook : apparition au scroll ─────────────────────────────
const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
};

// ─── StatCard ─────────────────────────────────────────────────
const StatCard = ({ label, value, sub, subColor, delay = 0 }) => {
    const [ref, visible] = useInView();
    return (
        <div
            ref={ref}
            style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1,
                minWidth: 180,
                transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
            }}
        >
            <span style={{
                fontSize: "var(--text-xs)",
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 500,
            }}>
                {label}
            </span>
            <span style={{
                fontSize: "var(--text-2xl)",
                fontWeight: 700,
                color: "var(--color-white)",
                lineHeight: 1.1,
            }}>
                {value}
            </span>
            <span style={{
                fontSize: "var(--text-xs)",
                color: subColor || "rgba(255,255,255,0.55)",
                fontWeight: 500,
            }}>
                {sub}
            </span>
        </div>
    );
};

// ─── FeatureCard ──────────────────────────────────────────────
const FeatureCard = ({ icon, title, description, delay = 0 }) => {
    const [hovered, setHovered] = useState(false);
    const [ref, visible] = useInView();
    return (
        <div
            ref={ref}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                backgroundColor: "var(--color-white)",
                border: `1px solid ${hovered ? "var(--color-primary)" : "var(--color-gray-light)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "default",
                transition: `all 0.35s ease`,
                opacity: visible ? 1 : 0,
                transform: visible
                    ? hovered ? "translateY(-6px)" : "translateY(0)"
                    : "translateY(30px)",
                boxShadow: hovered
                    ? "0 12px 32px rgba(12,86,208,0.12)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                transitionDelay: visible ? "0ms" : `${delay}ms`,
            }}
        >
            <div style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                backgroundColor: hovered ? "var(--color-primary)" : "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.3s ease",
            }}>
                <img
                    src={icon}
                    alt={title}
                    style={{
                        width: 24,
                        height: 24,
                        objectFit: "contain",
                        filter: hovered ? "brightness(0) invert(1)" : "none",
                        transition: "filter 0.3s ease",
                    }}
                />
            </div>
            <h3 style={{
                fontSize: "var(--text-base)",
                fontWeight: 700,
                color: hovered ? "var(--color-primary)" : "var(--color-dark)",
                margin: 0,
                transition: "color 0.3s ease",
            }}>
                {title}
            </h3>
            <p style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-gray)",
                lineHeight: 1.75,
                margin: 0,
            }}>
                {description}
            </p>
        </div>
    );
};

// ─── UsageCard ────────────────────────────────────────────────
const UsageCard = ({ image, title, description, to, delay = 0 }) => {
    const [hovered, setHovered] = useState(false);
    const [ref, visible] = useInView();
    return (
        <div
            ref={ref}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                backgroundColor: "var(--color-white)",
                boxShadow: hovered
                    ? "0 20px 48px rgba(12,86,208,0.14)"
                    : "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                opacity: visible ? 1 : 0,
                transform: visible
                    ? hovered ? "translateY(-6px)" : "translateY(0)"
                    : "translateY(30px)",
                transition: `box-shadow 0.35s ease, transform 0.35s ease, opacity 0.6s ease ${delay}ms`,
            }}
        >
            {/* Image avec zoom au hover */}
            <div style={{ overflow: "hidden", height: 220 }}>
                <img
                    src={image}
                    alt={title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s ease",
                        transform: hovered ? "scale(1.07)" : "scale(1)",
                    }}
                />
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    color: "var(--color-dark)",
                    margin: 0,
                }}>
                    {title}
                </h3>
                <p style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-gray)",
                    lineHeight: 1.75,
                    margin: 0,
                }}>
                    {description}
                </p>
                <Link
                    to={to}
                    style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: hovered ? 10 : 4,
                        transition: "gap 0.3s ease",
                    }}
                >
                    En savoir plus →
                </Link>
            </div>
        </div>
    );
};
// ─── CtaBanner ────────────────────────────────────────────────
const CtaBanner = () => {
    const [ref, visible] = useInView(0.1);
    const [btn1Hovered, setBtn1Hovered] = useState(false);
    const [btn2Hovered, setBtn2Hovered] = useState(false);

    return (
        <>
            <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
        @keyframes pulsGlow {
          0%, 100% { opacity: 0.5; transform: scale(1);    }
          50%       { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px)   rotate(-10deg); }
          50%       { transform: translateY(-12px) rotate(-10deg); }
        }
      `}</style>

            <div
                ref={ref}
                style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "var(--radius-lg)",
                    padding: "3rem 2.5rem",
                    /* Background animé dégradé */
                    background: "linear-gradient(135deg, #0C56D0, #0F172A, #1e3a6e, #0C56D0)",
                    backgroundSize: "300% 300%",
                    animation: "gradientShift 8s ease infinite",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(32px)",
                    transition: "opacity 0.7s ease, transform 0.7s ease",
                }}
            >

                {/* Blob décoratif flou en bas à gauche */}
                <div style={{
                    position: "absolute",
                    bottom: -40,
                    left: -40,
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(12,86,208,0.5) 0%, transparent 70%)",
                    animation: "pulsGlow 5s ease-in-out infinite",
                    pointerEvents: "none",
                }} />

                {/* Blob décoratif flou orange en haut à droite */}
                <div style={{
                    position: "absolute",
                    top: -30,
                    right: 80,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(180,80,20,0.35) 0%, transparent 70%)",
                    animation: "pulsGlow 6s ease-in-out 1s infinite",
                    pointerEvents: "none",
                }} />

                {/* Icône fusée flottante */}
                <div style={{
                    position: "absolute",
                    right: "8%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    animation: "rocketFloat 4s ease-in-out infinite",
                    opacity: 0.25,
                    pointerEvents: "none",
                }}>
                    <svg width="90" height="90" viewBox="0 0 24 24" fill="none"
                        stroke="var(--color-primary)" strokeWidth="1.2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </svg>
                </div>

                {/* Contenu texte */}
                <div style={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
                    <h2 style={{
                        fontSize: "clamp(1.5rem, 4vw, 2rem)",
                        fontWeight: 800,
                        color: "var(--color-white)",
                        lineHeight: 1.25,
                        margin: "0 0 1rem",
                    }}>
                        Prêt à moderniser votre processus de vote ?
                    </h2>

                    <p style={{
                        fontSize: "var(--text-sm)",
                        color: "rgba(255,255,255,0.65)",
                        lineHeight: 1.75,
                        margin: "0 0 1.75rem",
                        maxWidth: 380,
                    }}>
                        Rejoignez des centaines d'organisations qui utilisent déjà VoteCount
                        pour piloter leurs décisions.
                    </p>

                    {/* Boutons */}
                    <div className="flex flex-wrap gap-3">

                        {/* Commencer aujourd'hui */}
                        <Link
                            to="/inscription"
                            onMouseEnter={() => setBtn1Hovered(true)}
                            onMouseLeave={() => setBtn1Hovered(false)}
                            style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 600,
                                textDecoration: "none",
                                padding: "10px 20px",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--color-primary)",
                                transition: "all 0.25s ease",
                                backgroundColor: btn1Hovered
                                    ? "var(--color-white)"
                                    : "var(--color-primary)",
                                color: btn1Hovered
                                    ? "var(--color-dark)"
                                    : "var(--color-white)",
                                boxShadow: btn1Hovered
                                    ? "0 4px 16px rgba(255,255,255,0.2)"
                                    : "none",
                            }}
                        >
                            Commencer aujourd'hui
                        </Link>

                        {/* Contacter l'équipe */}
                        <Link
                            to="/contact"
                            onMouseEnter={() => setBtn2Hovered(true)}
                            onMouseLeave={() => setBtn2Hovered(false)}
                            style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 600,
                                textDecoration: "none",
                                padding: "10px 20px",
                                borderRadius: "var(--radius-md)",
                                transition: "all 0.25s ease",
                                backgroundColor: btn2Hovered
                                    ? "var(--color-primary)"
                                    : "transparent",
                                color: btn2Hovered
                                    ? "var(--color-white)"
                                    : "var(--color-white)",
                                border: "1px solid rgba(255,255,255,0.35)",
                                boxShadow: btn2Hovered
                                    ? "0 4px 16px rgba(12,86,208,0.4)"
                                    : "none",
                            }}
                        >
                            Contacter l'équipe commerciale
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

// ─── Page Home ────────────────────────────────────────────────
const Home = () => {
    const [demarrerHovered, setDemarrerHovered] = useState(false);
    const [demoHovered, setDemoHovered] = useState(false);

    const stats = [
        { label: "Total des votes exprimés", value: "1.2M+", sub: "↑ +12.5% ce mois-ci", subColor: "#4ADE80", delay: 0 },
        { label: "Total des votes exprimés", value: "500+", sub: "↑ +5% de croissance", subColor: "#4ADE80", delay: 120 },
        { label: "Total des votes exprimés", value: "99.9%", sub: "✓ Certifié ISO", subColor: "#4ADE80", delay: 240 },
    ];

    const features = [
        { icon: iconSecurite, title: "Chiffrement de bout en bout", description: "Vos données sont protégées par des protocoles de sécurité de pointe et des méthodes de vérification blockchain.", delay: 0 },
        { icon: iconAnalyses, title: "Analyses en temps réel", description: "Suivez la participation et les résultats en direct grâce à des tableaux de bord administratifs sécurisés.", delay: 120 },
        { icon: iconAppareils, title: "Support multi-appareils", description: "Votez en toute sécurité depuis n'importe quel smartphone, tablette ou ordinateur, partout dans le monde.", delay: 240 },
    ];

    const usages = [
        { image: maisonImage, title: "Gouvernance d'entreprise", description: "Révolutionnez le processus de prise de décision de votre organisation avec notre plateforme de vote basée sur la blockchain. Fiable, rapide et prête pour l'audit à l'ère moderne.", to: "/elections", delay: 0 },
        { image: groupImage, title: "Élections communautaires", description: "Révolutionnez le processus de prise de décision de votre organisation avec notre plateforme de vote basée sur la blockchain. Fiable, rapide et prête pour l'audit à l'ère moderne.", to: "/elections", delay: 150 },
    ];

    return (
        <div style={{ fontFamily: "var(--font-sans)" }}>

            {/* ── Animations globales ───────────────────────────────── */}
            <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes floatHero {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-10px); }
        }
        .hero-text-1 { animation: fadeSlideUp 0.7s ease 0.10s both; }
        .hero-text-2 { animation: fadeSlideUp 0.7s ease 0.25s both; }
        .hero-text-3 { animation: fadeSlideUp 0.7s ease 0.40s both; }
        .hero-text-4 { animation: fadeSlideUp 0.7s ease 0.55s both; }
        .hero-img    {
          animation:
            fadeSlideUp 0.8s ease 0.30s both,
            floatHero   5s   ease-in-out 1s infinite;
        }
        .nav-link:hover { color: var(--color-primary) !important; }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 2px;
          background-color: var(--color-primary);
          border-radius: 2px;
          transition: width 0.25s ease;
        }
        .nav-link:hover::after,
        .nav-link.active::after { width: 100%; }
      `}</style>

            {/* ── HERO ──────────────────────────────────────────────── */}
            <section
                style={{ backgroundColor: "var(--color-white)" }}
                className="max-w-7xl mx-auto px-6 py-16 md:py-24"
            >
                <div className="flex flex-col md:flex-row items-center gap-12">

                    {/* Texte gauche */}
                    <div className="flex flex-col gap-6 flex-1">

                        <span className="hero-text-1" style={{
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            color: "var(--color-primary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                        }}>
                            Fiable &amp; Distribué
                        </span>

                        <h1 className="hero-text-2" style={{
                            fontSize: "clamp(2rem, 5vw, 3rem)",
                            fontWeight: 800,
                            lineHeight: 1.15,
                            color: "var(--color-dark)",
                            margin: 0,
                        }}>
                            Vote Numérique{" "}
                            <span style={{ color: "var(--color-primary)", display: "block" }}>
                                Sécurisé &amp;
                            </span>
                            <span style={{ color: "var(--color-primary)" }}>
                                Transparent
                            </span>
                        </h1>

                        <p className="hero-text-3" style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-gray)",
                            lineHeight: 1.75,
                            maxWidth: 440,
                            margin: 0,
                        }}>
                            Révolutionnez le processus de prise de décision de votre
                            organisation avec notre plateforme de vote basée sur la
                            blockchain. Fiable, rapide et prête pour l'audit à l'ère moderne.
                        </p>

                        {/* Boutons */}
                        <div className="hero-text-4 flex flex-wrap items-center gap-3">

                            {/* Démarrer */}
                            <NavLink
                                to="/inscription"
                                onMouseEnter={() => setDemarrerHovered(true)}
                                onMouseLeave={() => setDemarrerHovered(false)}
                                style={{
                                    fontSize: "var(--text-sm)",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--color-primary)",
                                    transition: "all 0.2s",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: demarrerHovered
                                        ? "var(--color-white)"
                                        : "var(--color-primary)",
                                    color: demarrerHovered
                                        ? "var(--color-dark)"
                                        : "var(--color-white)",
                                }}
                            >
                                Démarrer votre élection →
                            </NavLink>

                            {/* Voir la démo */}
                            <NavLink
                                to="/demo"
                                onMouseEnter={() => setDemoHovered(true)}
                                onMouseLeave={() => setDemoHovered(false)}
                                style={{
                                    fontSize: "var(--text-sm)",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-md)",
                                    transition: "all 0.2s",
                                    backgroundColor: demoHovered
                                        ? "var(--color-primary)"
                                        : "transparent",
                                    color: demoHovered
                                        ? "var(--color-white)"
                                        : "var(--color-dark)",
                                    border: demoHovered
                                        ? "1px solid var(--color-primary)"
                                        : "1px solid var(--color-gray-light)",
                                }}
                            >
                                Voir la demo
                            </NavLink>
                        </div>
                    </div>

                    {/* Image hero flottante */}
                    <div className="flex-1 flex justify-center items-center w-full">
                        <img
                            className="hero-img"
                            src={heroImage}
                            alt="Illustration vote numérique"
                            style={{
                                width: "100%",
                                maxWidth: 480,
                                height: "auto",
                                objectFit: "contain",
                                borderRadius: "var(--radius-lg)",
                                boxShadow: "0 20px 60px rgba(12,86,208,0.15), 0 4px 16px rgba(0,0,0,0.08)",
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────────────────── */}
            <section style={{ backgroundColor: "var(--color-primary)" }}>
                <div
                    className="max-w-7xl mx-auto px-6 py-10"
                    style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
                >
                    {stats.map((s, i) => <StatCard key={i} {...s} />)}
                </div>
            </section>

            {/* ── POURQUOI VOTECOUNT ────────────────────────────────── */}
            <section id="how-it-works" style={{ backgroundColor: "var(--color-background)" }} className="pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 style={{
                        fontSize: "var(--text-2xl)",
                        fontWeight: 800,
                        color: "var(--color-dark)",
                        marginBottom: 12,
                    }}>
                        Pourquoi choisir VoteCount ?
                    </h2>
                    <p style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--color-gray)",
                        maxWidth: 480,
                        margin: "0 auto",
                        lineHeight: 1.75,
                    }}>
                        Nous fournissons les outils de qualité industrielle dont vous avez
                        besoin pour une démocratie moderne, accessible et inviolable.
                    </p>
                </div>
            </section>

            {/* ── FEATURE CARDS ─────────────────────────────────────── */}
            <section style={{ backgroundColor: "var(--color-background)" }} className="py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ── CAS D'USAGE ───────────────────────────────────────── */}
            <section style={{ backgroundColor: "var(--color-background)" }} className="py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {usages.map((u, i) => <UsageCard key={i} {...u} />)}
                    </div>
                </div>
            </section>
            {/* ── CTA FINAL ─────────────────────────────────────────── */}
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <CtaBanner />
                </div>
            </section>

        </div>
    );
};

export default Home;

