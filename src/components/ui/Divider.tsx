interface DividerProps {
    style?: 'gradient' | 'dots' | 'stars' | 'wave';
    className?: string;
}

export default function Divider({ style = 'gradient', className = '' }: DividerProps) {
    if (style === 'gradient') {
        return (
            <div className={`relative h-px w-full my-8 ${className}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rotate-45" />
            </div>
        );
    }

    if (style === 'dots') {
        return (
            <div className={`flex items-center justify-center gap-3 my-8 ${className}`}>
                <div className="w-2 h-2 rounded-full bg-purple-400/60" />
                <div className="w-2 h-2 rounded-full bg-pink-400/60" />
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-pink-400/60" />
                <div className="w-2 h-2 rounded-full bg-purple-400/60" />
            </div>
        );
    }

    if (style === 'stars') {
        return (
            <div className={`relative flex items-center justify-center my-8 ${className}`}>
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                </div>
                <div className="relative bg-gradient-to-r from-gray-100 dark:from-gray-900 px-4 py-1">
                    <span className="text-lg">✨ ✨ ✨</span>
                </div>
            </div>
        );
    }

    if (style === 'wave') {
        return (
            <div className={`relative my-8 overflow-hidden ${className}`}>
                <svg
                    className="w-full h-6"
                    viewBox="0 0 100 24"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M0 12 Q 25 6, 50 12 T 100 12"
                        fill="none"
                        stroke="url(#waveGradient)"
                        strokeWidth="1"
                        className="opacity-50"
                    />
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        );
    }

    return null;
}