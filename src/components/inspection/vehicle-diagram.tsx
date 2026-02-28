'use client'

/**
 * VehicleDiagram
 *
 * Interactive vehicle diagram that lets users tap/click to place
 * damage markers on a vehicle. Supports four views (top, front, left, right)
 * and four body types (sedan, pickup, suv, van — suv/van fall back to sedan images).
 *
 * Uses professional vehicle blueprint images extracted from inspection sheets.
 * Dark mode is supported via CSS `invert` filter.
 */

import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  type VehicleBodyType,
  type DiagramView,
  type DamageMarker,
  DIAGRAM_VIEW_LABELS,
  DAMAGE_SEVERITY_COLORS,
  DAMAGE_TYPE_LABELS,
  DAMAGE_SEVERITY_LABELS,
} from '@/types/inspection'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VehicleDiagramProps {
  bodyType: VehicleBodyType
  markers: DamageMarker[]
  onAddMarker: (view: DiagramView, x: number, y: number) => void
  onSelectMarker?: (marker: DamageMarker) => void
  activeView: DiagramView
  onViewChange: (view: DiagramView) => void
  readOnly?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWS: DiagramView[] = ['top', 'front', 'left', 'right']

// Map each body type + view to the corresponding image path.
// suv and van reuse sedan images for V1.
const IMAGE_MAP: Record<'sedan' | 'pickup', Record<DiagramView, string>> = {
  sedan: {
    top: '/images/inspection/sedan-top.png',
    front: '/images/inspection/sedan-front.png',
    left: '/images/inspection/sedan-left.png',
    right: '/images/inspection/sedan-right.png',
  },
  pickup: {
    top: '/images/inspection/pickup-top.png',
    front: '/images/inspection/pickup-front.png',
    left: '/images/inspection/pickup-left.png',
    right: '/images/inspection/pickup-right.png',
  },
}

function resolveBodyType(bodyType: VehicleBodyType): 'sedan' | 'pickup' {
  if (bodyType === 'pickup') return 'pickup'
  // sedan, suv, van → sedan images
  return 'sedan'
}

// ─── Marker pin ───────────────────────────────────────────────────────────────

interface MarkerPinProps {
  marker: DamageMarker
  index: number
  onSelect?: (marker: DamageMarker) => void
  readOnly: boolean
}

function MarkerPin({ marker, index, onSelect, readOnly }: MarkerPinProps) {
  const color = DAMAGE_SEVERITY_COLORS[marker.severity]

  return (
    <div
      className="absolute"
      style={{
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    >
      <button
        type="button"
        aria-label={`Daño ${index}: ${DAMAGE_TYPE_LABELS[marker.damage_type]}, ${DAMAGE_SEVERITY_LABELS[marker.severity]}`}
        disabled={readOnly || !onSelect}
        onClick={(e) => {
          e.stopPropagation()
          if (!readOnly && onSelect) {
            onSelect(marker)
          }
        }}
        className={cn(
          'flex items-center justify-center p-3',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          !readOnly && onSelect ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-5 md:size-6 items-center justify-center rounded-full',
            'border-2 border-white shadow-md',
            'text-[10px] font-bold leading-none text-white',
            !readOnly && onSelect && 'transition-transform hover:scale-110 active:scale-95',
          )}
          style={{ backgroundColor: color }}
        >
          {index}
        </span>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VehicleDiagram({
  bodyType,
  markers,
  onAddMarker,
  onSelectMarker,
  activeView,
  onViewChange,
  readOnly = false,
}: VehicleDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Resolve which image to use
  const resolvedBody = resolveBodyType(bodyType)
  const imageSrc = IMAGE_MAP[resolvedBody][activeView]

  // Filter markers for the current view
  const viewMarkers = markers.filter((m) => m.view === activeView)

  // ── Click / tap handler ──────────────────────────────────────────────────

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (readOnly) return
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()

      let clientX: number
      let clientY: number

      if ('touches' in e) {
        const touch = e.touches[0] ?? e.changedTouches[0]
        if (!touch) return
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      // Convert to 0–100 percentage coordinates relative to container
      const rawX = ((clientX - rect.left) / rect.width) * 100
      const rawY = ((clientY - rect.top) / rect.height) * 100

      // Clamp to [0, 100]
      const x = Math.min(100, Math.max(0, rawX))
      const y = Math.min(100, Math.max(0, rawY))

      onAddMarker(activeView, x, y)
    },
    [activeView, onAddMarker, readOnly],
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* ── View selector tabs ─────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Vista del diagrama de vehículo"
        className="flex gap-1 rounded-lg border border-border bg-muted p-1"
      >
        {VIEWS.map((view) => {
          const isActive = view === activeView
          return (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="vehicle-diagram-canvas"
              onClick={() => onViewChange(view)}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                'min-h-[2.75rem]',
              )}
            >
              {DIAGRAM_VIEW_LABELS[view]}
            </button>
          )
        })}
      </div>

      {/* ── Image canvas ─────────────────────────────────────────────── */}
      <div
        id="vehicle-diagram-canvas"
        role="tabpanel"
        aria-label={`Diagrama: ${DIAGRAM_VIEW_LABELS[activeView]}`}
        className={cn(
          'relative select-none rounded-xl border border-border bg-muted/30',
          'max-w-2xl mx-auto w-full',
          !readOnly && 'cursor-crosshair',
        )}
        ref={containerRef}
        onClick={handleCanvasClick}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleCanvasClick(e as unknown as React.TouchEvent<HTMLDivElement>)
        }}
      >
        {/* Vehicle blueprint image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`Diagrama ${resolvedBody} - vista ${DIAGRAM_VIEW_LABELS[activeView]}`}
          className={cn(
            'w-full h-auto pointer-events-none',
            'dark:invert dark:brightness-90',
            'p-4 md:p-6',
          )}
          style={{ clipPath: 'inset(0 round 0.75rem)' }}
          draggable={false}
        />

        {/* Damage marker pins */}
        {viewMarkers.map((marker, idx) => (
          <MarkerPin
            key={marker.id}
            marker={marker}
            index={idx + 1}
            onSelect={onSelectMarker}
            readOnly={readOnly}
          />
        ))}

        {/* Instructional hint */}
        {!readOnly && viewMarkers.length === 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3"
          >
            <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              Toca para marcar un daño
            </span>
          </div>
        )}
      </div>

      {/* ── Marker count badge for current view ────────────────────────── */}
      {viewMarkers.length > 0 && (
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-right text-xs text-muted-foreground tabular-nums"
        >
          {viewMarkers.length} daño{viewMarkers.length !== 1 ? 's' : ''} en esta vista
        </p>
      )}
    </div>
  )
}
