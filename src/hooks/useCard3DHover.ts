import { useRef, useCallback, useState } from 'react';

interface Card3DState {
    rotateX: number;
    rotateY: number;
    scale: number;
}

export function useCard3DHover(enabled = true) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState<Card3DState>({
        rotateX: 0,
        rotateY: 0,
        scale: 1,
    });

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!enabled || !cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        setTransform({ rotateX, rotateY, scale: 1.02 });
    }, [enabled]);

    const handleMouseLeave = useCallback(() => {
        if (!enabled) return;
        setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    }, [enabled]);

    const getStyle = useCallback(() => {
        if (!enabled) return {};
        return {
            transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
            transition: 'transform 0.15s ease-out',
        };
    }, [enabled, transform]);

    return {
        cardRef,
        transform,
        handlers: {
            onMouseMove: handleMouseMove,
            onMouseLeave: handleMouseLeave,
        },
        getStyle,
    };
}