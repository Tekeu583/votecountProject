import { Link } from 'react-router-dom';
import logoImg from '@assets/img/logo.png';
const Logo = ({
    size = 'md',
    showText = true,
    className = ''
}) => {

    const sizeClasses = {
        sm: 'w-[32px] h-[36px]',
        md: 'w-[45px] h-[50px]',
        lg: 'w-[56px] h-[63px]',
    };

    return (
        <Link
            to="/"
            className={`flex items-center gap-2 group ${className}`}
        >
            {/* Conteneur du logo */}
            <div className={`${sizeClasses[size]} flex  items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                <img
                    src={logoImg}
                    alt="VoteCount Logo"
                    className="w-full h-full object-contain "
                />
            </div>
            {/* Texte */}
            {showText && (
                <span className="font-bold tracking-tight text-[var(--color-primary)] text-xl">
                    VoteCount
                </span>
            )}
        </Link>
    );
};

export default Logo;
