import PropTypes from 'prop-types';
import AnimatedItem from '../AnimatedItem';
export default function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    className = '',
    delay = 50,
    color='bg-info/10',
    borderColor='[var(--color-primary)]'
}) {
    return (
        <AnimatedItem delay={delay}>
            <div className={`bg-[var(--color-white)] min-h-[140px] md:min-h-[150px] p-5 rounded-[var(--radius-md)] shadow-[var(--shadow-md)] border-l-4 border-${borderColor} relative overflow-hidden flex flex-col`}>

                <div className="flex items-center gap-3">
                    {Icon && (<div className={`p-2 rounded-[var(--radius-md)] bg-[var(--color-white)] text-[var(--color-primary)] flex-shrink-0 ${color}`}>
                        <Icon size={18} />
                    </div>)}
                    <p className="text-sm text-[var(--color-dark)] font-semibold leading-tight line-clamp-2">
                        {title}
                    </p>
                </div>

                <div className="p-2 items-center flex justify-center + text-center">
                    <h2 className={`text-3xl font-bold text-right ${className}`}>
                        {value}
                    </h2>
                </div>

                {trend && (
                    <div className="absolute bottom-8 right-5 z-10">
                        <span className="text-xs text-[var(--color-success)] font-medium
                                    bg-[var(--color-success)]/10 px-3.5 py-1
                                    rounded-full whitespace-nowrap">
                            {trend}
                        </span>
                    </div>
                )}

                {/* Courbe sinusoïdale bleue */}
                <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1200 90"
                        fill="none"
                        preserveAspectRatio="none"
                        className="text-[var(--color-primary)]"
                    >
                        <path
                            d="M0 70 Q140 35 280 68 Q420 92 580 48 Q740 18 880 62 Q1020 85 1200 45 L1200 90 L0 90 Z"
                            fill="currentColor"
                            opacity="0.19"
                        />
                        <path
                            d="M0 70 Q140 35 280 68 Q420 92 580 48 Q740 18 880 62 Q1020 85 1200 45"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.85"
                        />
                    </svg>
                </div>

            </div>
        </AnimatedItem>
    );
}

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType,
    trend: PropTypes.string,
    className: PropTypes.string,
    delay: PropTypes.number,
    color: PropTypes.string
};