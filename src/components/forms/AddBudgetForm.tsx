import React, { useState, useEffect } from 'react';
import { useCategoryRepository, useBudgetRepository, useAppDispatch } from '../../contexts';
import type { Budget } from '../../services/database/schemas/Budget';
import type { Category } from '../../services/database/schemas/Category';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface AddBudgetFormProps {
  initialData?: Budget;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddBudgetForm: React.FC<AddBudgetFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const categoryRepo = useCategoryRepository();
  const budgetRepo = useBudgetRepository();
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>(
    initialData ? {
      name: initialData.name,
      categoryId: initialData.categoryId,
      amount: initialData.amount,
      period: initialData.period,
      startDate: initialData.startDate.split('T')[0],
      endDate: initialData.endDate.split('T')[0],
      month: initialData.month,
      isRegular: initialData.isRegular,
      isBudgetExceeded: initialData.isBudgetExceeded,
    } : {
      name: '',
      categoryId: 0,
      amount: 0,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      isRegular: true,
      isBudgetExceeded: false,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!categoryRepo || !budgetRepo) {
    return <div className="text-gray-500">Loading...</div>;
  }

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await categoryRepo.findAll();
      setCategories(cats);
      if (cats.length > 0 && formData.categoryId === 0) {
        setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const dayOfWeek = now.getDay();

    let startDate: Date;
    let endDate: Date;
    let monthStr: string;

    switch (formData.period) {
      case 'daily':
        startDate = new Date(year, month, date);
        endDate = new Date(year, month, date, 23, 59, 59);
        monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(date - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
        monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        break;
      case 'monthly':
      default:
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
        monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        monthStr = `${year}-01`;
        break;
    }

    const newStartStr = startDate.toISOString().split('T')[0];
    const newEndStr = endDate.toISOString().split('T')[0];

    if (newStartStr !== formData.startDate || newEndStr !== formData.endDate) {
      setFormData(prev => ({
        ...prev,
        startDate: newStartStr,
        endDate: newEndStr,
        month: monthStr,
      }));
    }
  }, [formData.period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Budget name is required');
      }
      if (formData.categoryId === 0) {
        throw new Error('Please select a category');
      }
      if (formData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (isEditing && initialData) {
        await budgetRepo.update(initialData.id, formData);
        const updatedBudget = { ...initialData, ...formData };
        dispatch({ type: 'UPDATE_BUDGET', payload: updatedBudget });
      } else {
        const newBudget = await budgetRepo.create(formData);
        dispatch({ type: 'ADD_BUDGET', payload: newBudget });
      }

      if (onSuccess) {
        onSuccess();
      }

      if (!isEditing) {
        setFormData({
          name: '',
          categoryId: categories.length > 0 ? categories[0].id : 0,
          amount: 0,
          period: 'monthly',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
          month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          isRegular: true,
          isBudgetExceeded: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Budget</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Budget Name"
        value={formData.name}
        onChange={e => handleChange('name', e.target.value)}
        placeholder="e.g., Monthly Food Budget"
        required
      />

      <Select
        label="Category"
        value={formData.categoryId}
        onChange={e => handleChange('categoryId', parseInt(e.target.value))}
        options={categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
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
        label="Period"
        value={formData.period}
        onChange={e => handleChange('period', e.target.value)}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={e => handleChange('startDate', e.target.value)}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={formData.endDate}
          onChange={e => handleChange('endDate', e.target.value)}
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isSubmitting}>Add</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
};