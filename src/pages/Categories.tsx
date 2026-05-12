import { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppStateContext';
import { useCategoryRepository } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { AddCategoryForm } from '../components/forms/AddCategoryForm';
import type { Category } from '../services/database/schemas/Category';

type FilterType = 'all' | 'income' | 'expense';
type SortField = 'name' | 'sortOrder';
type SortDirection = 'asc' | 'desc';

export default function Categories() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const categoryRepo = useCategoryRepository();
    const { categories } = state;

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Search and filters
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [showInactive, setShowInactive] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('sortOrder');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const clearFilters = () => {
        setSearchText('');
        setFilterType('all');
        setShowInactive(false);
    };

    const hasActiveFilters = searchText || filterType !== 'all' || showInactive;

    const filteredCategories = useMemo(() => {
        let result = categories.filter((c: Category) => {
            // Search text
            if (searchText && !c.name?.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }

            // Type filter
            if (filterType !== 'all' && c.type !== filterType) return false;

            // Inactive filter
            if (!showInactive && !c.isActive) return false;

            return true;
        });

        // Sort
        result.sort((a: Category, b: Category) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'sortOrder':
                    comparison = a.sortOrder - b.sortOrder;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [categories, searchText, filterType, showInactive, sortField, sortDirection]);

    const incomeCategories = filteredCategories.filter(c => c.type === 'income');
    const expenseCategories = filteredCategories.filter(c => c.type === 'expense');

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    // Stats
    const stats = useMemo(() => {
        const income = categories.filter(c => c.type === 'income').length;
        const expense = categories.filter(c => c.type === 'expense').length;
        const inactive = categories.filter(c => !c.isActive).length;
        return { income, expense, inactive, total: categories.length };
    }, [categories]);

    if (!categoryRepo) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    const handleDelete = async (id: number) => {
        try {
            await categoryRepo.delete(id);
            dispatch({ type: 'DELETE_CATEGORY', payload: id });
            setDeleteConfirm(null);
        } catch (err) {
            console.error('[Categories] Delete failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Categories</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    + Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">{stats.total}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Income</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">{stats.income}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expense</div>
                    <div className="text-2xl font-bold text-red-500 group-hover:scale-105 transition-transform">{stats.expense}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Inactive</div>
                    <div className="text-2xl font-bold text-gray-400 group-hover:scale-105 transition-transform">{stats.inactive}</div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search category name..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as FilterType)}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={e => setShowInactive(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Show inactive</span>
                    </label>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-700/50 transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💰</span>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Income Categories</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({incomeCategories.length})</span>
                        </div>
                        <button
                            onClick={() => toggleSort('name')}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            Sort{getSortIndicator('name')}
                        </button>
                    </div>
                    <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                        {incomeCategories.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No income categories</div>
                        ) : (
                            incomeCategories.map((category: Category) => (
                                <div key={category.id} className={`px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group ${!category.isActive ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{category.icon}</span>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{category.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Sort: {category.sortOrder} • {category.isDefault ? 'Default' : 'Custom'}{!category.isActive ? ' • Inactive' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {category.isDefault && (
                                                <span className="px-2 py-1 text-xs bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Default</span>
                                            )}
                                            {!category.isActive && (
                                                <span className="px-2 py-1 text-xs bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded">Inactive</span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(category.id)}
                                                className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 dark:from-red-900/20 dark:to-pink-900/20 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💸</span>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Expense Categories</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({expenseCategories.length})</span>
                        </div>
                        <button
                            onClick={() => toggleSort('name')}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            Sort{getSortIndicator('name')}
                        </button>
                    </div>
                    <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                        {expenseCategories.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No expense categories</div>
                        ) : (
                            expenseCategories.map((category: Category) => (
                                <div key={category.id} className={`px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group ${!category.isActive ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{category.icon}</span>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{category.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    Sort: {category.sortOrder} • {category.isDefault ? 'Default' : 'Custom'}{!category.isActive ? ' • Inactive' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {category.isDefault && (
                                                <span className="px-2 py-1 text-xs bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">Default</span>
                                            )}
                                            {!category.isActive && (
                                                <span className="px-2 py-1 text-xs bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded">Inactive</span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(category.id)}
                                                className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Category"
            >
                <AddCategoryForm onSuccess={() => setShowAddModal(false)} onCancel={() => setShowAddModal(false)} />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                }}
                title="Edit Category"
            >
                {editingCategory && (
                    <AddCategoryForm
                        initialData={editingCategory}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingCategory(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingCategory(null);
                        }}
                    />
                )}
            </Modal>

            <Modal
                isOpen={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Category"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete this category?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/30 transition-all"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-gray-200/50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300/50 dark:hover:bg-gray-600 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}