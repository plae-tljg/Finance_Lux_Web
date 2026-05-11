import { useCard3DHover } from '../../hooks/useCard3DHover';

interface Card3DProps {
    children: React.ReactNode;
    className?: string;
    enabled?: boolean;
}

export default function Card3D({ children, className = '', enabled = true }: Card3DProps) {
    const { cardRef, handlers, getStyle } = useCard3DHover(enabled);

    return (
        <div
            ref={cardRef}
            {...handlers}
            className={`transition-shadow duration-300 ${enabled ? 'hover:shadow-3xl' : ''} ${className}`}
            style={getStyle()}
        >
            {children}
        </div>
    );
}