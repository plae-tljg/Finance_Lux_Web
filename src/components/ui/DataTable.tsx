import React, { useState, useMemo, useCallback } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onRowEdit?: (item: T) => void;
  onRowDelete?: (item: T) => void;
  onBulkDelete?: (items: T[]) => void;
  isLoading?: boolean;
  searchable?: boolean;
  pageable?: boolean;
  pageSizeOptions?: number[];
  exportable?: boolean;
  exportFileName?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  title,
  emptyMessage = 'No data available',
  onRowClick,
  onRowEdit,
  onRowDelete,
  onBulkDelete,
  isLoading = false,
  searchable = true,
  pageable = true,
  pageSizeOptions = [10, 20, 50, 100],
  exportable = true,
  exportFileName = 'export',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0] || 10);
  const [showColumns, setShowColumns] = useState<Set<string>>(new Set(columns.map(c => String(c.key))));
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const visibleColumns = useMemo(() =>
    columns.filter(c => showColumns.has(String(c.key))),
    [columns, showColumns]
  );

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        columns.some(col => {
          const value = item[col.key as keyof T];
          return value !== undefined && String(value).toLowerCase().includes(query);
        })
      );
    }

    columns.forEach(col => {
      const filterValue = filterValues[String(col.key)];
      if (filterValue) {
        result = result.filter(item => {
          const value = item[col.key as keyof T];
          return value !== undefined && String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchQuery, filterValues, columns]);

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortState.key as keyof T];
      const bVal = b[sortState.key as keyof T];
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');

      if (sortState.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredData, sortState]);

  const paginatedData = useMemo(() => {
    if (!pageable) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pageable]);

  const totalPages = useMemo(() =>
    pageable ? Math.ceil(sortedData.length / pageSize) : 1,
    [sortedData.length, pageSize, pageable]
  );

  const handleSort = useCallback((key: string) => {
    setSortState(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(item => String(item.id))));
    }
  }, [paginatedData, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = visibleColumns.map(c => c.header).join(',');
    const rows = sortedData.map(item =>
      visibleColumns.map(col => {
        const value = item[col.key as keyof T];
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    downloadFile(csv, `${exportFileName}.csv`, 'text/csv');
  }, [sortedData, visibleColumns, exportFileName]);

  const handleExportExcel = useCallback(() => {
    handleExportCSV();
  }, [handleExportCSV]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = useCallback((key: string) => {
    setShowColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const skeletonRows = pageable ? Math.min(pageSize, 5) : 5;

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-pulse">
        {title && (
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
        )}
        <div className="p-6 space-y-3">
          {[...Array(skeletonRows)].map((_, i) => (
            <div key={i} className="h-12 bg-gradient-to-r from-gray-200/50 via-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:via-gray-600/50 dark:to-gray-700/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {(searchable || exportable || pageable) && (
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-2">
            {exportable && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                  </svg>
                  Columns
                </button>
                {showColumnMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-3 z-50 min-w-[150px]">
                    {columns.map(col => (
                      <label key={String(col.key)} className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showColumns.has(String(col.key))}
                          onChange={() => toggleColumn(String(col.key))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{col.header}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {exportable && (
              <div className="flex gap-1">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-medium transition-all duration-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-medium transition-all duration-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {title && !searchable && !exportable && !pageable && (
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-900/80 dark:to-gray-800/80">
            <tr>
              {(onRowEdit || onRowDelete || onBulkDelete) && (
                <th className="px-4 py-3 text-left">
                  {onBulkDelete && (
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                </th>
              )}
              {visibleColumns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors' : ''} text-gray-600 dark:text-gray-300`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {col.sortable !== false && sortState.key === String(col.key) && (
                      <svg className={`w-4 h-4 transition-transform ${sortState.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {columns.some(c => c.filterable) && (
              <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                {(onRowEdit || onRowDelete || onBulkDelete) && (
                  <th className="px-4 py-2"></th>
                )}
                {visibleColumns.map(col => (
                  <th key={String(col.key)} className="px-4 py-2">
                    {col.filterable && (
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filterValues[String(col.key)] || ''}
                        onChange={e => { setFilterValues(prev => ({ ...prev, [String(col.key)]: e.target.value })); setCurrentPage(1); }}
                        className="w-full px-2 py-1 text-xs rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (onRowEdit || onRowDelete || onBulkDelete ? 1 : 0)} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-lg font-medium">{emptyMessage}</p>
                    <p className="text-sm mt-1">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map(item => (
                <tr
                  key={item.id}
                  className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {(onRowEdit || onRowDelete || onBulkDelete) && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {onBulkDelete && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(String(item.id))}
                            onChange={() => handleSelectOne(String(item.id))}
                            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                        {onRowEdit && (
                          <button
                            onClick={() => onRowEdit(item)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L6.414 13H5v2l8.586-8.586a2 2 0 012.828 0z" />
                            </svg>
                          </button>
                        )}
                        {onRowDelete && (
                          <button
                            onClick={() => onRowDelete(item)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.map(col => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item[col.key as keyof T], item)
                        : String(item[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageable && sortedData.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">of {sortedData.length} records</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-300"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && onBulkDelete && (
        <div className="px-6 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-t border-blue-200/50 dark:border-blue-700/50 flex items-center justify-between">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => { onBulkDelete(Array.from(selectedIds).map(id => data.find(item => String(item.id) === id)!)); setSelectedIds(new Set()); }}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
          >
            Delete Selected
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
