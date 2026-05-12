import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppState } from '../../contexts/AppStateContext';
import { ParticleBackground, EasterEggs, PetCompanion, CustomCursor, ThemeSelector, HolidayDecorations } from '../effects';
import { AchievementsPanel, AchievementBadge } from '../achievements';
import { NotificationPanel } from '../notifications';
import { PWAInstallPrompt } from '../ui/PWAInstallPrompt';
import { loadSettings } from '../../services/settings/SettingsService';

const BASE_PATH = (import.meta.env.VITE_BASE_PATH as string) || (import.meta.env.PROD ? '/Finance-Management-Web' : '');

const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/transactions', label: 'Transactions', icon: '💸' },
    { to: '/budgets', label: 'Budgets', icon: '📋' },
    { to: '/accounts', label: 'Accounts', icon: '🏦' },
    { to: '/recurring', label: 'Recurring', icon: '🔄' },
    { to: '/categories', label: 'Categories', icon: '🏷️' },
    { to: '/calendar', label: 'Calendar', icon: '📅' },
    { to: '/goals', label: 'Goals', icon: '🎯' },
    { to: '/reports', label: 'Reports', icon: '📈' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
    { to: '/debugger', label: 'Debugger', icon: '🔧' },
];

export default function Layout() {
    const { state, actions } = useAppState();
    const { theme } = state;
    const bgImage = `${BASE_PATH}/background_zhuang.jpg`;
    const [showAchievements, setShowAchievements] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [customTheme, setCustomTheme] = useState(theme);
    const settings = useState(() => loadSettings())[0];

    useEffect(() => {
        const handleThemeChange = (e: CustomEvent) => {
            setCustomTheme(e.detail);
        };
        window.addEventListener('luxury-theme-change', handleThemeChange as EventListener);
        return () => window.removeEventListener('luxury-theme-change', handleThemeChange as EventListener);
    }, []);

    const themeClasses: Record<string, string> = {
        dark: 'bg-gray-900',
        light: 'bg-gray-100',
        purple: 'bg-purple-950',
        forest: 'bg-green-950',
        sunset: 'bg-orange-950',
        ocean: 'bg-cyan-950',
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-500 ${themeClasses[customTheme] || themeClasses.dark}`}
            style={customTheme === 'light' ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            } : {}}
        >
            {customTheme !== 'light' && (
                <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pointer-events-none" />
            )}

            {settings.showParticles && <ParticleBackground />}
            <HolidayDecorations />
            <EasterEggs />
            {settings.showPet && <PetCompanion />}
            <CustomCursor />

            <div className={`min-h-screen ${customTheme === 'light' ? '' : 'bg-black/30'}`}>
                <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl animate-pulse">💎</span>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Finance Manager
                                </h1>
                            </div>
                            <nav className="flex gap-2 flex-wrap items-center">
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="relative p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 shadow-lg hover:shadow-xl transition-all duration-300"
                                    title="Notifications"
                                >
                                    <span className="text-xl">🔔</span>
                                    {state.notifications.filter(n => !n.isRead).length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                                            {state.notifications.filter(n => !n.isRead).length}
                                        </span>
                                    )}
                                </button>
                                <AchievementBadge onClick={() => setShowAchievements(true)} />
                                {navItems.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-lg'
                                            }`
                                        }
                                    >
                                        <span>{item.icon}</span>
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </NavLink>
                                ))}
                                <ThemeSelector />
                                <button
                                    onClick={() => {
                                        actions.toggleTheme();
                                        const newTheme = theme === 'dark' ? 'light' : 'dark';
                                        if (newTheme === 'dark') {
                                            localStorage.setItem('dark_mode_used', 'true');
                                        }
                                    }}
                                    className="ml-2 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                >
                                    {theme === 'dark' ? '☀️' : '🌙'}
                                </button>
                                <button
                                    onClick={() => actions.toggleLanguage()}
                                    className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                                    title={state.language === 'en' ? 'Switch to Chinese' : '切换到英文'}
                                >
                                    {state.language === 'en' ? '中' : 'EN'}
                                </button>
                            </nav>
                        </div>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
                    <Outlet />
                </main>
                <AchievementsPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
                <NotificationPanel
                    notifications={state.notifications}
                    onMarkRead={(id) => actions.markNotificationRead(id)}
                    onMarkAllRead={() => actions.markAllNotificationsRead()}
                    onDelete={(id) => actions.deleteNotification(id)}
                    onClose={() => setShowNotifications(false)}
                />
                <PWAInstallPrompt />
            </div>
        </div>
    );
}