import { useState, useEffect } from 'react';

interface WelcomeAnimationProps {
    onComplete: () => void;
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
    const [phase, setPhase] = useState<'logo' | 'sparkle' | 'fade'>('logo');

    useEffect(() => {
        const timers: number[] = [];

        timers.push(window.setTimeout(() => setPhase('sparkle'), 800));
        timers.push(window.setTimeout(() => setPhase('fade'), 2000));
        timers.push(window.setTimeout(() => onComplete(), 2800));

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 transition-opacity duration-1000 ${
                phase === 'fade' ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <div className="relative">
                <div className={`text-8xl mb-6 transition-all duration-700 ${phase === 'logo' ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
                    💎
                </div>

                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${phase === 'sparkle' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex gap-4">
                        <span className="text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>✨</span>
                        <span className="text-2xl animate-bounce" style={{ animationDelay: '150ms' }}>💫</span>
                        <span className="text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>✨</span>
                    </div>
                </div>

                <h1
                    className={`text-4xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent transition-all duration-700 ${
                        phase === 'logo' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
                >
                    Finance Manager
                </h1>

                <p
                    className={`text-gray-300 text-center mt-2 transition-all duration-700 delay-200 ${
                        phase === 'logo' ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    Luxury Edition
                </p>

                <div className={`mt-8 flex justify-center gap-1 transition-all duration-500 delay-300 ${phase === 'logo' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
            </div>
        </div>
    );
}
