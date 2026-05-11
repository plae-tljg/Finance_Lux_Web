import React, { useState } from 'react';
import { useCategoryRepository, useAppDispatch } from '../../contexts';
import type { Category } from '../../services/database/schemas/Category';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/FormField';
import { Button } from '../ui/Button';

interface AddCategoryFormProps {
  initialData?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const categoryRepo = useCategoryRepository();
  const dispatch = useAppDispatch();
  const isEditing = !!initialData;
  const [formData, setFormData] = useState<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>(
    initialData ? {
      name: initialData.name,
      icon: initialData.icon,
      type: initialData.type,
      sortOrder: initialData.sortOrder,
      isDefault: initialData.isDefault,
      isActive: initialData.isActive,
    } : {
      name: '',
      icon: '',
      type: 'expense',
      sortOrder: 0,
      isDefault: false,
      isActive: true,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!categoryRepo) {
    return <div className="text-gray-500">Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Category name is required');
      }
      if (!formData.icon.trim()) {
        throw new Error('Category icon is required');
      }

      if (isEditing && initialData) {
        await categoryRepo.update(initialData.id, formData);
        const updatedCategory = { ...initialData, ...formData };
        dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      } else {
        const newCategory = await categoryRepo.create(formData);
        dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      }

      if (onSuccess) {
        onSuccess();
      }

      if (!isEditing) {
        setFormData({
          name: '',
          icon: '',
          type: 'expense',
          sortOrder: 0,
          isDefault: false,
          isActive: true,
        });
      }
    } catch (err) {
      console.error('[AddCategoryForm] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Category</h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="e.g., Food"
        required
      />

      <Input
        label="Icon"
        value={formData.icon}
        onChange={(e) => handleChange('icon', e.target.value)}
        placeholder="e.g., 🍚"
        required
      />

      <Select
        label="Type"
        value={formData.type}
        onChange={(e) => handleChange('type', e.target.value)}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        required
      />

      <Input
        label="Sort Order"
        type="number"
        value={formData.sortOrder}
        onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
      />

      <div className="space-y-2">
        <Checkbox
          label="Default category"
          checked={formData.isDefault}
          onChange={(e) => handleChange('isDefault', e.target.checked)}
        />
        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          Add
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};