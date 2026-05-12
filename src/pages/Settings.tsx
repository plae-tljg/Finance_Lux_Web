import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { loadSettings, saveSettings, type Settings, defaultSettings } from '../services/settings/SettingsService';
import { databaseService } from '../services/database/DatabaseService';

export default function Settings() {
    const { state, actions } = useAppState();
    const [settings, setSettings] = useState<Settings>(() => loadSettings());
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoreData, setRestoreData] = useState<string | null>(null);
    const [backupStatus, setBackupStatus] = useState<string>('');

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const handleExportBackup = () => {
        const dbData = localStorage.getItem('finance_db_data');
        if (!dbData) {
            setBackupStatus('No data to backup');
            return;
        }

        const backup = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            data: dbData,
            settings,
            stats: {
                transactions: state.transactions.length,
                accounts: state.accounts.length,
                categories: state.categories.length,
                budgets: state.budgets.length,
                goals: state.goals.length,
            }
        };

        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSettings(prev => ({ ...prev, lastBackupDate: new Date().toISOString() }));
        setBackupStatus('Backup exported successfully!');
        setTimeout(() => setBackupStatus(''), 3000);
    };

    const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const backup = JSON.parse(content);

                if (!backup.data) {
                    setBackupStatus('Invalid backup file');
                    return;
                }

                setRestoreData(backup.data);
                if (backup.settings) {
                    setSettings(backup.settings);
                }
                setBackupStatus('Backup file loaded - click Restore to apply');
            } catch {
                setBackupStatus('Failed to parse backup file');
            }
        };
        reader.readAsText(file);
    };

    const handleRestoreBackup = () => {
        if (!restoreData) return;

        localStorage.setItem('finance_db_data', restoreData);
        setBackupStatus('Data restored! Reloading...');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('finance_db_data');
            localStorage.removeItem('luxury_finance_settings');
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Settings
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🌐</span> Language
                    </h3>
                    <div className="space-y-2">
                        {(['zh', 'en'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => actions.setLanguage(lang)}
                                className={`w-full px-4 py-3 rounded-xl transition-all ${
                                    state.language === lang
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {lang === 'zh' ? '中文' : 'English'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">💱</span> Currency
                    </h3>
                    <div className="space-y-2">
                        {['¥', '$', '€', '£'].map(curr => (
                            <button
                                key={curr}
                                onClick={() => setSettings(prev => ({ ...prev, currency: curr }))}
                                className={`w-full px-4 py-3 rounded-xl transition-all ${
                                    settings.currency === curr
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📅</span> Start of Week
                    </h3>
                    <div className="space-y-2">
                        {(['sunday', 'monday'] as const).map(day => (
                            <button
                                key={day}
                                onClick={() => setSettings(prev => ({ ...prev, startOfWeek: day }))}
                                className={`w-full px-4 py-3 rounded-xl transition-all ${
                                    settings.startOfWeek === day
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {day === 'sunday' ? 'Sunday' : 'Monday'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Display
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700 dark:text-gray-300">Compact Mode</span>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                                className={`w-12 h-6 rounded-full transition-all ${
                                    settings.compactMode ? 'bg-violet-500' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                    settings.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700 dark:text-gray-300">Show Pet</span>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, showPet: !prev.showPet }))}
                                className={`w-12 h-6 rounded-full transition-all ${
                                    settings.showPet ? 'bg-violet-500' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                    settings.showPet ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700 dark:text-gray-300">Show Particles</span>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, showParticles: !prev.showParticles }))}
                                className={`w-12 h-6 rounded-full transition-all ${
                                    settings.showParticles ? 'bg-violet-500' : 'bg-gray-300'
                                }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                    settings.showParticles ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </label>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">💾</span> Backup & Restore
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={handleExportBackup}
                            className="w-full px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            Export Backup
                        </button>
                        <label className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer text-center block">
                            Import Backup
                            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                        </label>
                        {restoreData && (
                            <button
                                onClick={handleRestoreBackup}
                                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                Confirm Restore
                            </button>
                        )}
                        {backupStatus && (
                            <p className="text-sm text-center text-violet-600 dark:text-violet-400">{backupStatus}</p>
                        )}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Data Stats
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Transactions</span>
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{state.transactions.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Accounts</span>
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{state.accounts.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Categories</span>
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{state.categories.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Budgets</span>
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{state.budgets.length}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Goals</span>
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{state.goals.length}</span>
                        </div>
                        {settings.lastBackupDate && (
                            <div className="flex justify-between text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span>Last Backup</span>
                                <span className="font-semibold text-violet-600 dark:text-violet-400">
                                    {new Date(settings.lastBackupDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200 dark:border-red-800/30 p-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> Danger Zone
                </h3>
                <button
                    onClick={handleClearData}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    Clear All Data
                </button>
            </div>
        </div>
    );
}