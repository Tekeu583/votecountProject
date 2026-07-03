// components/AnimatedItem.jsx
import { useInView } from "../hooks/useInView";

export default function AnimatedItem({ children, delay = 100 }) {
    const [ref, isVisible] = useInView();

    return (
        <div
            ref={ref}
            className={`
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}
        `}
            style={{
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}