import { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import { useHistory } from '../contexts/HistoryContext';
import * as Dialog from '@radix-ui/react-dialog';

interface Operation {
  id: string;
  name: string;
  operation: {
    rules: string[];
    ignoreRules: string[];
    percentages: { operationType: string; percent: number }[];
  };
}

interface Rule {
  id: string;
  name: string;
  operations: Operation[];
}

const initialData: Rule[] = [
  {
    id: 'rule-1',
    name: 'Default Rule',
    operations: [
      {
        id: 'op-1',
        name: 'Standard Operation',
        operation: {
          rules: ['rule_a', 'rule_b'],
          ignoreRules: ['ignore_x'],
          percentages: [
            { operationType: 'Type A', percent: 60 },
            { operationType: 'Type B', percent: 40 },
          ],
        },
      },
    ],
  },
];

export function Settings() {
  const [rules, setRules] = useState<Rule[]>(initialData);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set(['rule-1']));
  const [showPreview, setShowPreview] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const { addHistoryEntry } = useHistory();
  const previousRulesRef = useRef<Rule[]>(initialData);

  const toggleRule = (ruleId: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const addRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      operations: [],
    };
    setRules([...rules, newRule]);
    toast.success('Rule added');
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast.success('Rule deleted');
  };

  const updateRuleName = (ruleId: string, name: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, name } : r));
  };

  const addOperation = (ruleId: string) => {
    const newOp: Operation = {
      id: `op-${Date.now()}`,
      name: 'New Operation',
      operation: {
        rules: [],
        ignoreRules: [],
        percentages: [],
      },
    };
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, operations: [...r.operations, newOp] } : r
    ));
    toast.success('Operation added');
  };

  const deleteOperation = (ruleId: string, opId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId
        ? { ...r, operations: r.operations.filter(op => op.id !== opId) }
        : r
    ));
    toast.success('Operation deleted');
  };

  const updateOperation = (ruleId: string, opId: string, updates: Partial<Operation>) => {
    setRules(rules.map(r =>
      r.id === ruleId
        ? {
            ...r,
            operations: r.operations.map(op =>
              op.id === opId ? { ...op, ...updates } : op
            ),
          }
        : r
    ));
  };

  const handleSave = () => {
    const oldRules = previousRulesRef.current;
    const newRules = rules;

    if (JSON.stringify(oldRules) !== JSON.stringify(newRules)) {
      const changedFields: string[] = [];

      if (oldRules.length !== newRules.length) {
        changedFields.push('rules');
      } else {
        newRules.forEach((rule, idx) => {
          const oldRule = oldRules[idx];
          if (oldRule && JSON.stringify(oldRule) !== JSON.stringify(rule)) {
            if (oldRule.name !== rule.name) {
              changedFields.push(`rules[${idx}].name`);
            }
            if (JSON.stringify(oldRule.operations) !== JSON.stringify(rule.operations)) {
              changedFields.push(`rules[${idx}].operations`);
            }
          }
        });
      }

      if (changedFields.length > 0) {
        addHistoryEntry({
          action: 'edit',
          changedFields,
          oldValue: { rules: oldRules },
          newValue: { rules: newRules },
        });
      }
    }

    previousRulesRef.current = JSON.parse(JSON.stringify(rules));
    toast.success('Settings saved successfully!');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);

      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        toast.error('Invalid JSON: must contain "rules" array');
        return;
      }

      const validatedRules: Rule[] = parsed.rules.map((rule: any) => ({
        id: rule.id || `rule-${Date.now()}-${Math.random()}`,
        name: rule.name || 'Imported Rule',
        operations: Array.isArray(rule.operations) ? rule.operations.map((op: any) => ({
          id: op.id || `op-${Date.now()}-${Math.random()}`,
          name: op.name || 'Imported Operation',
          operation: {
            rules: Array.isArray(op.operation?.rules) ? op.operation.rules : [],
            ignoreRules: Array.isArray(op.operation?.ignoreRules) ? op.operation.ignoreRules : [],
            percentages: Array.isArray(op.operation?.percentages) ? op.operation.percentages : [],
          },
        })) : [],
      }));

      setRules(validatedRules);
      setShowImportDialog(false);
      setImportText('');
      toast.success('Settings imported successfully!');
    } catch (error) {
      toast.error('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage rules and operations configuration</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
            >
              {showPreview ? 'Hide' : 'Show'} JSON
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors flex items-center gap-2"
            >
              <UploadIcon />
              Import JSON
            </button>
            <button
              onClick={addRule}
              className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors flex items-center gap-2"
            >
              <AddIcon />
              Add Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className={showPreview ? 'xl:col-span-8' : 'xl:col-span-12'}>
            <div className="space-y-4">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  expanded={expandedRules.has(rule.id)}
                  onToggle={() => toggleRule(rule.id)}
                  onDelete={() => deleteRule(rule.id)}
                  onUpdateName={(name) => updateRuleName(rule.id, name)}
                  onAddOperation={() => addOperation(rule.id)}
                  onDeleteOperation={(opId) => deleteOperation(rule.id, opId)}
                  onUpdateOperation={(opId, updates) => updateOperation(rule.id, opId, updates)}
                />
              ))}

              {rules.length === 0 && (
                <div className="text-center py-12 bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground mb-4">No rules configured</p>
                  <button
                    onClick={addRule}
                    className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
                  >
                    Add First Rule
                  </button>
                </div>
              )}
            </div>
          </div>

          {showPreview && (
            <div className="xl:col-span-4">
              <div className="sticky top-6">
                <h3 className="font-semibold mb-3 text-foreground">JSON Preview</h3>
                <pre className="bg-card border border-border rounded-lg p-4 text-sm overflow-auto max-h-[600px] text-foreground">
                  {JSON.stringify({ rules }, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => {
              setRules(JSON.parse(JSON.stringify(previousRulesRef.current)));
              toast.info('Changes discarded');
            }}
            className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors flex items-center gap-2"
          >
            <CancelIcon />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-[#10B981] text-white hover:bg-[#059669] transition-colors flex items-center gap-2"
          >
            <SaveIcon />
            Save Changes
          </button>
        </div>
      </div>

      <Dialog.Root open={showImportDialog} onOpenChange={setShowImportDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto z-50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold text-foreground">
                Import JSON Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <CloseIcon />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-muted-foreground mb-4">
              Paste your JSON configuration below. The format should match: {`{ "rules": [...] }`}
            </Dialog.Description>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"rules": [{"id": "rule-1", "name": "Example", "operations": []}]}'
              className="w-full h-64 px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
            />

            <div className="flex gap-3 justify-end mt-6">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors flex items-center gap-2"
              >
                <UploadIcon />
                Import
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DndProvider>
  );
}

function RuleCard({
  rule,
  expanded,
  onToggle,
  onDelete,
  onUpdateName,
  onAddOperation,
  onDeleteOperation,
  onUpdateOperation,
}: {
  rule: Rule;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
  onAddOperation: () => void;
  onDeleteOperation: (opId: string) => void;
  onUpdateOperation: (opId: string, updates: Partial<Operation>) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <ExpandMoreIcon
            className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">ID: {rule.id}</span>
              <input
                value={rule.name}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateName(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-[#3B82F6] focus:outline-none text-foreground"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddOperation();
            }}
            className="p-2 rounded hover:bg-[#3B82F6]/10 text-[#3B82F6] transition-colors"
          >
            <AddIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 rounded hover:bg-[#EF4444]/10 text-[#EF4444] transition-colors"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          {rule.operations.map(op => (
            <OperationCard
              key={op.id}
              operation={op}
              onDelete={() => onDeleteOperation(op.id)}
              onUpdate={(updates) => onUpdateOperation(op.id, updates)}
            />
          ))}
          {rule.operations.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No operations. Click + to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OperationCard({
  operation,
  onDelete,
  onUpdate,
}: {
  operation: Operation;
  onDelete: () => void;
  onUpdate: (updates: Partial<Operation>) => void;
}) {
  const addRule = (type: 'rules' | 'ignoreRules') => {
    const newRule = prompt(`Enter new ${type === 'rules' ? 'rule' : 'ignore rule'}:`);
    if (newRule) {
      onUpdate({
        operation: {
          ...operation.operation,
          [type]: [...operation.operation[type], newRule],
        },
      });
    }
  };

  const removeRule = (type: 'rules' | 'ignoreRules', index: number) => {
    onUpdate({
      operation: {
        ...operation.operation,
        [type]: operation.operation[type].filter((_, i) => i !== index),
      },
    });
  };

  const addPercentage = () => {
    onUpdate({
      operation: {
        ...operation.operation,
        percentages: [
          ...operation.operation.percentages,
          { operationType: 'New Type', percent: 0 },
        ],
      },
    });
  };

  const updatePercentage = (index: number, updates: Partial<{ operationType: string; percent: number }>) => {
    onUpdate({
      operation: {
        ...operation.operation,
        percentages: operation.operation.percentages.map((p, i) =>
          i === index ? { ...p, ...updates } : p
        ),
      },
    });
  };

  const removePercentage = (index: number) => {
    onUpdate({
      operation: {
        ...operation.operation,
        percentages: operation.operation.percentages.filter((_, i) => i !== index),
      },
    });
  };

  const totalPercent = operation.operation.percentages.reduce((sum, p) => sum + p.percent, 0);
  const isValidTotal = totalPercent === 100 || operation.operation.percentages.length === 0;

  return (
    <div className="bg-accent/30 border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <DragIndicatorIcon className="text-muted-foreground cursor-grab" />
          <span className="text-xs text-muted-foreground">ID: {operation.id}</span>
          <input
            value={operation.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="font-medium bg-transparent border-b border-transparent hover:border-border focus:border-[#3B82F6] focus:outline-none text-foreground"
          />
        </div>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-[#EF4444]/10 text-[#EF4444] transition-colors"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Rules</label>
            <button
              onClick={() => addRule('rules')}
              className="text-xs text-[#3B82F6] hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1">
            {operation.operation.rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="flex-1 text-foreground">{rule}</span>
                <button
                  onClick={() => removeRule('rules', idx)}
                  className="text-[#EF4444] hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            {operation.operation.rules.length === 0 && (
              <p className="text-xs text-muted-foreground">No rules</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Ignore Rules</label>
            <button
              onClick={() => addRule('ignoreRules')}
              className="text-xs text-[#3B82F6] hover:underline"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1">
            {operation.operation.ignoreRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="flex-1 text-foreground">{rule}</span>
                <button
                  onClick={() => removeRule('ignoreRules', idx)}
                  className="text-[#EF4444] hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            {operation.operation.ignoreRules.length === 0 && (
              <p className="text-xs text-muted-foreground">No ignore rules</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            Percentages
            {!isValidTotal && (
              <span className="ml-2 text-xs text-[#EF4444]">
                (Total: {totalPercent}% - must equal 100%)
              </span>
            )}
          </label>
          <button
            onClick={addPercentage}
            className="text-xs text-[#3B82F6] hover:underline"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {operation.operation.percentages.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={p.operationType}
                onChange={(e) => updatePercentage(idx, { operationType: e.target.value })}
                className="flex-1 px-3 py-2 rounded bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                <option>Type A</option>
                <option>Type B</option>
                <option>Type C</option>
                <option>{p.operationType}</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                value={p.percent}
                onChange={(e) => updatePercentage(idx, { percent: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 rounded bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <button
                onClick={() => removePercentage(idx)}
                className="p-1 rounded hover:bg-[#EF4444]/10 text-[#EF4444] transition-colors"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>
          ))}
          {operation.operation.percentages.length === 0 && (
            <p className="text-xs text-muted-foreground">No percentages</p>
          )}
        </div>
      </div>
    </div>
  );
}
