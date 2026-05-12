import { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, useDebtRepository } from '../contexts';
import { useTranslation } from '../i18n';
import { Modal } from '../components/ui/Modal';
import { DebtForm } from '../components/debts/DebtForm';
import { DebtPaymentModal } from '../components/debts/DebtPaymentModal';
import { debtService } from '../services/debt/DebtService';
import type { Debt } from '../services/database/schemas/Debt';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Debts() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const debtRepo = useDebtRepository();
    const { debts } = state;
    const { t } = useTranslation();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [stats, setStats] = useState<{
        total: number;
        active: number;
        paidOff: number;
        totalDebt: number;
        totalPaid: number;
        totalMinimumPayment: number;
    } | null>(null);

    useEffect(() => {
        if (debtRepo) {
            debtService.setDebtRepo(debtRepo);
            loadStats();
        }
    }, [debtRepo]);

    const loadStats = async () => {
        if (!debtRepo) return;
        const s = await debtRepo.getStats();
        setStats(s);
    };

    const handleDebtCreate = async (data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'paidOffAt'>) => {
        if (!debtRepo) return;

        const id = await debtRepo.insert(data);
        const newDebt = await debtRepo.findById(id);
        if (newDebt) {
            dispatch({ type: 'ADD_DEBT', payload: newDebt });
            loadStats();
        }
    };

    const handleDebtUpdate = async (id: number, data: Partial<Debt>) => {
        if (!debtRepo) return;

        await debtRepo.update(id, data);
        const updatedDebt = await debtRepo.findById(id);
        if (updatedDebt) {
            dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
            loadStats();
        }
    };

    const handleDebtDelete = async (id: number) => {
        if (!debtRepo) return;

        await debtRepo.delete(id);
        dispatch({ type: 'DELETE_DEBT', payload: id });
        loadStats();
    };

    const handleMakePayment = async (id: number, amount: number) => {
        if (!debtRepo) return;

        await debtRepo.makePayment(id, amount);
        const updatedDebt = await debtRepo.findById(id);
        if (updatedDebt) {
            dispatch({ type: 'UPDATE_DEBT', payload: updatedDebt });
            loadStats();
        }
        setShowPaymentModal(false);
        setPayingDebt(null);
    };

    const activeDebts = debts.filter(d => d.status === 'active');
    const paidOffDebts = debts.filter(d => d.status === 'paid_off');

    const chartData = {
        labels: activeDebts.map(d => d.name),
        datasets: [{
            data: activeDebts.map(d => d.currentBalance),
            backgroundColor: activeDebts.map(d => d.color || '#3b82f6'),
            borderColor: activeDebts.map(d => d.color || '#3b82f6'),
            borderWidth: 2,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 12 },
                },
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `${context.label}: ¥${context.raw.toLocaleString()}`;
                    },
                },
            },
        },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    {t('debts.title')}
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    + {t('debts.add')}
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: t('debts.active'), value: stats.active, color: 'red' },
                        { label: t('debts.paidOff'), value: stats.paidOff, color: 'green' },
                        { label: t('debts.totalDebt'), value: `¥${stats.totalDebt.toLocaleString()}`, color: 'orange' },
                        { label: t('debts.totalPaid'), value: `¥${stats.totalPaid.toLocaleString()}`, color: 'emerald' },
                    ].map((stat, i) => {
                        const colorClasses: Record<string, string> = {
                            red: 'text-red-500',
                            green: 'text-green-500',
                            orange: 'text-orange-500',
                            emerald: 'text-emerald-500',
                        };
                        return (
                            <div key={i} className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</div>
                                <div className={`text-2xl font-bold ${colorClasses[stat.color] || 'text-gray-800'} group-hover:scale-105 transition-transform`}>{stat.value}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeDebts.length > 0 && (
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('debts.distribution')}</h3>
                        <div className="h-64">
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    </div>
                )}

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('debts.repaymentProgress')}</h3>
                    <div className="space-y-4">
                        {activeDebts.slice(0, 5).map(debt => (
                            <div key={debt.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{debt.name}</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {debtService.calculateProgress(debt)}%
                                    </span>
                                </div>
                                <div className="relative h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${debtService.calculateProgress(debt)}%`,
                                            backgroundColor: debt.color || '#ef4444',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {activeDebts.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('debts.noActiveDebts')}</p>
                        )}
                    </div>
                </div>
            </div>

            {debts.length === 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-12 text-center">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('debts.noActiveDebts')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t('debts.startManaging')}</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/30 transition-all"
                    >
                        + {t('debts.addFirst')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debts.map(debt => (
                        <div
                            key={debt.id}
                            className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${debt.status === 'paid_off' ? 'ring-2 ring-green-500/50' : ''}`}
                        >
                            {debt.status === 'paid_off' && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-1 text-sm font-medium z-10">
                                    ✨ {t('debts.paidOffLabel')}
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                                            style={{ backgroundColor: `${debt.color}20` }}
                                        >
                                            {debt.icon || debtService.getDebtTypeIcon(debt.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">
                                                {debt.name}
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {debtService.getDebtTypeLabel(debt.type)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingDebt(debt);
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm(t('debts.confirmDelete'))) {
                                                    await handleDebtDelete(debt.id);
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {debt.creditor && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {t('debts.creditor')}: {debt.creditor}
                                    </p>
                                )}

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ¥{debt.currentBalance.toLocaleString()}
                                        </span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            ¥{debt.initialAmount.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="relative h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${debtService.calculateProgress(debt)}%`,
                                                backgroundColor: debt.status === 'paid_off' ? '#10b981' : debt.color,
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className={`font-medium ${debtService.calculateProgress(debt) >= 50 ? 'text-green-500' : 'text-orange-500'}`}>
                                            {debtService.calculateProgress(debt)}% {t('debts.paidPercentage')}
                                        </span>
                                        <span className={debtService.isDueSoon(debt.dueDate) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
                                            {debtService.isOverdue(debt.dueDate) ? t('debts.overdue') : `${debtService.getDaysUntilDue(debt.dueDate)} ${t('debts.daysUntilDue')}`}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/30 dark:border-gray-700/30">
                                        <span>{t('debts.interestRate')}: {debt.interestRate}%/{debt.interestType === 'fixed' ? t('debts.fixed') : t('debts.variable')}</span>
                                        <span>{t('debts.minimumPayment')}: ¥{debt.minimumPayment.toLocaleString()}</span>
                                    </div>
                                </div>

                                {debt.status !== 'paid_off' && (
                                    <button
                                        onClick={() => {
                                            setPayingDebt(debt);
                                            setShowPaymentModal(true);
                                        }}
                                        className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        💰 还款
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={t('debts.add')}
            >
                <DebtForm
                    onSuccess={() => setShowAddModal(false)}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingDebt(null);
                }}
                title={t('debts.edit')}
            >
                {editingDebt && (
                    <DebtForm
                        initialData={editingDebt}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingDebt(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingDebt(null);
                        }}
                    />
                )}
            </Modal>

            <Modal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPayingDebt(null);
                }}
                title={t('debts.makePayment')}
            >
                {payingDebt && (
                    <DebtPaymentModal
                        debt={payingDebt}
                        onSuccess={(amount) => handleMakePayment(payingDebt.id, amount)}
                        onCancel={() => {
                            setShowPaymentModal(false);
                            setPayingDebt(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}