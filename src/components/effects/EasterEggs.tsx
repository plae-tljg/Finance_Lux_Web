import { useState, useEffect, useCallback } from 'react';

interface EasterEgg {
    id: string;
    trigger: string;
    message: string;
    icon: string;
}

const easterEggs: EasterEgg[] = [
    { id: 'logo', trigger: 'logo', message: '💎 找到彩蛋了！你真是个细心的人~', icon: '🎉' },
    { id: 'theme', trigger: 'theme', message: '🌙 主题切换大师！', icon: '⚡' },
    { id: 'magic', trigger: 'magic', message: '✨ 魔法降临！', icon: '🌟' },
    { id: 'fortune', trigger: 'fortune', message: '🍀 今天是幸运日！', icon: '🍀' },
];

export default function EasterEggs() {
    const [activeEasterEgg, setActiveEasterEgg] = useState<EasterEgg | null>(null);
    const [clickCount, setClickCount] = useState(0);
    const [showCounter, setShowCounter] = useState(false);

    const triggerEasterEgg = useCallback((trigger: string) => {
        const egg = easterEggs.find(e => e.id === trigger);
        if (egg) {
            setActiveEasterEgg(egg);
            setTimeout(() => setActiveEasterEgg(null), 3000);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCounter(false);
                setClickCount(0);
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                triggerEasterEgg('fortune');
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                triggerEasterEgg('magic');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [triggerEasterEgg]);

    const handleGlobalClick = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;

        if (target.closest('[data-easter-egg="logo"]')) {
            setClickCount(prev => {
                const newCount = prev + 1;
                if (newCount === 5) {
                    triggerEasterEgg('logo');
                    return 0;
                }
                return newCount;
            });
            setShowCounter(true);
            setTimeout(() => setShowCounter(false), 1000);
        }

        if (target.closest('button[title*="Switch to"]')) {
            triggerEasterEgg('theme');
        }
    }, [triggerEasterEgg]);

    useEffect(() => {
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [handleGlobalClick]);

    return (
        <>
            {showCounter && clickCount > 0 && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none">
                    <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-ping">
                        {5 - clickCount}
                    </div>
                </div>
            )}

            {activeEasterEgg && (
                <div className="fixed bottom-8 right-8 z-[200] animate-slide-up">
                    <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl border border-white/20">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl animate-bounce">{activeEasterEgg.icon}</span>
                            <div>
                                <p className="text-white font-medium">{activeEasterEgg.message}</p>
                                <p className="text-white/60 text-sm">Easter Egg Found!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                data-easter-egg="logo"
                className="fixed bottom-4 left-4 z-50 cursor-pointer opacity-20 hover:opacity-100 transition-opacity duration-300"
                onClick={() => triggerEasterEgg('logo')}
            >
                <span className="text-2xl">💎</span>
            </div>
        </>
    );
}
