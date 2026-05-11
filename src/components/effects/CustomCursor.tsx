import { useEffect, useState, useCallback, useRef } from 'react';

export type CursorStyle = 'default' | 'purple' | 'gold' | 'rainbow' | 'star' | 'heart';

interface CursorUnlock {
  id: CursorStyle;
  label: string;
  emoji: string;
  condition: string;
  unlocked: boolean;
}

const CURSOR_UNLOCKS: CursorUnlock[] = [
  { id: 'default', label: 'Classic', emoji: '⬤', condition: 'Default', unlocked: true },
  { id: 'purple', label: 'Mystic', emoji: '💜', condition: 'Unlock 5 achievements', unlocked: false },
  { id: 'gold', label: 'Golden', emoji: '💛', condition: 'Unlock 10 achievements', unlocked: false },
  { id: 'rainbow', label: 'Rainbow', emoji: '🌈', condition: 'Unlock all achievements', unlocked: false },
  { id: 'star', label: 'Starry', emoji: '⭐', condition: 'Create 20 transactions', unlocked: false },
  { id: 'heart', label: 'Heart', emoji: '❤️', condition: 'Check in 7 days', unlocked: false },
];

interface CustomCursorProps {
  currentStyle?: CursorStyle;
  achievementCount?: number;
  transactionCount?: number;
  consecutiveCheckIns?: number;
  onRequestChange?: (style: CursorStyle) => void;
}

export default function CustomCursor({
  currentStyle = 'default',
  achievementCount = 0,
  transactionCount = 0,
  consecutiveCheckIns = 0,
  onRequestChange
}: CustomCursorProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const trailIdRef = useRef(0);
    const [showCursorMenu, setShowCursorMenu] = useState(false);

    const cursorUnlocks = CURSOR_UNLOCKS.map(cursor => {
      let unlocked = cursor.id === 'default';
      if (cursor.id === 'purple') unlocked = achievementCount >= 5;
      if (cursor.id === 'gold') unlocked = achievementCount >= 10;
      if (cursor.id === 'rainbow') unlocked = achievementCount >= 15;
      if (cursor.id === 'star') unlocked = transactionCount >= 20;
      if (cursor.id === 'heart') unlocked = consecutiveCheckIns >= 7;
      return { ...cursor, unlocked };
    });

    const activeCursor = cursorUnlocks.find(c => c.id === currentStyle) || cursorUnlocks[0];

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            const target = e.target as HTMLElement;
            const isClickable =
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') !== null ||
                target.closest('a') !== null;
            setIsPointer(isClickable);

            trailIdRef.current += 1;
            setTrails(prev => {
                const maxTrails = currentStyle === 'rainbow' ? 12 : 8;
                const newTrail = { x: e.clientX, y: e.clientY, id: trailIdRef.current };
                return [...prev.slice(-maxTrails), newTrail];
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
    }, [currentStyle]);

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    const getCursorStyles = () => {
        switch (currentStyle) {
          case 'purple':
            return 'w-8 h-8 border-2 border-purple-500 bg-purple-500/30 rounded-full';
          case 'gold':
            return 'w-8 h-8 border-2 border-yellow-400 bg-yellow-400/30 rounded-lg rotate-45';
          case 'rainbow':
            return 'w-6 h-6 border-2 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full animate-pulse';
          case 'star':
            return 'w-8 h-8 border-0 bg-transparent';
          case 'heart':
            return 'w-8 h-8 border-0 bg-transparent';
          default:
            return isPointer
              ? 'w-8 h-8 border-2 border-purple-500 bg-purple-500/20'
              : 'w-4 h-4 border-2 border-blue-400 bg-blue-400/30';
        }
    };

    const getTrailStyles = (index: number) => {
      const baseStyles = 'absolute rounded-full';
      if (currentStyle === 'rainbow') {
        const colors = ['from-red-500/40', 'via-yellow-500/40', 'to-green-500/40'];
        return `${baseStyles} bg-gradient-to-r ${colors[index % 3]}`;
      }
      if (currentStyle === 'purple') {
        return `${baseStyles} bg-gradient-to-r from-purple-500/40 to-pink-500/40`;
      }
      if (currentStyle === 'gold') {
        return `${baseStyles} bg-gradient-to-r from-yellow-400/40 to-orange-400/40`;
      }
      return `${baseStyles} bg-gradient-to-r from-purple-500/40 to-pink-500/40`;
    };

    return (
        <>
            <div
                className={`fixed pointer-events-none z-[9999] transition-all duration-75 ${getCursorStyles()}`}
                style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                }}
            >
                {currentStyle === 'star' && (
                    <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>⭐</span>
                )}
                {currentStyle === 'heart' && (
                    <span className="text-xl animate-bounce" style={{ animationDuration: '1s' }}>❤️</span>
                )}
                {currentStyle !== 'star' && currentStyle !== 'heart' && (
                    <div className={`w-full h-full ${currentStyle === 'gold' ? 'rotate-45' : ''}`} />
                )}
            </div>

            <div className="fixed pointer-events-none z-[9998]">
                {trails.map((trail, index) => (
                    <div
                        key={trail.id}
                        className={getTrailStyles(index)}
                        style={{
                            left: trail.x,
                            top: trail.y,
                            width: Math.max(4, 8 - index),
                            height: Math.max(4, 8 - index),
                            transform: 'translate(-50%, -50%)',
                            opacity: (index + 1) / trails.length * 0.5,
                        }}
                    />
                ))}
            </div>

            <button
                onClick={() => setShowCursorMenu(!showCursorMenu)}
                className="fixed bottom-4 right-4 z-[9997] w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-white/50 flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                title="Change cursor style"
            >
                {activeCursor.emoji}
            </button>

            {showCursorMenu && (
                <div className="fixed bottom-20 right-4 z-[9997] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/20 min-w-[200px]">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Choose Cursor</h4>
                    <div className="space-y-2">
                        {cursorUnlocks.map(cursor => (
                            <button
                                key={cursor.id}
                                onClick={() => {
                                    if (cursor.unlocked) {
                                        onRequestChange?.(cursor.id);
                                        setShowCursorMenu(false);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                                    cursor.unlocked
                                        ? cursor.id === currentStyle
                                            ? 'bg-purple-100 dark:bg-purple-900'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                            >
                                <span className="text-xl">{cursor.emoji}</span>
                                <div className="text-left">
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{cursor.label}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{cursor.condition}</div>
                                </div>
                                {!cursor.unlocked && <span className="ml-auto text-xs">🔒</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

export type { CursorStyle, CursorUnlock };