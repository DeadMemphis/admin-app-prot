import { createContext, useContext, useState, ReactNode } from 'react';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'add' | 'edit' | 'delete';
  changedFields: string[];
  oldValue: any;
  newValue: any;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'user'>) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const initialHistory: HistoryEntry[] = [
  {
    id: '1',
    timestamp: '2026-05-01T14:30:00',
    user: 'admin@example.com',
    action: 'edit',
    changedFields: ['rules[0].name', 'rules[0].operations[0].percentages'],
    oldValue: { name: 'Old Rule', percentages: [{ type: 'A', percent: 50 }] },
    newValue: { name: 'Default Rule', percentages: [{ type: 'A', percent: 60 }, { type: 'B', percent: 40 }] },
  },
  {
    id: '2',
    timestamp: '2026-05-01T12:15:00',
    user: 'user@example.com',
    action: 'add',
    changedFields: ['rules[1]'],
    oldValue: null,
    newValue: { id: 'rule-2', name: 'New Rule', operations: [] },
  },
  {
    id: '3',
    timestamp: '2026-05-01T10:00:00',
    user: 'admin@example.com',
    action: 'delete',
    changedFields: ['rules[2]'],
    oldValue: { id: 'rule-3', name: 'Deleted Rule', operations: [] },
    newValue: null,
  },
  {
    id: '4',
    timestamp: '2026-04-30T16:45:00',
    user: 'user@example.com',
    action: 'edit',
    changedFields: ['rules[0].operations[0].name'],
    oldValue: { name: 'Old Operation' },
    newValue: { name: 'Standard Operation' },
  },
];

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);

  const addHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'user'>) => {
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      user: 'admin@example.com',
      ...entry,
    };
    setHistory(prev => [newEntry, ...prev]);
  };

  return (
    <HistoryContext.Provider value={{ history, addHistoryEntry }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
}
