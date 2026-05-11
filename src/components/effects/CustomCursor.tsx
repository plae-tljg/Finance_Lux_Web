import { useEffect, useState, useCallback } from 'react';

export default function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const trailIdRef = useState(0)[0];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            const target = e.target as HTMLElement;
            setIsPointer(
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') !== null ||
                target.closest('a') !== null
            );

            setTrails(prev => {
                const newTrail = { x: e.clientX, y: e.clientY, id: Date.now() };
                return [...prev.slice(-8), newTrail];
            });
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    return (
        <>
            <div
                className="fixed pointer-events-none z-[9999] transition-all duration-75"
                style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                }}
            >
                <div
                    className={`rounded-full border-2 transition-all duration-150 ${
                        isPointer
                            ? 'w-8 h-8 border-purple-500 bg-purple-500/20'
                            : 'w-4 h-4 border-blue-400 bg-blue-400/30'
                    }`}
                />
            </div>

            <div className="fixed pointer-events-none z-[9998]">
                {trails.map((trail, index) => (
                    <div
                        key={trail.id}
                        className="absolute rounded-full bg-gradient-to-r from-purple-500/40 to-pink-500/40"
                        style={{
                            left: trail.x,
                            top: trail.y,
                            width: 8 - index,
                            height: 8 - index,
                            transform: 'translate(-50%, -50%)',
                            opacity: (index + 1) / trails.length * 0.5,
                        }}
                    />
                ))}
            </div>
        </>
    );
}