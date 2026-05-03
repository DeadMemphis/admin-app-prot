import { useState } from 'react';
import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import { useHistory } from '../contexts/HistoryContext';

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { history } = useHistory();

  const filteredData = history.filter(entry => {
    const matchesSearch =
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.changedFields.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterAction === 'all' || entry.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Changed Fields', 'Old Value', 'New Value'];
    const rows = filteredData.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.user,
      entry.action,
      entry.changedFields.join(', '),
      JSON.stringify(entry.oldValue),
      JSON.stringify(entry.newValue),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'history.csv';
    a.click();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
        return 'text-[#10B981] bg-[#10B981]/10';
      case 'edit':
        return 'text-[#3B82F6] bg-[#3B82F6]/10';
      case 'delete':
        return 'text-[#EF4444] bg-[#EF4444]/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Change History</h1>
        <p className="text-muted-foreground mt-1">View all configuration changes and modifications</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by user or field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="pl-10 pr-8 py-2 rounded-lg bg-input-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#3B82F6] appearance-none cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="add">Add</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors flex items-center gap-2"
            >
              <DownloadIcon />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <HistoryIcon className="text-muted-foreground mx-auto mb-4 text-[64px]" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No History Found</h3>
          <p className="text-muted-foreground">There are no changes matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Changed Fields
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => toggleRow(entry.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {entry.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getActionColor(
                              entry.action
                            )}`}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {entry.changedFields.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-[#3B82F6] hover:underline flex items-center gap-1">
                            {expandedRows.has(entry.id) ? (
                              <>
                                <ExpandLessIcon fontSize="small" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ExpandMoreIcon fontSize="small" />
                                Show
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(entry.id) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 bg-accent/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                                  <span className="text-[#EF4444]">−</span> Old Value
                                </h4>
                                <pre className="bg-card border border-border rounded p-3 text-xs overflow-auto text-foreground">
                                  {entry.oldValue ? JSON.stringify(entry.oldValue, null, 2) : 'null'}
                                </pre>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                                  <span className="text-[#10B981]">+</span> New Value
                                </h4>
                                <pre className="bg-card border border-border rounded p-3 text-xs overflow-auto text-foreground">
                                  {entry.newValue ? JSON.stringify(entry.newValue, null, 2) : 'null'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}{' '}
              entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-[#3B82F6] text-white'
                        : 'border border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
