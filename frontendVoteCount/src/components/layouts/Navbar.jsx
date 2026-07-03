import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut,Vote } from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "@hooks/useAuth";
import { getRoleBaseRoute } from "@utils/roleRoutes";
import { toast } from "react-hot-toast";
import { getPrimaryRole } from '@utils/roleRoutes';
import { useVoterSession } from "@hooks/useVoterSession";
export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, authenticated, loading, logout } = useAuth();

    const navigate = useNavigate();
    const { voterSession, hasActiveSession, endSession } = useVoterSession();

    const voteLink = hasActiveSession()
        ? `/vote/private/${voterSession.electionUuid}/candidates`
        : '/vote';

    const handleVoterLogout = () => {
        endSession();
        toast.success('Session de vote terminée.');
        navigate('/');
    };
    const handleLogout = async () => {
        await toast.promise(logout(), {
            loading: "Déconnexion...",
            success: "Vous avez été déconnecté avec succès",
            error: "Une erreur s'est produite lors de la déconnexion",
        })

        setDropdownOpen(false);
        navigate("/");
    };

    const dashboardLink = user ? getRoleBaseRoute(getPrimaryRole(user)) : '/';

    const linkClass = (isActive) => `
        flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200
        border-transparent
        ${isActive
            ? 'border-b-4 border-b-[var(--color-primary)] text-[var(--color-primary)]'
            : 'text-[var(--color-dark)] hover:border-b-[var(--color-primary)] hover:bg-[var(--color-gray)]/40 hover:text-[var(--color-primary)] hover:border-b-4'
        }
    `;

    //Écran de chargement minimal
    if (loading) {
        return (
            <header className="border-b bg-[var(--color-white)] border-[var(--color-gray-light)] fixed w-full z-50">
                <div className="relative mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Logo size="md" />
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                </div>
            </header>
        );
    }
    return (
        <header className="border-b bg-[var(--color-white)] border-[var(--color-gray-light)] fixed w-full z-50">
            <div className="relative mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* LOGO */}
                <div className="flex items-center">
                    <Logo size="md" />
                </div>

                {/* MENU CENTRÉ  */}
                <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 whitespace-nowrap">
                    <NavLink to="/" className={({ isActive }) => linkClass(isActive)}>Accueil</NavLink>
                    <a href="#how-it-works" className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200
                        border-transparent 'text-[var(--color-dark)] hover:border-b-[var(--color-primary)] hover:bg-[var(--color-gray)]/40 hover:text-[var(--color-primary)] hover:border-b-4">
                        Comment ça marche
                    </a>
                    <NavLink to="/elections" className={({ isActive }) => linkClass(isActive)}>Élections</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => linkClass(isActive)}>Contact</NavLink>
                    <NavLink to={voteLink} className={({ isActive }) => linkClass(isActive)}>Voter</NavLink>
                </nav>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">
                    {hasActiveSession() && (
                        <div className="hidden lg:flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-[var(--radius-md)]">
                            <Vote size={14} />
                            <span>{voterSession.electorName}</span>
                            <button
                                onClick={handleVoterLogout}
                                title="Quitter la session de vote"
                                className="ml-1 text-blue-700 hover:text-red-600"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}
                    {/* DESKTOP ONLY */}
                    <div className="hidden lg:flex items-center gap-3">
                        {!authenticated ? (
                            <>
                                <NavLink to="/auth/login" className={({ isActive }) => linkClass(isActive)}>
                                    Connexion
                                </NavLink>
                                <NavLink to="/auth/register" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-[var(--radius-md)] transition-all duration-200 max-h-12 hover:bg-[var(--color-gray-light)] hover:text-[var(--color-dark)]">
                                    S'inscrire
                                </NavLink>
                            </>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2"
                                >
                                    <img
                                        src={user?.photo || "https://i.pravatar.cc/40"}
                                        alt={user?.first_name || user?.last_name || "User"}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <ChevronDown size={16} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[var(--color-white)] shadow-lg rounded-[var(--radius-md)] border border-[var(--color-gray-light)]">
                                        <div className="px-4 py-2 border-b border-b-[var(--color-gray-light)]">
                                            <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>

                                        <NavLink to={dashboardLink} className={({ isActive }) => linkClass(isActive)}>
                                            Dashboard
                                        </NavLink>

                                        <NavLink to="/profile" className={({ isActive }) => linkClass(isActive)}>
                                            Profil
                                        </NavLink>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut size={16} /> Déconnexion
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* MOBILE BUTTON */}
                    <button
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* MENU */}
            {isOpen && (
                <div className="lg:hidden bg-[var(--color-white)] border-t border-t-[var(--color-gray-light)]">
                    <nav className="flex flex-col px-4 py-2 gap-2">
                        <NavLink to="/" onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Accueil</NavLink>
                        <NavLink to="/how-it-works" onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Comment ça marche</NavLink>
                        <NavLink to="/elections" onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Élections</NavLink>
                        <NavLink to="/contact" onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Contact</NavLink>
                        <NavLink to={voteLink} onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Voter</NavLink>
                        {hasActiveSession() && (
                            <div className="flex items-center justify-between gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-2 rounded-[var(--radius-md)]">
                                <span className="flex items-center gap-2"><Vote size={14} /> {voterSession.electorName}</span>
                                <button
                                    onClick={() => { setIsOpen(false); handleVoterLogout(); }}
                                    className="flex items-center gap-1 text-red-600"
                                >
                                    <LogOut size={14} /> Quitter
                                </button>
                            </div>
                        )}
                        <div className="mt-2 flex flex-col gap-2 pt-2">
                            {authenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2"
                                    >
                                        <img
                                            src={user.photo || "https://i.pravatar.cc/40"}
                                            alt={user.first_name || user.last_name || "User"}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <ChevronDown size={16} />
                                    </button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[var(--color-white)] shadow-lg rounded-[var(--radius-md)] border border-[var(--color-gray-light)]">
                                            <div className="px-4 py-2 border-b border-b-[var(--color-gray-light)] ">
                                                <p className="text-sm font-semibold">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <NavLink to={dashboardLink} className={({ isActive }) => linkClass(isActive)}>
                                                Dashboard
                                            </NavLink>
                                            <NavLink to="/profile" className={({ isActive }) => linkClass(isActive)}>
                                                Profil
                                            </NavLink>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut size={16} /> Déconnexion
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <NavLink to="/auth/login" onClick={() => setIsOpen(false)} className={({ isActive }) => linkClass(isActive)}>Connexion</NavLink>
                                    <NavLink to="/auth/register" className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-[var(--radius-md)] transition-all duration-200 max-h-12 hover:bg-[var(--color-gray-light)] hover:text-[var(--color-dark)] " onClick={() => setIsOpen(false)}>
                                        S'inscrire
                                    </NavLink>
                                </>
                            )}
                        </div>

                    </nav>
                </div>
            )}
        </header>
    );
}
