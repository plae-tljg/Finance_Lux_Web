import { useState, useEffect, useCallback, useRef } from 'react';

interface PetState {
    mood: 'happy' | 'neutral' | 'excited' | 'sleepy';
    animation: 'idle' | 'bounce' | 'wave' | 'sleep';
    message: string | null;
}

const moodMessages = {
    happy: ['Great day! 🌟', 'Feeling good! ✨', 'Happy to help! 💕'],
    neutral: ['... 🤔', 'Ready to assist', 'Watching over you 👀'],
    excited: ['New transaction! 🎉', 'Report generated! 📊', 'Achievement unlocked! 🏆'],
    sleepy: ['Zzz... 💤', 'Resting... 😴', 'Night mode 🌙'],
};

export default function PetCompanion() {
    const [state, setState] = useState<PetState>({
        mood: 'happy',
        animation: 'idle',
        message: null,
    });
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const dragRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setState(prev => ({
                ...prev,
                mood: prev.mood === 'sleepy' ? 'sleepy' : 'neutral',
                animation: 'idle',
            }));
        }, 8000);
        return () => clearInterval(interval);
    }, [isVisible]);

    const showMessage = useCallback((mood: PetState['mood']) => {
        const messages = moodMessages[mood];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setState(prev => ({ ...prev, message: randomMessage, mood }));
        setTimeout(() => setState(prev => ({ ...prev, message: null })), 3000);
    }, []);

    const handleClick = useCallback(() => {
        setClickCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 5) {
                setState(prev => ({ ...prev, animation: 'bounce', mood: 'excited' }));
                showMessage('excited');
                setTimeout(() => setState(prev => ({ ...prev, animation: 'idle' })), 2000);
                return 0;
            }
            return newCount;
        });

        setState(prev => ({ ...prev, animation: 'wave', mood: 'happy' }));
        showMessage('happy');
        setTimeout(() => setState(prev => ({ ...prev, animation: 'idle' })), 1000);
    }, [showMessage]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: Math.max(0, Math.min(window.innerWidth - 120, e.clientX - dragRef.current.startX)),
            y: Math.max(0, Math.min(window.innerHeight - 150, e.clientY - dragRef.current.startY)),
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    if (!isVisible) return null;

    const animationClass = {
        idle: 'animate-breathe',
        bounce: 'animate-bounce',
        wave: 'animate-wave',
        sleep: 'animate-sleep',
    }[state.animation];

    const moodColor = {
        happy: 'from-green-400 to-emerald-500',
        neutral: 'from-blue-400 to-cyan-500',
        excited: 'from-purple-400 to-pink-500',
        sleepy: 'from-gray-400 to-slate-500',
    }[state.mood];

    return (
        <div
            className={`fixed z-40 cursor-grab active:cursor-grabbing transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: position.x, top: position.y }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {state.message && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 animate-float">
                    <div className="bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-xl border border-white/50 dark:border-gray-700/50 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{state.message}</p>
                    </div>
                </div>
            )}

            <div
                className={`relative group ${animationClass}`}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
            >
                <svg
                    width="100"
                    height="120"
                    viewBox="0 0 100 120"
                    className="filter drop-shadow-lg"
                >
                    <defs>
                        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" className="stop-color-sky-400" />
                            <stop offset="100%" className="stop-color-indigo-500" />
                        </linearGradient>
                        <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" className="stop-color-white" />
                            <stop offset="100%" className="stop-color-sky-100" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <ellipse cx="50" cy="75" rx="30" ry="35" fill="url(#bodyGradient)" />

                    <ellipse cx="50" cy="80" rx="20" ry="25" fill="url(#bellyGradient)" opacity="0.7" />

                    <ellipse cx="35" cy="55" rx="18" ry="20" fill="url(#bodyGradient)" />
                    <ellipse cx="65" cy="55" rx="18" ry="20" fill="url(#bodyGradient)" />

                    <circle cx="40" cy="50" r="10" fill="white" />
                    <circle cx="60" cy="50" r="10" fill="white" />

                    <circle cx="42" cy="50" r="5" fill="#1e293b" className="animate-blink" />
                    <circle cx="62" cy="50" r="5" fill="#1e293b" className="animate-blink" />

                    <circle cx="44" cy="48" r="2" fill="white" />
                    <circle cx="64" cy="48" r="2" fill="white" />

                    <ellipse cx="50" cy="62" rx="3" ry="2" fill="#f472b6" />

                    <path
                        d="M44 68 Q50 73 56 68"
                        stroke="#1e293b"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        className={state.mood === 'excited' ? 'animate-smile' : ''}
                    />

                    <ellipse cx="25" cy="65" rx="8" ry="6" fill="url(#bodyGradient)" opacity="0.5" />
                    <ellipse cx="75" cy="65" rx="8" ry="6" fill="url(#bodyGradient)" opacity="0.5" />

                    <path
                        d="M35 35 Q40 25 45 35"
                        stroke="#1e293b"
                        strokeWidth="2"
                        fill="none"
                        className="animate-ear"
                    />
                    <path
                        d="M55 35 Q60 25 65 35"
                        stroke="#1e293b"
                        strokeWidth="2"
                        fill="none"
                        className="animate-ear"
                    />

                    <ellipse cx="50" cy="105" rx="12" ry="8" fill="url(#bodyGradient)" opacity="0.3" />
                </svg>

                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r ${moodColor} opacity-50 blur-sm`} />

                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">💕</span>
                </div>
            </div>

            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: scale(1) translateY(0); }
                    50% { transform: scale(1.02) translateY(-2px); }
                }
                @keyframes wave {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
                @keyframes sleep {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(0.98) translateY(2px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-8px); }
                }
                @keyframes blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }
                @keyframes smile {
                    0%, 100% { d: path("M44 68 Q50 73 56 68"); }
                    50% { d: path("M42 66 Q50 78 58 66"); }
                }
                @keyframes ear {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-breathe { animation: breathe 3s ease-in-out infinite; }
                .animate-wave { animation: wave 0.5s ease-in-out; }
                .animate-sleep { animation: sleep 2s ease-in-out infinite; }
                .animate-float { animation: float 2s ease-in-out infinite; }
                .animate-blink { animation: blink 4s ease-in-out infinite; }
                .animate-smile { animation: smile 1s ease-in-out infinite; }
                .animate-ear { animation: ear 2s ease-in-out infinite; }
            `}</style>
        </div>
    );
}