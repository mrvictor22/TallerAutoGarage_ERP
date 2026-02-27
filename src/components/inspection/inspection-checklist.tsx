'use client';

/**
 * InspectionChecklist
 *
 * Displays a grid of inventory items that can be checked/unchecked during
 * vehicle intake inspection.
 *
 * Usage:
 * ```tsx
 * import { InspectionChecklist } from '@/components/inspection/inspection-checklist';
 * import { DEFAULT_CHECKLIST_ITEMS } from '@/types/inspection';
 * import { generateId } from '@/lib/utils';
 *
 * const [items, setItems] = useState<InventoryCheckItem[]>(
 *   DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, id: generateId() }))
 * );
 *
 * <InspectionChecklist items={items} onChange={setItems} />
 * <InspectionChecklist items={items} onChange={setItems} readOnly />
 * ```
 */

import { useCallback, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { InventoryCheckItem } from '@/types/inspection';

interface InspectionChecklistProps {
  items: InventoryCheckItem[];
  onChange: (items: InventoryCheckItem[]) => void;
  readOnly?: boolean;
}

interface ChecklistItemRowProps {
  item: InventoryCheckItem;
  readOnly: boolean;
  onToggle: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

function ChecklistItemRow({
  item,
  readOnly,
  onToggle,
  onNotesChange,
}: ChecklistItemRowProps) {
  const [notesOpen, setNotesOpen] = useState<boolean>(
    Boolean(item.checked && item.notes)
  );

  const handleToggle = useCallback(() => {
    if (!readOnly) {
      onToggle(item.id);
    }
  }, [readOnly, onToggle, item.id]);

  const handleNotesIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNotesOpen((prev) => !prev);
    },
    []
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onNotesChange(item.id, e.target.value);
    },
    [onNotesChange, item.id]
  );

  const checkboxId = `checklist-item-${item.id}`;

  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2.5 transition-colors',
        item.checked
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
          : 'border-border bg-transparent'
      )}
    >
      {/* Row: checkbox + label + notes toggle */}
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={checkboxId}
          checked={item.checked}
          disabled={readOnly}
          onCheckedChange={handleToggle}
          aria-label={item.label}
          className={cn(
            'shrink-0',
            item.checked &&
              'border-green-500 bg-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
          )}
        />

        <Label
          htmlFor={checkboxId}
          className={cn(
            'flex-1 cursor-pointer text-sm font-normal leading-snug',
            readOnly && 'cursor-default',
            item.checked
              ? 'text-green-800 dark:text-green-300'
              : 'text-foreground'
          )}
        >
          {item.label}
        </Label>

        {/* Notes toggle — only visible when checked and not readOnly */}
        {item.checked && !readOnly && (
          <button
            type="button"
            onClick={handleNotesIconClick}
            aria-label={notesOpen ? 'Cerrar notas' : 'Agregar nota'}
            className={cn(
              'rounded p-2 -m-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              notesOpen && 'text-foreground'
            )}
          >
            {notesOpen ? (
              <X className="size-3.5" aria-hidden />
            ) : (
              <Pencil className="size-3.5" aria-hidden />
            )}
          </button>
        )}

        {/* ReadOnly: show note icon indicator if there is a note */}
        {item.checked && readOnly && item.notes && (
          <Pencil
            className="size-3.5 shrink-0 text-green-600 dark:text-green-400"
            aria-label="Tiene nota"
          />
        )}
      </div>

      {/* Notes input — slides in when notesOpen */}
      {item.checked && (notesOpen || (readOnly && item.notes)) && (
        <div className="mt-2 pl-[1.625rem]">
          <Input
            value={item.notes ?? ''}
            onChange={handleNotesChange}
            disabled={readOnly}
            placeholder="Agregar observación..."
            aria-label={`Nota para ${item.label}`}
            className={cn(
              'h-9 text-sm',
              readOnly &&
                'cursor-default border-transparent bg-transparent px-0 shadow-none focus-visible:ring-0 disabled:opacity-100'
            )}
          />
        </div>
      )}
    </div>
  );
}

export function InspectionChecklist({
  items,
  onChange,
  readOnly = false,
}: InspectionChecklistProps) {
  const handleToggle = useCallback(
    (id: string) => {
      onChange(
        items.map((item) =>
          item.id === id
            ? { ...item, checked: !item.checked, notes: !item.checked ? item.notes : '' }
            : item
        )
      );
    },
    [items, onChange]
  );

  const handleNotesChange = useCallback(
    (id: string, notes: string) => {
      onChange(
        items.map((item) => (item.id === id ? { ...item, notes } : item))
      );
    },
    [items, onChange]
  );

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <section aria-label="Lista de inventario del vehículo">
      {/* Header / summary */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Inventario del vehículo
        </p>
        <span
          className={cn(
            'text-xs tabular-nums',
            checkedCount > 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-muted-foreground'
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {checkedCount} / {items.length} presente{checkedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div
        role="list"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {items.map((item) => (
          <div key={item.id} role="listitem">
            <ChecklistItemRow
              item={item}
              readOnly={readOnly}
              onToggle={handleToggle}
              onNotesChange={handleNotesChange}
            />
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No hay artículos en la lista de inventario.
        </p>
      )}
    </section>
  );
}
