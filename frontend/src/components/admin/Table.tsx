'use client';

import { Loader2 } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((item: T) => string);
  onRowClick?: (item: T) => void;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  getRowId?: (item: T) => string;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = '暂无数据',
  rowKey,
  onRowClick,
  selectedIds,
  onSelectChange,
  getRowId,
}: TableProps<T>) {
  const getKey = (item: T, index: number): string => {
    if (rowKey) {
      return typeof rowKey === 'function' ? rowKey(item) : String(item[rowKey]);
    }
    if (getRowId) {
      return getRowId(item);
    }
    return String(index);
  };

  const handleSelectAll = () => {
    if (!onSelectChange || !getRowId) return;
    if (selectedIds?.length === data.length) {
      onSelectChange([]);
    } else {
      onSelectChange(data.map((item) => getRowId(item)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectChange || !selectedIds) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const showCheckbox = !!onSelectChange && !!getRowId;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center py-20 text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {showCheckbox && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds?.length === data.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => {
              const key = getKey(item, index);
              const id = getRowId ? getRowId(item) : key;
              const isSelected = selectedIds?.includes(id);

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${isSelected ? 'bg-primary-50' : ''}
                  `}
                >
                  {showCheckbox && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4 text-sm text-gray-900">
                      {col.render
                        ? col.render(item, index)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
