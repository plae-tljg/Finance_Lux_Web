import { useState, useMemo } from 'react';
import { useAppState, useAppDispatch, useTransactionRepository } from '../contexts';
import { DataTable, type Column } from '../components/ui/DataTable';
import type { Transaction } from '../services/database/schemas/Transaction';

interface CalendarDay {
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    transactions: Transaction[];
    totalIncome: number;
    totalExpense: number;
}

export default function CalendarView() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const transactionRepo = useTransactionRepository();
    const { transactions, categories, accounts } = state;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const days: CalendarDay[] = [];

        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startPadding - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day).toISOString().split('T')[0];
            const dayTransactions = transactions.filter(t => t.date === date);
            days.push({
                date,
                day,
                isCurrentMonth: false,
                isToday: date === todayStr,
                transactions: dayTransactions,
                totalIncome: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day).toISOString().split('T')[0];
            const dayTransactions = transactions.filter(t => t.date === date);
            days.push({
                date,
                day,
                isCurrentMonth: true,
                isToday: date === todayStr,
                transactions: dayTransactions,
                totalIncome: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            });
        }

        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day).toISOString().split('T')[0];
            const dayTransactions = transactions.filter(t => t.date === date);
            days.push({
                date,
                day,
                isCurrentMonth: false,
                isToday: date === todayStr,
                transactions: dayTransactions,
                totalIncome: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            });
        }

        return days;
    }, [currentDate, transactions]);

    const weekView = useMemo(() => {
        if (viewMode !== 'week') return [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayTransactions = transactions.filter(t => t.date === dateStr);
            return {
                date: dateStr,
                dayName: weekDays[i],
                day: date.getDate(),
                isToday: dateStr === new Date().toISOString().split('T')[0],
                transactions: dayTransactions,
                totalIncome: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            };
        });
    }, [currentDate, transactions, viewMode]);

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const selectedDayTransactions = useMemo(() => {
        if (!selectedDate) return [];
        return transactions.filter(t => t.date === selectedDate);
    }, [selectedDate, transactions]);

    const handleDeleteTransaction = async (id: number) => {
        if (!transactionRepo) return;
        if (window.confirm('Delete this transaction?')) {
            try {
                await transactionRepo.delete(id);
                dispatch({ type: 'DELETE_TRANSACTION', payload: id });
                window.dispatchEvent(new CustomEvent('app-state-update'));
            } catch {
            }
        }
    };

    const selectedDayColumns: Column<Transaction>[] = [
        {
            key: 'description',
            header: 'Description',
            render: (value) => String(value) || '-'
        },
        {
            key: 'categoryId',
            header: 'Category',
            render: (_, item) => {
                const category = categories.find(c => c.id === (item as Transaction).categoryId);
                return (
                    <span className="flex items-center gap-2">
                        <span>{category?.icon}</span>
                        <span>{category?.name}</span>
                    </span>
                );
            }
        },
        {
            key: 'accountId',
            header: 'Account',
            render: (_, item) => {
                const account = accounts.find(a => a.id === (item as Transaction).accountId);
                return (
                    <span className="flex items-center gap-2">
                        <span>{account?.icon}</span>
                        <span>{account?.name}</span>
                    </span>
                );
            }
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (value, item) => {
                const t = item as Transaction;
                return (
                    <span className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}¥{Number(value).toLocaleString()}
                    </span>
                );
            }
        },
        {
            key: 'mood',
            header: 'Mood',
            render: (value) => value ? String(value) : '-'
        },
        {
            key: 'tags',
            header: 'Tags',
            render: (value) => {
                if (!value) return '-';
                const tags = String(value).split(',').map(t => t.trim()).filter(Boolean);
                return (
                    <div className="flex gap-1 flex-wrap">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: 'sticker',
            header: 'Sticker',
            render: (value) => value ? String(value) : '-'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">📅</span>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Calendar View</span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 font-medium flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        {viewMode === 'month' ? '📆 Week View' : '🗓️ Month View'}
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-5 py-2.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg font-medium"
                    >
                        Today
                    </button>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={prevMonth}
                        className="p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <span className="text-xl">←</span>
                    </button>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {monthName}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <span className="text-xl">→</span>
                    </button>
                </div>

                {viewMode === 'month' ? (
                    <>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={`
                                        relative p-2 min-h-24 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                                        ${day.isCurrentMonth ? 'bg-white/60 dark:bg-gray-700/60' : 'bg-gray-100/30 dark:bg-gray-900/30 opacity-50'}
                                        ${day.isToday ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/30' : ''}
                                        ${selectedDate === day.date ? 'ring-2 ring-purple-500 bg-purple-100/50 dark:bg-purple-900/50' : ''}
                                        ${day.transactions.length > 0 ? 'hover:bg-white/80 dark:hover:bg-gray-700/80' : ''}
                                        group
                                    `}
                                >
                                    <div className={`
                                        text-sm font-medium mb-1
                                        ${day.isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700 dark:text-gray-200'}
                                    `}>
                                        {day.day}
                                    </div>

                                    {day.transactions.length > 0 && (
                                        <div className="space-y-0.5">
                                            {day.totalIncome > 0 && (
                                                <div className="text-xs text-green-600 dark:text-green-400 font-medium truncate">
                                                    +¥{day.totalIncome.toLocaleString()}
                                                </div>
                                            )}
                                            {day.totalExpense > 0 && (
                                                <div className="text-xs text-red-600 dark:text-red-400 font-medium truncate">
                                                    -¥{day.totalExpense.toLocaleString()}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400">
                                                {day.transactions.length} transaction{day.transactions.length > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-2">
                        {weekView.map((day) => (
                            <div
                                key={day.date}
                                onClick={() => setSelectedDate(day.date)}
                                className={`
                                    p-4 rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg
                                    ${day.isToday ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 ring-2 ring-blue-500' : 'bg-white/60 dark:bg-gray-700/60'}
                                    ${selectedDate === day.date ? 'ring-2 ring-purple-500 bg-purple-100/50 dark:bg-purple-900/50' : ''}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex flex-col items-center justify-center
                                            ${day.isToday ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}
                                        `}>
                                            <div className="text-xs font-medium">{day.dayName}</div>
                                            <div className="text-lg font-bold">{day.day}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800 dark:text-white">
                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {day.transactions.length} transaction{day.transactions.length > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-right">
                                        <div>
                                            <div className="text-sm text-gray-500">Income</div>
                                            <div className="text-green-600 dark:text-green-400 font-semibold">
                                                +¥{day.totalIncome.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Expense</div>
                                            <div className="text-red-600 dark:text-red-400 font-semibold">
                                                -¥{day.totalExpense.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedDate === day.date && day.transactions.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div className="space-y-2">
                                            {day.transactions.slice(0, 3).map(t => (
                                                <div key={t.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{t.type === 'income' ? '📥' : '📤'}</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{t.description || 'No description'}</span>
                                                    </div>
                                                    <div className={`font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                            {day.transactions.length > 3 && (
                                                <div className="text-sm text-gray-500 text-center">
                                                    +{day.transactions.length - 3} more transactions
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedDate && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                            📋 Transactions on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {selectedDayTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <span className="text-4xl mb-2 block">📭</span>
                            <p>No transactions on this day</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 dark:border-green-400/20">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Total Income: </span>
                                        <span className="text-green-600 dark:text-green-400 font-semibold">
                                            +¥{selectedDayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Total Expense: </span>
                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                            -¥{selectedDayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DataTable
                                data={selectedDayTransactions}
                                columns={selectedDayColumns}
                                title={`${selectedDayTransactions.length} Transactions`}
                                emptyMessage="No transactions"
                                onRowDelete={(item) => handleDeleteTransaction((item as Transaction).id)}
                                searchable
                                pageable
                                pageSizeOptions={[5, 10, 20]}
                                exportable
                                exportFileName={`transactions-${selectedDate}`}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}