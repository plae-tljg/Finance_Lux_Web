import { useState } from 'react';
import type { Debt } from '../../services/database/schemas/Debt';
import { debtService } from '../../services/debt/DebtService';

interface DebtPaymentModalProps {
    debt: Debt;
    onSuccess: (amount: number) => void;
    onCancel: () => void;
}

export function DebtPaymentModal({ debt, onSuccess, onCancel }: DebtPaymentModalProps) {
    const [amount, setAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount || customAmount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('请输入有效的还款金额');
            return;
        }
        if (paymentAmount > debt.currentBalance) {
            alert('还款金额不能超过当前余额');
            return;
        }
        onSuccess(paymentAmount);
    };

    const progress = debtService.calculateProgress(debt);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${debt.color}20` }}
                    >
                        {debt.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">{debt.name}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {debtService.getDebtTypeLabel(debt.type)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">当前余额</span>
                        <p className="font-semibold text-red-500">¥{debt.currentBalance.toLocaleString()}</p>
                    </div>
                    <div>
                        <span className="text-gray-500 dark:text-gray-400">已还进度</span>
                        <p className="font-semibold text-green-500">{progress}%</p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择快捷金额
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, debt.minimumPayment].filter((v, i, a) => a.indexOf(v) === i).map((quickAmount) => (
                        <button
                            key={quickAmount}
                            type="button"
                            onClick={() => handleQuickAmount(quickAmount)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                amount === quickAmount.toString()
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            ¥{quickAmount.toLocaleString()}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    自定义金额
                </label>
                <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount('');
                    }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                    placeholder="输入还款金额"
                    step="0.01"
                    min="0.01"
                    max={debt.currentBalance}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 transition-all"
                >
                    确认还款
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                    取消
                </button>
            </div>
        </form>
    );
}