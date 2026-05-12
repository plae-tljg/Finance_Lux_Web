import React, { useState } from 'react';
import { useCategoryRepository, useBudgetRepository, useTransactionRepository, useAccountRepository, useAppDispatch } from '../../contexts';
import type { Transaction } from '../../services/database/schemas/Transaction';
import type { Category } from '../../services/database/schemas/Category';
import type { Budget } from '../../services/database/schemas/Budget';
import type { Account } from '../../services/database/schemas/Account';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { StickerPicker, type Sticker } from '../stickers/StickerPicker';

interface AddTransactionFormProps {
    initialData?: Transaction;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const categoryRepo = useCategoryRepository();
    const budgetRepo = useBudgetRepository();
    const accountRepo = useAccountRepository();
    const transactionRepo = useTransactionRepository();
    const dispatch = useAppDispatch();
    const isEditing = !!initialData;

    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [formData, setFormData] = useState<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>(
        initialData ? {
            amount: initialData.amount,
            categoryId: initialData.categoryId,
            accountId: initialData.accountId,
            budgetId: initialData.budgetId,
            description: initialData.description || '',
            date: initialData.date.split('T')[0],
            type: initialData.type,
            mood: initialData.mood || '',
            tags: initialData.tags || '',
            sticker: initialData.sticker || '',
        } : {
            amount: 0,
            categoryId: 0,
            accountId: 0,
            budgetId: 0,
            description: '',
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            mood: '',
            tags: '',
            sticker: '',
        }
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    if (!categoryRepo || !budgetRepo || !accountRepo || !transactionRepo) {
        return <div className="text-gray-500">Loading...</div>;
    }

    const loadCategories = async () => {
        const cats = await categoryRepo.findAll();
        setCategories(cats);
        if (cats.length > 0 && formData.categoryId === 0) {
            setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
        }
    };

    const loadBudgets = async () => {
        const budgetsData = await budgetRepo.findAll();
        setBudgets(budgetsData);
        if (budgetsData.length > 0 && formData.budgetId === 0) {
            setFormData(prev => ({ ...prev, budgetId: budgetsData[0].id }));
        }
    };

    const loadAccounts = async () => {
        const accountsData = await accountRepo.findActive();
        setAccounts(accountsData);
        if (accountsData.length > 0 && formData.accountId === 0) {
            setFormData(prev => ({ ...prev, accountId: accountsData[0].id }));
        }
    };

    React.useEffect(() => {
        loadCategories();
        loadBudgets();
        loadAccounts();
    }, []);

    React.useEffect(() => {
        if (formData.categoryId > 0) {
            const category = categories.find(c => c.id === formData.categoryId);
            if (category) {
                setFormData(prev => ({ ...prev, type: category.type }));
            }
        }
    }, [formData.categoryId, categories]);

    const handleStickerSelect = (sticker: Sticker) => {
        handleChange('sticker', sticker.emoji);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (formData.categoryId === 0) {
                throw new Error('Please select a category');
            }
            if (formData.accountId === 0) {
                throw new Error('Please select an account');
            }
            if (formData.budgetId === 0) {
                throw new Error('Please select a budget');
            }
            if (formData.amount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            if (isEditing && initialData) {
                await transactionRepo.update(initialData.id, formData);
                const updatedTransaction = { ...initialData, ...formData };
                dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
            } else {
                const newTransaction = await transactionRepo.create(formData);
                dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
            }

            if (onSuccess) {
                onSuccess();
            }

            if (!isEditing) {
                setFormData({
                    amount: 0,
                    categoryId: categories.length > 0 ? categories[0].id : 0,
                    accountId: accounts.length > 0 ? accounts[0].id : 0,
                    budgetId: budgets.length > 0 ? budgets[0].id : 0,
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    type: 'expense',
                    mood: '',
                    tags: '',
                    sticker: '',
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Transaction</h3>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            <Select
                label="Type"
                value={formData.type}
                onChange={e => handleChange('type', e.target.value)}
                options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                ]}
                required
            />

            <Input
                label="Amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                required
            />

            <Select
                label="Category"
                value={formData.categoryId}
                onChange={e => handleChange('categoryId', parseInt(e.target.value))}
                options={filteredCategories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
                placeholder="Select category"
                required
            />

            <Select
                label="Account"
                value={formData.accountId}
                onChange={e => handleChange('accountId', parseInt(e.target.value))}
                options={accounts.map(a => ({ value: a.id, label: `${a.icon} ${a.name}` }))}
                placeholder="Select account"
                required
            />

            <Select
                label="Budget"
                value={formData.budgetId}
                onChange={e => handleChange('budgetId', parseInt(e.target.value))}
                options={budgets.map(b => ({ value: b.id, label: b.name }))}
                placeholder="Select budget"
                required
            />

            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Mood</label>
                <div className="flex gap-2 flex-wrap">
                    {['', '😊', '😄', '😐', '😢', '😡', '🎉', '😍', '🤔'].map(mood => (
                        <button
                            key={mood}
                            type="button"
                            onClick={() => handleChange('mood', mood)}
                            className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                                formData.mood === mood
                                    ? 'bg-blue-500 scale-110 shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {mood || '-'}
                        </button>
                    ))}
                </div>
            </div>

            <Input
                label="Tags"
                value={formData.tags || ''}
                onChange={e => handleChange('tags', e.target.value)}
                placeholder="e.g., work, daily, important (comma separated)"
            />

            <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sticker</label>
                <button
                    type="button"
                    onClick={() => setShowStickerPicker(true)}
                    className="w-full h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 flex items-center justify-center gap-2 transition-colors"
                >
                    {formData.sticker ? (
                        <span className="text-2xl">{formData.sticker}</span>
                    ) : (
                        <span className="text-gray-400">Click to add sticker</span>
                    )}
                </button>
            </div>

            <Input
                label="Description"
                value={formData.description || ''}
                onChange={e => handleChange('description', e.target.value || '')}
                placeholder="e.g., Lunch at restaurant"
            />

            <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={e => handleChange('date', e.target.value)}
                required
            />

            {showStickerPicker && (
                <StickerPicker
                    onSelect={handleStickerSelect}
                    onClose={() => setShowStickerPicker(false)}
                    selectedSticker={formData.sticker || undefined}
                />
            )}

            <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isSubmitting}>Add</Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                )}
            </div>
        </form>
    );
};