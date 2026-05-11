import { useEffect, useRef } from 'react';

interface Ripple {
    x: number;
    y: number;
    id: number;
}

export function useButtonRipple() {
    const ripplesRef = useRef<Ripple[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();

        ripplesRef.current = [...ripplesRef.current, { x, y, id }];

        setTimeout(() => {
            ripplesRef.current = ripplesRef.current.filter(r => r.id !== id);
        }, 600);
    };

    return { handleClick, ripplesRef };
}

interface ButtonRippleProps {
    ripples: Ripple[];
    color?: string;
}

export function ButtonRipple({ ripples, color = 'rgba(255,255,255,0.4)' }: ButtonRippleProps) {
    return (
        <>
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: 0,
                        height: 0,
                        background: color,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
        </>
    );
}