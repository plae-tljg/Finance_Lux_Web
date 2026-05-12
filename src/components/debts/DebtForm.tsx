import { useState } from 'react';
import { useDebtRepository, useAppDispatch } from '../../contexts';
import type { Debt, DebtType, InterestType } from '../../services/database/schemas/Debt';

interface DebtFormProps {
    initialData?: Debt;
    onSuccess: () => void;
    onCancel: () => void;
}

const debtTypes: { value: DebtType; label: string; icon: string }[] = [
    { value: 'credit_card', label: '信用卡', icon: '💳' },
    { value: 'loan', label: '贷款', icon: '💵' },
    { value: 'mortgage', label: '房贷', icon: '🏠' },
    { value: 'student_loan', label: '学生贷款', icon: '🎓' },
    { value: 'medical', label: '医疗债务', icon: '🏥' },
    { value: 'other', label: '其他', icon: '📋' },
];

const interestTypes: { value: InterestType; label: string }[] = [
    { value: 'fixed', label: '固定利率' },
    { value: 'variable', label: '浮动利率' },
];

const icons = ['💳', '💵', '🏠', '🚗', '🎓', '🏥', '📋', '💰', '🏦', '📚'];
const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

export function DebtForm({ initialData, onSuccess, onCancel }: DebtFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<DebtType>(initialData?.type || 'credit_card');
    const [creditor, setCreditor] = useState(initialData?.creditor || '');
    const [initialAmount, setInitialAmount] = useState(initialData?.initialAmount?.toString() || '');
    const [currentBalance, setCurrentBalance] = useState(initialData?.currentBalance?.toString() || '');
    const [interestRate, setInterestRate] = useState(initialData?.interestRate?.toString() || '');
    const [interestType, setInterestType] = useState<InterestType>(initialData?.interestType || 'fixed');
    const [minimumPayment, setMinimumPayment] = useState(initialData?.minimumPayment?.toString() || '');
    const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
    const [startDate, setStartDate] = useState(initialData?.startDate || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [icon, setIcon] = useState(initialData?.icon || '💳');
    const [color, setColor] = useState(initialData?.color || '#ef4444');

    const debtRepo = useDebtRepository();
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !initialAmount || !currentBalance || !dueDate || !startDate) {
            alert('请填写必填字段');
            return;
        }

        if (!debtRepo) {
            alert('数据库未就绪');
            return;
        }

        const data = {
            name,
            type,
            creditor,
            initialAmount: parseFloat(initialAmount),
            currentBalance: parseFloat(currentBalance),
            interestRate: parseFloat(interestRate) || 0,
            interestType,
            minimumPayment: parseFloat(minimumPayment) || 0,
            dueDate,
            startDate,
            status: 'active' as const,
            notes,
            icon,
            color,
        };

        if (initialData) {
            await debtRepo.update(initialData.id, data);
            const updated = await debtRepo.findById(initialData.id);
            if (updated) {
                dispatch({ type: 'UPDATE_DEBT', payload: updated });
            }
        } else {
            const id = await debtRepo.insert(data);
            const newDebt = await debtRepo.findById(id);
            if (newDebt) {
                dispatch({ type: 'ADD_DEBT', payload: newDebt });
            }
        }

        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        债务名称 *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="例如：信用卡债务"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        债务类型 *
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as DebtType)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    >
                        {debtTypes.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.icon} {t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    债权人
                </label>
                <input
                    type="text"
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    placeholder="例如：XX银行"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        原始金额 *
                    </label>
                    <input
                        type="number"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        当前余额 *
                    </label>
                    <input
                        type="number"
                        value={currentBalance}
                        onChange={(e) => setCurrentBalance(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        利率 (%) *
                    </label>
                    <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        利率类型 *
                    </label>
                    <select
                        value={interestType}
                        onChange={(e) => setInterestType(e.target.value as InterestType)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    >
                        {interestTypes.map((it) => (
                            <option key={it.value} value={it.value}>
                                {it.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        最低还款额
                    </label>
                    <input
                        type="number"
                        value={minimumPayment}
                        onChange={(e) => setMinimumPayment(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="0.00"
                        step="0.01"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        到期日 *
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    开始日期 *
                </label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    图标
                </label>
                <div className="flex gap-2 flex-wrap">
                    {icons.map((ic) => (
                        <button
                            key={ic}
                            type="button"
                            onClick={() => setIcon(ic)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                                icon === ic
                                    ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg scale-110'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {ic}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    颜色
                </label>
                <div className="flex gap-2 flex-wrap">
                    {colors.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full transition-all ${
                                color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                            }`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    备注
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    placeholder="添加备注..."
                    rows={3}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/30 transition-all"
                >
                    {initialData ? '更新' : '添加'}
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