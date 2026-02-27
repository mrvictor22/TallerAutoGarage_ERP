'use client';

/**
 * DamageMarkerList
 *
 * Displays all damage markers placed on the vehicle diagram, grouped by view.
 * Each marker shows a severity color dot, damage type label, description, and
 * optional edit/delete actions.
 *
 * Usage:
 * ```tsx
 * import { DamageMarkerList } from '@/components/inspection/damage-marker-list';
 *
 * // Editable
 * <DamageMarkerList
 *   markers={markers}
 *   onEdit={(marker) => openEditDialog(marker)}
 *   onDelete={(id) => removeMarker(id)}
 * />
 *
 * // Read-only (e.g. inside a PDF or detail view)
 * <DamageMarkerList markers={markers} readOnly />
 * ```
 */

import { Camera, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type DamageMarker,
  type DiagramView,
  DAMAGE_TYPE_LABELS,
  DAMAGE_SEVERITY_LABELS,
  DAMAGE_SEVERITY_COLORS,
  DIAGRAM_VIEW_LABELS,
} from '@/types/inspection';

// Ordered list of views used for consistent section rendering
const VIEW_ORDER: DiagramView[] = ['front', 'top', 'left', 'right'];

interface DamageMarkerListProps {
  markers: DamageMarker[];
  onEdit?: (marker: DamageMarker) => void;
  onDelete?: (markerId: string) => void;
  readOnly?: boolean;
}

interface SeverityDotProps {
  severity: DamageMarker['severity'];
  className?: string;
}

function SeverityDot({ severity, className }: SeverityDotProps) {
  return (
    <span
      aria-label={DAMAGE_SEVERITY_LABELS[severity]}
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: DAMAGE_SEVERITY_COLORS[severity] }}
    />
  );
}

interface MarkerRowProps {
  marker: DamageMarker;
  onEdit?: (marker: DamageMarker) => void;
  onDelete?: (markerId: string) => void;
  readOnly: boolean;
}

function MarkerRow({ marker, onEdit, onDelete, readOnly }: MarkerRowProps) {
  return (
    <li
      className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/60"
      aria-label={`${DAMAGE_TYPE_LABELS[marker.damage_type]}, ${DAMAGE_SEVERITY_LABELS[marker.severity]}`}
    >
      {/* Severity dot aligned with first line of text */}
      <SeverityDot severity={marker.severity} className="mt-[3px]" />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {DAMAGE_TYPE_LABELS[marker.damage_type]}
          </span>
          <Badge
            variant="outline"
            className="shrink-0 text-[11px]"
            style={{
              color: DAMAGE_SEVERITY_COLORS[marker.severity],
              borderColor: DAMAGE_SEVERITY_COLORS[marker.severity] + '55',
              backgroundColor: DAMAGE_SEVERITY_COLORS[marker.severity] + '12',
            }}
          >
            {DAMAGE_SEVERITY_LABELS[marker.severity]}
          </Badge>
        </div>

        {marker.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {marker.description}
          </p>
        )}

        {(marker.photo_urls?.length ?? 0) > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Camera className="size-3" aria-hidden />
            <span>
              {marker.photo_urls.length} foto{marker.photo_urls.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => onEdit(marker)}
              aria-label={`Editar daño: ${DAMAGE_TYPE_LABELS[marker.damage_type]}`}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
              onClick={() => onDelete(marker.id)}
              aria-label={`Eliminar daño: ${DAMAGE_TYPE_LABELS[marker.damage_type]}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

interface ViewGroupProps {
  view: DiagramView;
  markers: DamageMarker[];
  onEdit?: (marker: DamageMarker) => void;
  onDelete?: (markerId: string) => void;
  readOnly: boolean;
}

function ViewGroup({ view, markers, onEdit, onDelete, readOnly }: ViewGroupProps) {
  if (markers.length === 0) return null;

  return (
    <section aria-labelledby={`view-group-${view}`}>
      {/* Group heading */}
      <div className="mb-1.5 flex items-center gap-2">
        <h4
          id={`view-group-${view}`}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {DIAGRAM_VIEW_LABELS[view]}
        </h4>
        <span
          className="text-xs tabular-nums text-muted-foreground"
          aria-label={`${markers.length} daño${markers.length !== 1 ? 's' : ''}`}
        >
          ({markers.length})
        </span>
      </div>

      {/* Marker rows */}
      <ul role="list" className="flex flex-col gap-1.5">
        {markers.map((marker) => (
          <MarkerRow
            key={marker.id}
            marker={marker}
            onEdit={onEdit}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ))}
      </ul>
    </section>
  );
}

export function DamageMarkerList({
  markers,
  onEdit,
  onDelete,
  readOnly = false,
}: DamageMarkerListProps) {
  // Group markers by view, preserving insertion order within each group
  const markersByView = VIEW_ORDER.reduce<Record<DiagramView, DamageMarker[]>>(
    (acc, view) => {
      acc[view] = markers.filter((m) => m.view === view);
      return acc;
    },
    { front: [], top: [], left: [], right: [] }
  );

  const hasMarkers = markers.length > 0;

  return (
    <section aria-label="Lista de daños marcados en el vehículo">
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Daños registrados</p>
        {hasMarkers && (
          <span
            className="text-xs tabular-nums text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {markers.length} daño{markers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!hasMarkers && (
        <div className="flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            No se han marcado daños
          </p>
        </div>
      )}

      {/* View groups */}
      {hasMarkers && (
        <div className="flex flex-col gap-4">
          {VIEW_ORDER.map((view) => (
            <ViewGroup
              key={view}
              view={view}
              markers={markersByView[view]}
              onEdit={onEdit}
              onDelete={onDelete}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}
