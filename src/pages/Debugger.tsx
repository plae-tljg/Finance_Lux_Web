import { useState, useRef } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { importService, type ImportResult } from '../services/import/ImportService';

export default function Debugger() {
    const { state, actions } = useAppState();
    const { categories, budgets, transactions, accounts, accountBalances } = state;

    const [activeTable, setActiveTable] = useState<string>('categories');
    const [importStatus, setImportStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    

    const exportTable = (tableName: string, data: unknown[]) => {
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAll = () => {
        const allData = {
            categories,
            accounts,
            accountBalances,
            budgets,
            transactions,
            exportedAt: new Date().toISOString()
        };
        const jsonData = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-all-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        setImportStatus('Importing...');

        try {
            setImportStatus('Clearing existing data...');

            const result: ImportResult = await importService.importFromFile(file);

            if (result.success) {
                setImportStatus(`Import complete: ${result.imported.categories} categories, ${result.imported.accounts} accounts, ${result.imported.accountBalances} balances, ${result.imported.budgets} budgets, ${result.imported.transactions} transactions. Refreshing state...`);
                await actions.loadAllData();
                setImportStatus(`Import complete: ${result.imported.categories} categories, ${result.imported.accounts} accounts, ${result.imported.accountBalances} balances, ${result.imported.budgets} budgets, ${result.imported.transactions} transactions. Done!`);
            } else {
                setImportStatus(`Import failed: ${result.message}. ${result.errors.length} errors.`);
            }
        } catch (err) {
            setImportStatus(`Import error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const tableConfigs = [
        { key: 'categories', label: 'Categories', data: categories, count: categories.length },
        { key: 'accounts', label: 'Accounts', data: accounts, count: accounts.length },
        { key: 'account_balances', label: 'Account Balances', data: accountBalances, count: accountBalances.length },
        { key: 'budgets', label: 'Budgets', data: budgets, count: budgets.length },
        { key: 'transactions', label: 'Transactions', data: transactions, count: transactions.length },
    ];

    const activeConfig = tableConfigs.find(t => t.key === activeTable) || tableConfigs[0];

    const renderTable = () => {
        const data = activeConfig.data as unknown[];
        if (data.length === 0) {
            return (
                <div className="p-12 text-center">
                    <span className="text-4xl mb-4 block">📭</span>
                    <p className="text-gray-500 dark:text-gray-400">No data in this table</p>
                </div>
            );
        }

        const columns = Object.keys(data[0] as Record<string, unknown>);

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-100/50 to-gray-50/50 dark:from-gray-700/50 dark:to-gray-800/50">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 capitalize">
                                    {col.replace(/([A-Z])/g, ' $1').replace(/^ /, '')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gradient-to-r hover:from-teal-50/30 hover:to-cyan-50/30 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-colors group">
                                {columns.map(col => (
                                    <td key={col} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {String((row as Record<string, unknown>)[col] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Database Debugger
                </h2>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => exportTable(activeTable, activeConfig.data)}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        Export {activeConfig.label}
                    </button>
                    <button
                        onClick={exportAll}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        Export All
                    </button>
                    <label className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
                        Import All
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {importStatus && (
                <div className="bg-gradient-to-r from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/30 backdrop-blur-xl border border-orange-300/50 dark:border-orange-700/50 text-orange-800 dark:text-orange-300 px-4 py-3 rounded-xl shadow-lg">
                    {importStatus}
                </div>
            )}

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-4">
                <div className="flex flex-wrap gap-2">
                    {tableConfigs.map(table => (
                        <button
                            key={table.key}
                            onClick={() => setActiveTable(table.key)}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                                activeTable === table.key
                                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                                    : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            {table.label} ({table.count})
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-100/50 to-gray-50/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200/30 dark:border-gray-600/30 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{activeConfig.label}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{activeConfig.count} records</span>
                </div>
                {renderTable()}
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span> Database Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {tableConfigs.map(table => (
                        <div className="group bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-4 text-center border border-gray-200/30 dark:border-gray-600/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform">{table.count}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{table.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}