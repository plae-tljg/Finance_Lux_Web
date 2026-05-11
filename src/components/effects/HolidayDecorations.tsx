import { useState, useEffect } from 'react';
import { useAppState } from '../../contexts/AppStateContext';

interface HolidayTheme {
    id: string;
    name: string;
    icon: string;
    startDate: string;
    endDate: string;
    gradient: string;
    accentColor: string;
    decorations: string[];
}

const HOLIDAY_THEMES: HolidayTheme[] = [
    {
        id: 'chinese-new-year',
        name: 'Chinese New Year',
        icon: '🧧',
        startDate: '01-01',
        endDate: '02-15',
        gradient: 'from-red-900 via-yellow-800 to-red-900',
        accentColor: '#dc2626',
        decorations: ['🧧', '🧨', '🎊', '🏮', '✨'],
    },
    {
        id: 'valentine',
        name: 'Valentine',
        icon: '💝',
        startDate: '02-01',
        endDate: '02-28',
        gradient: 'from-pink-900 via-rose-800 to-pink-900',
        accentColor: '#ec4899',
        decorations: ['💕', '💖', '💗', '💓', '✨'],
    },
    {
        id: 'spring',
        name: 'Spring',
        icon: '🌸',
        startDate: '03-01',
        endDate: '04-30',
        gradient: 'from-green-800 via-emerald-700 to-teal-800',
        accentColor: '#10b981',
        decorations: ['🌷', '🌹', '🌻', '🌺', '✨'],
    },
    {
        id: 'easter',
        name: 'Easter',
        icon: '🥚',
        startDate: '03-15',
        endDate: '04-30',
        gradient: 'from-purple-800 via-pink-700 to-yellow-700',
        accentColor: '#a855f7',
        decorations: ['🐰', '🥚', '🌼', '🪺', '✨'],
    },
    {
        id: 'summer',
        name: 'Summer',
        icon: '☀️',
        startDate: '06-01',
        endDate: '08-31',
        gradient: 'from-orange-800 via-amber-700 to-yellow-700',
        accentColor: '#f59e0b',
        decorations: ['🌴', '🏖️', '🍹', '🌊', '✨'],
    },
    {
        id: 'halloween',
        name: 'Halloween',
        icon: '🎃',
        startDate: '10-01',
        endDate: '11-01',
        gradient: 'from-orange-950 via-purple-900 to-orange-950',
        accentColor: '#f97316',
        decorations: ['🎃', '👻', '🦇', '🕷️', '✨'],
    },
    {
        id: 'christmas',
        name: 'Christmas',
        icon: '🎄',
        startDate: '12-01',
        endDate: '12-31',
        gradient: 'from-green-950 via-red-900 to-green-950',
        accentColor: '#22c55e',
        decorations: ['🎄', '🎅', '❄️', '🎁', '✨'],
    },
];

function isHolidayActive(theme: HolidayTheme): boolean {
    const now = new Date();
    const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const start = theme.startDate;
    const end = theme.endDate;

    if (start <= end) {
        return currentMonthDay >= start && currentMonthDay <= end;
    } else {
        return currentMonthDay >= start || currentMonthDay <= end;
    }
}

export function useHolidayTheme() {
    const [activeHoliday, setActiveHoliday] = useState<HolidayTheme | null>(null);
    const [showDecorations, setShowDecorations] = useState(false);
    const { state } = useAppState();

    useEffect(() => {
        const holiday = HOLIDAY_THEMES.find(isHolidayActive);
        setActiveHoliday(holiday || null);
        setShowDecorations(!!holiday);
    }, []);

    useEffect(() => {
        if (!activeHoliday) return;

        const event = new CustomEvent('luxury-holiday-theme', {
            detail: {
                theme: activeHoliday,
                gradient: activeHoliday.gradient,
                accentColor: activeHoliday.accentColor,
            },
        });
        window.dispatchEvent(event);
    }, [activeHoliday]);

    const toggleDecorations = () => setShowDecorations(!showDecorations);

    return {
        activeHoliday,
        showDecorations,
        toggleDecorations,
        isHolidayActive,
    };
}

export default function HolidayDecorations() {
    const { activeHoliday, showDecorations } = useHolidayTheme();

    if (!activeHoliday || !showDecorations) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {activeHoliday.decorations.map((emoji, index) => (
                <div
                    key={index}
                    className="absolute animate-float-slow"
                    style={{
                        left: `${10 + index * 18}%`,
                        top: `${5 + (index % 3) * 25}%`,
                        fontSize: '1.5rem',
                        animationDelay: `${index * 0.5}s`,
                        opacity: 0.6,
                    }}
                >
                    {emoji}
                </div>
            ))}
            <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-30"
                style={{ height: '2px' }}
            />
            <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-30"
                style={{ height: '2px' }}
            />
        </div>
    );
}

export { HOLIDAY_THEMES };